import {useEffect, useRef, useState} from 'react';
import {useStore} from '../store/useStore';
import {seekVideo} from '../utils/videoSeek';

export function usePointReview(videoRef, tracking) {
  const [selection,setSelection]=useState(null);
  const [status,setStatus]=useState('idle');
  const request=useRef(null);
  const selected=useRef(null);

  function cancel() {
    request.current?.abort();request.current=null;selected.current=null;
    setSelection(null);setStatus('idle');
  }

  useEffect(()=>{
    const unsubscribe=useStore.subscribe((next,prev)=>{
      const contextChanged=['videoSrc','imageSrc','activeObjId','fps','viewMode','sidebarTab'].some(key=>next[key]!==prev[key]);
      const toolsChanged=['isTracking','isCalibrating','isSettingOrigin','activeClickTarget','isPlaying','dragState'].some(key=>next[key] && next[key]!==prev[key]);
      const pointsChanged=next.objects.find(obj=>obj.id===next.activeObjId)?.points!==prev.objects.find(obj=>obj.id===prev.activeObjId)?.points;
      // During our seek, time updates are expected. Later navigation cancels review.
      const navigated=!request.current && next.currentTime!==prev.currentTime;
      if(contextChanged || toolsChanged || pointsChanged || navigated)cancel();
    });
    const escape=event=>{if(event.key==='Escape')cancel();};
    window.addEventListener('keydown',escape);
    return ()=>{unsubscribe();window.removeEventListener('keydown',escape);request.current?.abort();};
  },[]);

  function stopTools() {
    if(tracking.enabled)tracking.toggle();
    else tracking.navigate();
    videoRef.current?.pause();
    useStore.setState({isPlaying:false,isTracking:false,isCalibrating:false,isSettingOrigin:false,
      activeClickTarget:null,showInputModal:false,dragState:null,draggedPointIndex:null});
  }

  // Automatic mode has hook-local state, rather than a store tool flag.
  useEffect(()=>{
    if(tracking.enabled && selected.current)cancel();
  },[tracking.enabled]);

  async function select(index) {
    cancel();stopTools();
    const state=useStore.getState();
    const point=state.objects.find(obj=>obj.id===state.activeObjId)?.points[index];
    if(!point || state.activeObjId==='COM' || (!state.videoSrc && !state.imageObj))return;
    const next={objectId:state.activeObjId,index,point};
    selected.current=next;setSelection(next);setStatus('loading');
    const controller=new AbortController();request.current=controller;
    try {
      if(state.videoSrc) {
        const video=videoRef.current;
        if(!video || video.readyState<2 || !Number.isFinite(point.time) || point.time<0 || point.time>=video.duration)throw new Error('Invalid frame');
        if(video.seeking || Math.abs(video.currentTime-point.time)>0.001)await seekVideo(video,point.time,controller.signal);
        if(controller.signal.aborted)return;
        useStore.setState({currentTime:video.currentTime,currentFrameIndex:Math.floor(video.currentTime*state.fps+1e-6)});
      }
      if(!controller.signal.aborted)setStatus('ready');
    } catch(error) {
      if(error.name!=='AbortError')setStatus('error');
    } finally {if(request.current===controller)request.current=null;}
  }

  function apply(position) {
    const current=selected.current, state=useStore.getState();
    if(!current || (status!=='ready' && status!=='correcting'))return;
    if(position && (position.x<0 || position.y<0 || position.x>=state.videoDims.w || position.y>=state.videoDims.h))return;
    state.editPoint(current.objectId,current.index,current.point,position);
    cancel();
  }

  return {selection,status,select,cancel,
    correct:()=>{if(status==='ready')setStatus('correcting');},
    place:position=>{if(status==='correcting')apply(position);},
    remove:()=>{if(status==='ready')apply(null);},
    undo:()=>{cancel();stopTools();useStore.getState().undoPointEdit();}};
}
