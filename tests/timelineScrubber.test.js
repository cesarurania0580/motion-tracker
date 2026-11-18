import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimelineScrubber} from '../src/utils/timelineScrubber.js';

class Video extends EventTarget {
  time=0; seeking=false; readyState=2; duration=20; writes=[]; pauses=0;
  get currentTime(){return this.time;}
  set currentTime(value){this.time=value;this.seeking=true;this.writes.push(value);this.dispatchEvent(new Event('seeking'));}
  pause(){this.pauses++;}
  finish(){this.seeking=false;this.dispatchEvent(new Event('seeked'));}
}
function harness(timeoutMs=5000){
  const video=new Video(),tasks=new Map(),frames=[],states=[];let id=0,errors=0;
  const controller=createTimelineScrubber(video,{onFrame:t=>frames.push(t),onBusy:v=>states.push(v),onError:()=>errors++,
    schedule:fn=>{tasks.set(++id,fn);return id;},unschedule:id=>tasks.delete(id),timeoutMs});
  return {video,controller,frames,states,get errors(){return errors;},tick(){const copy=[...tasks.values()];tasks.clear();copy.forEach(fn=>fn());}};
}
test('SCRUB-01/02: rapid input coalesces, waits for decode and yields before latest preview',()=>{
  const h=harness();
  try {
    h.controller.request(1);h.controller.request(2);h.tick();
    assert.deepEqual(h.video.writes,[2]);assert.deepEqual(h.frames,[]);
    for(let i=3;i<=15;i++)h.controller.request(i);
    h.tick();assert.deepEqual(h.video.writes,[2]);
    h.video.finish();assert.deepEqual(h.frames,[2]);assert.equal(h.controller.busy,true);
    assert.deepEqual(h.video.writes,[2]);h.tick();assert.deepEqual(h.video.writes,[2,15]);
    h.video.finish();assert.deepEqual(h.frames,[2,15]);assert.equal(h.controller.busy,false);
    assert.deepEqual(h.states,[true,false]);assert.ok(h.video.pauses>0);
  } finally {h.controller.dispose();}
});
test('SCRUB-03: external navigation cancels queued slider work; late callbacks cannot jump back',()=>{
  const h=harness();h.controller.request(1);h.tick();h.controller.request(9);
  h.video.currentTime=4;h.video.finish();h.tick();
  assert.deepEqual(h.video.writes,[1,4]);assert.equal(h.controller.busy,false);assert.deepEqual(h.frames,[]);
  h.controller.dispose();
});
test('SCRUB-03: disposal removes queued work and completion listeners',()=>{
  const h=harness();h.controller.request(2);h.tick();h.controller.request(8);h.controller.dispose();
  h.video.finish();h.tick();h.controller.request(10);
  assert.deepEqual(h.video.writes,[2]);assert.deepEqual(h.frames,[]);assert.equal(h.controller.busy,false);
});
test('SCRUB-02: same-time, zero and final-time requests settle without waiting for nonexistent seek events',()=>{
  const h=harness();
  h.controller.request(0);h.tick();assert.deepEqual(h.frames,[0]);assert.equal(h.controller.busy,false);
  h.controller.request(99);h.tick();assert.deepEqual(h.video.writes,[20]);h.video.finish();
  h.controller.request(20);h.tick();assert.deepEqual(h.video.writes,[20]);assert.equal(h.controller.busy,false);
  h.controller.dispose();
});
test('SCRUB-03: decode errors and timeouts release busy state and discard queued targets',async()=>{
  const h=harness(5);h.controller.request(1);h.tick();h.controller.request(2);
  await new Promise(resolve=>setTimeout(resolve,15));h.tick();assert.equal(h.errors,1);assert.equal(h.controller.busy,false);
  h.video.finish();assert.deepEqual(h.frames,[]);
  h.controller.request(3);h.tick();h.video.dispatchEvent(new Event('error'));
  assert.equal(h.errors,2);assert.equal(h.controller.busy,false);h.controller.dispose();
});
