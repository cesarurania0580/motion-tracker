import test from 'node:test';
import assert from 'node:assert/strict';
import {fitCurve} from '../src/utils/curveFit.js';
const wave=(B=5.5,C=Math.PI/2)=>Array.from({length:73},(_,i)=>({time:i/30,y:.08*Math.sin(B*i/30+C)+.009}));
test('CF-01: recover frequency absent from old guesses and arbitrary phase',()=>{
  for(const C of [Math.PI/2,.3,-2.4]){
    const r=fitCurve(wave(5.5,C),'sinusoidal','time','y');
    assert.ok(r.r2>0.999999,`R² ${r.r2}`);
    assert.ok(Math.abs(r.params.B-5.5)<1e-5);
    assert.ok(Math.abs(r.params.A-.08)<1e-6);
    assert.ok(Math.abs(r.params.D-.009)<1e-6);
  }
});
test('CF-01/04: noisy irregular samples recover the underlying oscillation',()=>{
  const data=Array.from({length:100},(_,i)=>{
    const time=i/30+.002*Math.sin(i*1.7);
    return {time,y:.08*Math.sin(7.3*time-.7)+.009+.001*Math.sin(i*2.3)};
  });
  const r=fitCurve(data,'sinusoidal','time','y');
  assert.ok(r.r2>.999);
  assert.ok(Math.abs(r.params.B-7.3)<.01);
  assert.ok(Math.abs(r.params.A-.08)<.001);
  assert.equal(r.warning,null);
});
test('CF-02: scaled, shifted, shuffled data retain precision and selected axes',()=>{
  const original=wave(5.5,.3);
  const data=original.map(p=>({x:100000+p.time*1000,vy:p.y*1e-7})).reverse();
  const before=structuredClone(data);
  const r=fitCurve(data,'sinusoidal','x','vy');
  assert.ok(r.r2>.999999);
  assert.ok(Math.abs(r.params.B-.0055)<1e-8);
  for(const p of data) assert.ok(Math.abs(r.fn(p.x)-p.vy)<1e-14);
  assert.deepEqual(data,before);
});
test('CF-03: cropped intervals refit and flag a poorly constrained partial cycle',()=>{
  const data=wave(5.5,.3);
  const full=fitCurve(data,'sinusoidal','time','y');
  const cropped=fitCurve(data.slice(3,23),'sinusoidal','time','y');
  assert.ok(full.r2>.999999);
  assert.ok(cropped.r2>.999999);
  assert.equal(cropped.warning,'fitUncertain');
  assert.ok(Math.abs(cropped.params.B-5.5)<1e-4);
});
test('CF-03: insufficient, constant and repeated X data do not fabricate a sinusoid',()=>{
  for(const data of [[],wave().slice(0,5),wave().map(p=>({...p,y:2})),wave().map(p=>({...p,time:1}))]) {
    assert.equal(fitCurve(data,'sinusoidal','time','y'),null);
  }
  const data=[...wave(),{time:NaN,y:1},{time:1,y:Infinity},{time:null,y:1}];
  assert.ok(fitCurve(data,'sinusoidal','time','y').r2>.999999);
});
test('CF-04: linear, quadratic, zero and undefined R² retain correct behavior',()=>{
  const data=Array.from({length:20},(_,i)=>({time:i/10,y:3*i/10+2}));
  const linear=fitCurve(data,'linear','time','y');
  assert.ok(Math.abs(linear.params.m-3)<1e-10);
  assert.ok(Math.abs(linear.params.b-2)<1e-10);
  const quadratic=fitCurve(data.map(p=>({...p,y:2*p.time**2-3*p.time+4})),'quadratic','time','y');
  assert.ok(Math.abs(quadratic.params.A-2)<1e-10);
  assert.ok(Math.abs(quadratic.params.B+3)<1e-10);
  assert.ok(Math.abs(quadratic.params.C-4)<1e-10);
  assert.equal(fitCurve([{x:-1,y:1},{x:0,y:-2},{x:1,y:1}],'linear','x','y').r2,0);
  assert.equal(fitCurve(data.map(p=>({...p,y:2})),'linear','time','y').r2,null);
});
