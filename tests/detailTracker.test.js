import test from 'node:test';
import assert from 'node:assert/strict';
import {DETAIL_OPTIONS,seedDetailed,advanceDetailed,trackingRegion,retuneDetailed} from '../src/utils/detailTracker.js';
function frame(targets=[[40,40]],background=150) {
  const width=160,height=120,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<data.length;i+=4)data.set([background,background,background,255],i);
  for(const [x,y] of targets)for(let j=-7;j<=7;j++)for(let i=-3;i<=3;i++){
    const value=j<0?40:220;
    data.set([value,value,value,255],((y+j)*width+x+i)*4);
  }
  return {width,height,data};
}
test('AT-DT-01: ROI preserves native pixels and clips at media edges',()=>{
  assert.deepEqual(trackingRegion(1080,1920,{x:500,y:1000},DETAIL_OPTIONS),{x:447,y:947,width:106,height:106});
  const r=trackingRegion(1080,1920,{x:2,y:1918},DETAIL_OPTIONS);
  assert.equal(r.x,0);assert.equal(r.y+r.height,1920);
});
test('AT-DT-02: native target follows translation despite background brightness change',()=>{
  const seed=seedDetailed(frame(),40.5,40.5);
  const result=advanceDetailed(frame([[44,37]],170),seed);
  assert.ok(result.session,result.reason);
  assert.ok(Math.abs(result.session.last.x-44.5)<.6);
  assert.ok(Math.abs(result.session.last.y-37.5)<.6);
});
test('AT-DT-02: disappearance and ambiguous duplicates do not mutate the accepted session',()=>{
  const seed=seedDetailed(frame(),40.5,40.5),before=structuredClone(seed);
  assert.equal(advanceDetailed(frame([]),seed).session,null);
  assert.equal(advanceDetailed(frame([[30,40],[65,40]]),seed).reason,'ambiguous');
  assert.deepEqual(seed,before);
});
test('AT-DT-01/03: crop offsets and settings preserve the measured coordinate system',()=>{
  const f={...frame(),originX:400,originY:900};
  const seed=seedDetailed(f,440.5,940.5);
  assert.deepEqual(seed.last,{x:440.5,y:940.5});
  assert.equal(retuneDetailed(f,seed,DETAIL_OPTIONS,{...DETAIL_OPTIONS,radius:80}),seed);
  const resized=retuneDetailed(f,seed,DETAIL_OPTIONS,{...DETAIL_OPTIONS,size:31});
  assert.deepEqual(resized.last,seed.last);
  assert.equal(resized.template.width,31);
});
test('AT-DT-02: coarse-to-fine search finds a displaced feature without losing native precision',()=>{
  const opts={...DETAIL_OPTIONS,size:51,radius:100};
  const seed=seedDetailed(frame(),40.5,40.5,opts);
  const moved=advanceDetailed(frame([[105,75]]),seed,opts);
  assert.ok(moved.session,moved.reason);
  assert.ok(Math.abs(moved.session.last.x-105.5)<.6);
  assert.ok(Math.abs(moved.session.last.y-75.5)<.6);
});
test('AT-DT-03: color and texture changes do not learn a flat background',()=>{
  const opts={...DETAIL_OPTIONS,evolution:.5,tether:0};
  let session=seedDetailed(frame(),40.5,40.5,opts);
  for(let i=1;i<=4;i++) {
    const next=advanceDetailed(frame([[40+i,40-i]],150+i*5),session,opts);
    assert.ok(next.session,next.reason);session=next.session;
  }
  const before=structuredClone(session);
  assert.equal(advanceDetailed(frame([],170),session,opts).session,null);
  assert.deepEqual(session,before);
});
