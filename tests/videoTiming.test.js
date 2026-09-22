import test from 'node:test';
import assert from 'node:assert/strict';
import {readVideoTiming,validFps,fpsMismatch,fpsChoice,effectiveFps} from '../src/utils/videoTiming.js';
import {startTimingDetection} from '../src/utils/timingDetection.js';

const metadata=fields=>({media:{track:[{'@type':'Audio',FrameRate:48},{'@type':'Video',...fields}]}});
test('FPS: CFR and VFR supply suggestions without losing precision',()=>{
  assert.deepEqual(readVideoTiming(metadata({FrameRate_Mode:'CFR',FrameRate:25})),{status:'detected',fps:25});
  assert.equal(readVideoTiming(metadata({FrameRate_Mode:'CFR',FrameRate_Num:30000,FrameRate_Den:1001})).fps,30000/1001);
  for(const FrameRate of [0,-1,Infinity,'invalid',2000])assert.equal(readVideoTiming(metadata({FrameRate_Mode:'CFR',FrameRate})).status,'unknown');
  assert.equal(readVideoTiming(metadata({FrameRate_Mode:'VFR',FrameRate:30})).status,'variable');
  assert.equal(readVideoTiming(metadata({FrameRate:30})).status,'detected');
  assert.equal(readVideoTiming(metadata({FrameRate_Mode:'VFR',FrameRate:29.84,FrameRate_Num:30,FrameRate_Den:1})).fps,29.84);
  assert.equal(readVideoTiming({}).status,'unknown');
  assert.equal(validFps(''),false);
  assert.equal(validFps('29.97'),true);
  assert.equal(fpsMismatch(30,29.97),true);
  assert.equal(fpsMismatch(30,null),false);
});

test('FPS: friendly choices preserve suggested precision and allow explicit overrides',()=>{
  for(const [exact,choice] of [[29.84,30],[29.97,30],[59.94,60],[119.88,120],[239.76,240]]) {
    assert.equal(fpsChoice(exact),choice);
    assert.equal(effectiveFps(choice,exact,''),exact);
  }
  for(const exact of [24,25,48,90])assert.equal(fpsChoice(exact),'other');
  assert.equal(fpsChoice(null),30);
  assert.equal(effectiveFps(60,29.97,''),60);
  assert.equal(effectiveFps('other',29.97,'30'),30);
  assert.equal(effectiveFps(30,30,''),30);
});

test('FPS: replacement cancels old results and releases the worker',()=>{
  let terminated=0;
  const worker={postMessage(){},terminate(){terminated++;}};
  const received=[];
  const cancel=startTimingDetection({},value=>received.push(value),()=>worker);
  cancel();
  worker.onmessage({data:{status:'detected',fps:24}});
  assert.deepEqual(received,[]);
  assert.equal(terminated,1);
});

test('FPS: worker errors and timeout fall back once to manual entry',async()=>{
  const received=[];
  const worker={postMessage(){},terminate(){}};
  startTimingDetection({},value=>received.push(value),()=>worker,5);
  await new Promise(resolve=>setTimeout(resolve,15));
  worker.onerror();
  worker.onmessage({data:{status:'detected',fps:60}});
  assert.deepEqual(received,[{status:'unknown',fps:null}]);
});
