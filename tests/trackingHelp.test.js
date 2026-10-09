import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrackingHelpController} from '../src/utils/trackingHelpController.js';

function setup() {
  let now=0,id=0;
  const timers=new Map(),visible=new Set();
  const controller=createTrackingHelpController((fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},id=>timers.delete(id));
  const enter=(owner,delay=400)=>controller.enter(owner,()=>visible.add(owner),()=>visible.delete(owner),delay);
  function tick(ms) {
    const end=now+ms;
    while(true) {
      const next=[...timers].filter(([,task])=>task.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;
      now=next[1].at;timers.delete(next[0]);next[1].fn();
    }
    now=end;
  }
  return {controller,enter,tick,visible,timers};
}

test('Help: leaving before delay cancels opening rather than creating a stale tooltip',()=>{
  const h=setup();h.enter('diameter');h.tick(100);h.controller.leave('diameter');h.tick(1000);
  assert.equal(h.visible.size,0);assert.equal(h.timers.size,0);
});
test('Help: multiple labels share one active or pending owner',()=>{
  const h=setup();h.enter('diameter');h.tick(400);assert.deepEqual([...h.visible],['diameter']);
  h.enter('radius');assert.equal(h.visible.size,0);
  h.tick(200);h.enter('threshold');h.tick(400);
  assert.deepEqual([...h.visible],['threshold']);
  h.controller.dismiss('radius');assert.deepEqual([...h.visible],['threshold']);
});
test('Help: pointer can cross to box, but leaving closes even after immediate mouse opening',()=>{
  const h=setup();h.enter('diameter',0);h.controller.leave('diameter');h.tick(100);h.controller.hold('diameter');h.tick(400);
  assert.deepEqual([...h.visible],['diameter']);
  h.controller.leave('diameter');h.tick(150);assert.equal(h.visible.size,0);
});
test('Help: outside interaction and teardown cancel visible and delayed work',()=>{
  const h=setup();h.enter('diameter');h.controller.dismiss('diameter');h.tick(500);assert.equal(h.visible.size,0);
  h.enter('radius',0);h.controller.dismiss('radius');assert.equal(h.visible.size,0);assert.equal(h.timers.size,0);
});
