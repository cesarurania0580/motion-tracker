import {useEffect, useRef, useState} from 'react';
import {useStore} from '../store/useStore';
import {upsertTrackedPoint} from '../utils/autotracker';
import {DETAIL_OPTIONS as DEFAULT_TRACKING_OPTIONS, seedDetailed, retuneDetailed, advanceDetailed, trackingRegion, predictTarget} from '../utils/detailTracker';
import {seekVideo} from '../utils/videoSeek';

export function useAutotracking(videoRef) {
  const [enabled,setEnabled]=useState(false);
  const [status,setStatus]=useState('off');
  const [options,setOptions]=useState({...DEFAULT_TRACKING_OPTIONS});
  const [preview,setPreview]=useState(null);
  const [target,setTarget]=useState(null);
  const [failure,setFailure]=useState(null);
  const [confidence,setConfidence]=useState(null);
  const state=useRef({enabled:false,options:{...DEFAULT_TRACKING_OPTIONS},session:null,abort:null,canvas:null,writing:false,pauseRequested:false});

  function invalidate(next='select') {
    const s=state.current;
    s.abort?.abort(); s.abort=null; s.session=null; s.pauseRequested=false;
    setPreview(null); setTarget(null); setFailure(null); setConfidence(null); setStatus(s.enabled?next:'off');
  }

  // Subscription invalidates synchronously, before an old seek can append a point.
  useEffect(()=>{
    const unsubscribe=useStore.subscribe((next,prev)=>{
      const s=state.current;
      const contextChanged=['videoSrc','imageSrc','activeObjId','fps','fpsConfirmed','viewMode'].some(k=>next[k]!==prev[k]);
      const toolChanged=(next.spectrumInteractionVersion!==prev.spectrumInteractionVersion) || ['isTracking','isCalibrating','isSettingOrigin','activeClickTarget'].some(k=>next[k] && next[k]!==prev[k]);
      const pointsChanged=next.objects!==prev.objects && !s.writing;
      if(contextChanged || toolChanged || pointsChanged){
        s.abort?.abort();s.abort=null;s.session=null;s.pauseRequested=false;
        setTarget(null);setPreview(null);setFailure(null);setConfidence(null);
        if(contextChanged || toolChanged){s.enabled=false;setEnabled(false);setStatus('off');}
        else setStatus(s.enabled?'select':'off');
      }
    });
    const current=state.current;
    return ()=>{unsubscribe();current.abort?.abort();};
  },[]);

  function capture(center) {
    const video=videoRef.current;
    if(!video || video.readyState<2 || video.seeking)throw new Error('Video not ready');
    const region=trackingRegion(video.videoWidth,video.videoHeight,center,state.current.options);
    if(region.width<1 || region.height<1)throw new Error('Search outside video');
    const canvas=state.current.canvas ??= document.createElement('canvas');
    canvas.width=region.width;canvas.height=region.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    // One source pixel per analysis pixel: no whole-frame downsampling.
    ctx.drawImage(video,region.x,region.y,region.width,region.height,0,0,region.width,region.height);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    return {width:frame.width,height:frame.height,data:frame.data,originX:region.x,originY:region.y};
  }

  function showSession(session) {
    const native={...session.last},predicted=predictTarget(session,state.current.options);
    setTarget({...native,width:session.template.width,height:session.template.height,
      searchX:predicted.x,searchY:predicted.y,
      radiusX:state.current.options.radius,radiusY:state.current.options.radius});
    const c=document.createElement('canvas');c.width=session.template.width;c.height=session.template.height;
    c.getContext('2d').putImageData(new ImageData(session.template.data,c.width,c.height),0,0);
    setPreview(c.toDataURL());
    setConfidence(session.confidence ?? null);
    return native;
  }

  function record(session) {
    const s=state.current,store=useStore.getState(),video=videoRef.current;
    if(store.activeObjId==='COM')return;
    const native=showSession(session);
    const point={...native,time:video.currentTime,id:crypto.randomUUID()};
    s.writing=true;
    try {store.setPoints(points=>upsertTrackedPoint(points,point,store.fps));}
    finally{s.writing=false;}
    store.setCurrentTime(video.currentTime);
    store.setCurrentFrameIndex(Math.floor(video.currentTime*store.fps+1e-6));
  }

  function toggle() {
    const s=state.current;
    invalidate();
    if(s.enabled){s.enabled=false;setEnabled(false);setStatus('off');return;}
    const store=useStore.getState();
    if(!videoRef.current || !store.videoSrc || !store.fpsConfirmed || store.activeObjId==='COM')return;
    videoRef.current.pause();
    store.setIsPlaying(false);store.setIsTracking(false);store.setIsCalibrating(false);store.setIsSettingOrigin(false);store.setShowInputModal(false);store.setActiveClickTarget(null);
    s.enabled=true;setEnabled(true);setStatus('select');
  }

  function select(x,y) {
    const s=state.current;
    const ui=useStore.getState();
    if(!s.enabled || ui.sidebarTab!=='controls' || ui.sidebarViews.controls!=='automatic')return false;
    invalidate();
    videoRef.current.pause();useStore.getState().setIsPlaying(false);
    try {
      const frame=capture({x,y});
      const session=seedDetailed(frame,x,y,s.options);
      if(!session){setStatus('invalid');return true;}
      s.session=session;record(session);setStatus('ready');
    } catch {setStatus('error');}
    return true;
  }

  function applyOptions(next) {
    const s=state.current;
    if(s.abort)return; // Wait for the current decoded frame to settle.
    const previous=s.options;
    s.options=next;setOptions(next);
    if(!s.session)return;
    try {
      const frame=capture(s.session.last);
      const updated=retuneDetailed(frame,s.session,previous,next);
      s.session=updated;
      if(!updated){setTarget(null);setPreview(null);setStatus('invalid');return;}
      showSession(updated); // Preview only: never record() when tuning.
      setStatus('ready');
    } catch {s.session=null;setTarget(null);setPreview(null);setStatus('error');}
  }

  function changeOption(key,value) {
    applyOptions({...state.current.options,[key]:value});
  }

  function pause() {
    const s=state.current;
    if(!s.abort)return;
    s.pauseRequested=true;
    setStatus('pausing');
  }

  async function run(continuous) {
    const s=state.current,video=videoRef.current;
    if(!s.enabled || !s.session || s.abort || !video || !useStore.getState().fpsConfirmed)return;
    video.pause();useStore.getState().setIsPlaying(false);
    const controller=new AbortController();s.abort=controller;s.pauseRequested=false;
    setStatus('running');
    try {
      do {
        if(s.pauseRequested){setStatus('ready');break;}
        const fps=useStore.getState().fps;
        const frameIndex=Math.floor(video.currentTime*fps+1e-6)+1;
        const nextTime=(frameIndex+.5)/fps;
        if(nextTime>=video.duration){setStatus('ended');s.session=null;break;}
        await seekVideo(video,nextTime,controller.signal);
        if(controller.signal.aborted)break;
        const frame=capture(predictTarget(s.session,s.options));
        const result=advanceDetailed(frame,s.session,s.options);
        if(!result.session){
          s.session=null;setFailure(result.reason);setConfidence(result.match?.confidence ?? null);setStatus('lost');break;
        }
        s.session=result.session;record(result.session);
        if(!continuous || s.pauseRequested){setStatus('ready');break;}
        // Yield so Pause and navigation can cancel before the next frame.
        await new Promise(resolve=>setTimeout(resolve,0));
      } while(!controller.signal.aborted);
    } catch(error) {
      if(error.name!=='AbortError'){s.session=null;setStatus('error');}
    } finally {if(s.abort===controller){s.abort=null;s.pauseRequested=false;}}
  }

  return {enabled,status,options,preview,target,failure,confidence,toggle,select,changeOption,
    step:()=>run(false),run:()=>run(true),pause,navigate:()=>invalidate(),
    reselect:()=>invalidate(),restoreDefaults:()=>applyOptions({...DEFAULT_TRACKING_OPTIONS})};
}
