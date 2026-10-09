import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
import {createPointId} from '../src/utils/pointId.js';
import {upsertTrackedPoint} from '../src/utils/autotracker.js';

const lanCrypto={getRandomValues:values=>webcrypto.getRandomValues(values)};
test('LAN point IDs retain UUID shape and uniqueness without randomUUID',()=>{
  const ids=Array.from({length:100},()=>createPointId(lanCrypto));
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ids)assert.match(id,/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  assert.equal(createPointId({randomUUID:()=> 'existing-id'}),'existing-id');
});
test('Automatic recording saves coordinates/time and continues on LAN HTTP',()=>{
  const source=readFileSync(new URL('../src/hooks/useAutotracking.js',import.meta.url),'utf8');
  const record=source.slice(source.indexOf('  function record(session)'),source.indexOf('  function toggle()'));
  let points=[],time,frame;
  const state={current:{}};
  const store={activeObjId:'A',fps:30,setPoints:update=>{points=update(points);},setCurrentTime:value=>{time=value;},setCurrentFrameIndex:value=>{frame=value;}};
  const context={state,useStore:{getState:()=>store},videoRef:{current:{currentTime:1}},
    showSession:session=>session.last,createPointId:()=>createPointId(lanCrypto),upsertTrackedPoint,crypto:lanCrypto};
  runInNewContext(record+'\nglobalThis.recordPoint=record;',context);
  context.recordPoint({last:{x:100,y:200}});
  context.videoRef.current.currentTime=1+1/30;
  context.recordPoint({last:{x:101,y:202}});
  assert.equal(points.length,2);assert.equal(points[0].x,100);assert.equal(points[1].y,202);
  assert.equal(points[0].time,1);assert.notEqual(points[0].id,points[1].id);
  assert.equal(time,context.videoRef.current.currentTime);assert.equal(frame,31);
  assert.equal(state.current.writing,false);
});
