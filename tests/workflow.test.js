import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workflowReadiness, nextToolbarStep} from '../src/utils/workflow.js';
import {GUIDE_TEXT} from '../src/utils/guideText.js';

const base = () => ({videoSrc:null,imageSrc:null,videoDims:{w:0,h:0},duration:0,
  error:null,lineProfile:null,spectralData:[],objects:[{id:'A',points:[]},{id:'B',points:[]}],
  activeObjId:'A',pixelsPerMeter:null,origin:null,fpsConfirmed:false,viewMode:'tracker'});
const video = () => ({...base(),videoSrc:'blob:video',videoDims:{w:1920,h:1080},duration:10});

test('GW-02: restored measurements require media; loading and failed decoding are not ready', () => {
  const s=base();s.objects[0].points=[{time:0,x:10,y:20}];
  assert.equal(workflowReadiness(s).suggested,0);
  s.videoSrc='blob:video';
  assert.equal(workflowReadiness(s).ready,false);
  Object.assign(s,{videoDims:{w:1920,h:1080},duration:10,error:'decode failed'});
  assert.equal(workflowReadiness(s).ready,false);
});

test('GW-02/10: guide follows calibration and current object, without modifying measurements', () => {
  const s=video();s.objects[0].points=[{time:0,x:10,y:20}];
  Object.assign(s,{pixelsPerMeter:100,origin:{x:0,y:0},fpsConfirmed:true});
  const before=structuredClone(s);
  assert.equal(workflowReadiness(s).suggested,3);
  assert.deepEqual(s,before);
  s.activeObjId='B';assert.equal(workflowReadiness(s).suggested,2);
  s.activeObjId='COM';assert.equal(workflowReadiness(s).count,0);
  s.objects[1].points=[{time:0,x:20,y:20}];assert.equal(workflowReadiness(s).count,1);
  s.pixelsPerMeter=null;assert.equal(workflowReadiness(s).prepared,false);
});

test('GW-12: image light profile bypasses FPS and motion calibration', () => {
  const s={...base(),imageSrc:'blob:image',imageObj:{},videoDims:{w:200,h:100},
    lineProfile:{},spectralData:[{index:0},{index:1}]};
  assert.equal(workflowReadiness(s).prepared,true);
  assert.equal(workflowReadiness(s).suggested,3);
  s.viewMode='analysis';assert.equal(workflowReadiness(s).suggested,4);
  s.imageObj=null;assert.equal(workflowReadiness(s).ready,false);
});

test('GW-09: guide instruction keys and steps have EN/ES coverage', () => {
  assert.deepEqual(Object.keys(GUIDE_TEXT.en).sort(),Object.keys(GUIDE_TEXT.es).sort());
  assert.equal(GUIDE_TEXT.en.steps.length,GUIDE_TEXT.es.steps.length);
});

test('GW-08: local saving reports failure and recovery, skips transient changes, and keeps project schema', async () => {
  const oldStorage=globalThis.localStorage;
  const oldError=console.error;
  const writes=[];
  let fail=false;
  globalThis.localStorage={getItem:()=>null,setItem:(key,value)=>{
    if(fail)throw new Error('quota exceeded');
    writes.push({key,value:JSON.parse(value)});
  }};
  console.error=()=>{};
  try {
    const {useStore}=await import('../src/store/useStore.js');
    useStore.getState().setFps(60);
    assert.equal(useStore.getState().saveStatus,'saved');
    const count=writes.length;
    useStore.getState().setMousePos({x:1,y:2});
    useStore.getState().setFpsConfirmed(true);
    assert.equal(writes.length,count);
    useStore.getState().setVideoSrc('blob:new-video');
    assert.equal(useStore.getState().fpsConfirmed,false);
    fail=true;useStore.getState().setUncertaintyPx(5);
    assert.equal(useStore.getState().saveStatus,'error');
    assert.equal(writes.length,count);
    fail=false;useStore.getState().setUncertaintyPx(6);
    assert.equal(useStore.getState().saveStatus,'saved');
    assert.equal(writes.at(-1).value.uncertaintyPx,6);
    assert.equal('fpsConfirmed' in writes.at(-1).value,false);
    assert.equal('saveStatus' in writes.at(-1).value,false);
    useStore.getState().setFpsConfirmed(true);
    useStore.getState().setFps(120);
    assert.equal(useStore.getState().fpsConfirmed,false);
  } finally {
    globalThis.localStorage=oldStorage;
    console.error=oldError;
  }
});


test('Toolbar cue follows completed preparation and stops during tracking', () => {
  const s=base();
  assert.equal(nextToolbarStep(s),'media');
  Object.assign(s,video());
  assert.equal(nextToolbarStep(s),null);
  s.fpsConfirmed=true;
  assert.equal(nextToolbarStep(s),'scale');
  s.pixelsPerMeter=100;
  assert.equal(nextToolbarStep(s),'axes');
  s.origin={x:10,y:20}; // Opening the tool creates an origin but is not confirmation.
  assert.equal(nextToolbarStep(s),'axes');
  s.axesConfirmed=true;
  assert.equal(nextToolbarStep(s),'track');
  assert.equal(nextToolbarStep(s,true),null);
  s.isTracking=true;
  assert.equal(nextToolbarStep(s),null);
  s.isTracking=false;s.objects[0].points=[{x:10,y:20,time:0}];
  assert.equal(nextToolbarStep(s),null);
  s.objects[0].points=[];s.lineProfile={};
  assert.equal(nextToolbarStep(s),null);
});
