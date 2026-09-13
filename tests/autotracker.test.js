import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceTracker,analysisDimensions,DEFAULT_TRACKING_OPTIONS,extractPatch,retuneTracker,seedTracker,upsertTrackedPoint} from '../src/utils/autotracker.js';
function frameAt(x=35,y=25,visible=true){
  const width=100,height=80,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<data.length;i+=4)data.set([150,150,150,255],i);
  if(visible)for(let j=0;j<11;j++)for(let i=0;i<11;i++){
    const v=(i-5)**2+(j-5)**2<12?30:150;
    data.set([v,v,v,255],((y+j)*width+x+i)*4);
  }
  return {width,height,data};
}
const options={...DEFAULT_TRACKING_OPTIONS,size:11,radius:40};
test('AT-04: disappearing target cannot mutate the accepted session',()=>{
  const seed=seedTracker(frameAt(),40.5,30.5,options),before=structuredClone(seed);
  assert.equal(advanceTracker(frameAt(0,0,false),seed,options),null);
  assert.deepEqual(seed,before);
});
test('AT-03/05: visible translation follows object and preserves original keyframe',()=>{
  const seed=seedTracker(frameAt(),40.5,30.5,options);
  const next=advanceTracker(frameAt(40,30),seed,options);
  assert.ok(next);assert.ok(Math.abs(next.last.x-45.5)<.1);assert.ok(Math.abs(next.last.y-35.5)<.1);
  assert.equal(next.initial,seed.initial);assert.notEqual(next.template,seed.template);
});
test('AT-04: flat target cannot be initialized',()=>{
  assert.equal(seedTracker(frameAt(0,0,false),40,30,options),null);
});
test('AT-05: include candidate at final valid image edge',()=>{
  const seed=seedTracker(frameAt(70,25),75.5,30.5,options);
  const next=advanceTracker(frameAt(89,25),seed,options);
  assert.ok(next);assert.equal(next.last.x,94.5);
});
test('AT-05: dimensions preserve scale for landscape and portrait; no upscaling',()=>{
  assert.deepEqual(analysisDimensions(1920,1080),{width:676,height:380});
  assert.deepEqual(analysisDimensions(1080,1920),{width:214,height:380});
  assert.deepEqual(analysisDimensions(100,80),{width:100,height:80});
  assert.equal(extractPatch(frameAt(),95,0,11),null);
});
test('AT-05/07: same-frame replacement preserves other measurements and schema',()=>{
  const old=[{id:'a',time:.017,x:1,y:2},{id:'b',time:.05,x:3,y:4}];
  const next={id:'c',time:.02,x:5,y:6};
  const points=upsertTrackedPoint(old,next,30);
  assert.equal(points.length,2);assert.equal(points[0],next);assert.equal(old.length,2);
  assert.deepEqual(JSON.parse(JSON.stringify(points)),points);
});

test('AT-UI-07: search and matching adjustments preserve the accepted template and motion history',()=>{
  const seed=seedTracker(frameAt(),40.5,30.5,options);
  const session=advanceTracker(frameAt(40,30),seed,options);
  const before=structuredClone(session);
  for(const changes of [{radius:80},{predict:false},{threshold:98},{evolution:.5}]) {
    assert.equal(retuneTracker(frameAt(0,0,false),session,options,{...options,...changes}),session);
    assert.deepEqual(session,before);
  }
});
test('AT-UI-07: resizing captures the current frame without mutating the old session',()=>{
  const seed=seedTracker(frameAt(),40.5,30.5,options);
  const before=structuredClone(seed);
  const frame=frameAt(37,25);
  const resized=retuneTracker(frame,seed,options,{...options,size:21});
  assert.ok(resized);
  assert.equal(resized.template.width,21);
  assert.deepEqual(resized.last,seed.last);
  assert.deepEqual(resized.template,extractPatch(frame,30,20,21));
  assert.equal(resized.initial,resized.template);
  assert.deepEqual(seed,before);
});
test('AT-UI-09: defaults restore size; invalid resized targets require re-selection',()=>{
  const seed=seedTracker(frameAt(),40.5,30.5,options);
  const restored=retuneTracker(frameAt(),seed,options,DEFAULT_TRACKING_OPTIONS);
  assert.equal(restored.template.width,DEFAULT_TRACKING_OPTIONS.size);
  assert.equal(retuneTracker(frameAt(0,0,false),seed,options,DEFAULT_TRACKING_OPTIONS),null);
  const edge=seedTracker(frameAt(0,25),5.5,30.5,options);
  assert.ok(edge);
  assert.equal(retuneTracker(frameAt(0,25),edge,options,DEFAULT_TRACKING_OPTIONS),null);
});
