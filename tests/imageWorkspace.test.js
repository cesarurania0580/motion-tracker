import test from 'node:test';
import assert from 'node:assert/strict';
import {restoredImageTask,IMAGE_TEXT} from '../src/utils/imageWorkspace.js';
import {nextToolbarStep} from '../src/utils/workflow.js';

test('Image restoration selects existing work without altering measurements',()=>{
  assert.equal(restoredImageTask({}),null);
  assert.equal(restoredImageTask({protractor:{}}),'measure');
  assert.equal(restoredImageTask({objects:[{points:[{x:1,y:2}]}]}),'measure');
  assert.equal(restoredImageTask({lineProfile:{},protractor:{}}),'spectrum');
  assert.equal(restoredImageTask({wavelengthCalibration:{}}),'spectrum');
  assert.deepEqual(Object.keys(IMAGE_TEXT.en),Object.keys(IMAGE_TEXT.es));
});

test('A decoded image never prompts a video tracking sequence',()=>{
  const s={imageSrc:'blob:image',imageObj:{},videoDims:{w:200,h:100},objects:[{id:'A',points:[]}],activeObjId:'A',viewMode:'tracker'};
  assert.equal(nextToolbarStep(s),null);
  assert.equal(nextToolbarStep({...s,pixelsPerMeter:10,origin:{x:0,y:0},axesConfirmed:true}),null);
});

test('Switching image tasks preserves work and cancels unfinished placement',async()=>{
  const storage=globalThis.localStorage;
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  const {useStore}=await import('../src/store/useStore.js');
  const before=useStore.getState();
  try {
    useStore.setState({lineProfile:{spread:8},wavelengthCalibration:{p1_wl:400},tapeMeasure:{p1:{x:2,y:3}},activeClickTarget:'r1',spectralLineStart:{x:1,y:1}});
    const original=useStore.getState();
    for(const task of ['measure',null,'spectrum']) {
      useStore.getState().selectImageTask(task);
      const s=useStore.getState();
      assert.equal(s.imageTask,task);
      assert.equal(s.activeClickTarget,null);
      assert.equal(s.spectralLineStart,null);
      for(const key of ['lineProfile','wavelengthCalibration','tapeMeasure','objects'])assert.equal(s[key],original[key]);
    }
    assert.equal(useStore.getState().sidebarViews.tools,'spectroscopy');
  } finally {useStore.setState(before,true);globalThis.localStorage=storage;}
});
