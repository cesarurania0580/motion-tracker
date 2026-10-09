import test from 'node:test';
import assert from 'node:assert/strict';
import {calibrationFeedback,SPECTRUM_WORKFLOW_TEXT,initialSamplingLine,SPECTRUM_PLACEMENT_TEXT} from '../src/utils/spectrumWorkflow.js';

test('Spectrum workflow: calibration feedback identifies the next actionable correction',()=>{
  const c={coordinateMode:'image'};
  assert.equal(calibrationFeedback(c),'wavelength1');
  c.p1_wl=400;assert.equal(calibrationFeedback(c),'position1');
  c.p1_point={x:10,y:10};assert.equal(calibrationFeedback(c),'wavelength2');
  c.p2_wl=400;assert.equal(calibrationFeedback(c),'position2');
  c.p2_point={x:10,y:30};assert.equal(calibrationFeedback(c),'differentWavelengths');
  c.p2_wl=600;assert.equal(calibrationFeedback(c),'differentPositions');
  c.p2_point={x:40,y:30};assert.equal(calibrationFeedback(c),'calibrated');
  c.p2_wl=-5;assert.equal(calibrationFeedback(c),'wavelength2');
});
test('Spectrum workflow: English and Spanish keys match',()=>{
  assert.deepEqual(Object.keys(SPECTRUM_WORKFLOW_TEXT.en),Object.keys(SPECTRUM_WORKFLOW_TEXT.es));
});
test('Spectrum workflow: step navigation cancels unfinished placement and preserves data/calibration',async()=>{
  const storage=globalThis.localStorage,writes=[];
  globalThis.localStorage={getItem:()=>null,setItem:(_,value)=>writes.push(JSON.parse(value))};
  const {useStore}=await import('../src/store/useStore.js');
  const before=useStore.getState();
  try {
    useStore.setState({activeClickTarget:'spectrum_p2',spectralLineStart:{x:2,y:3},lineProfile:{p1:{x:0,y:0},p2:{x:20,y:0},spread:4,channel:'red'},wavelengthCalibration:{p1_wl:400},spectralData:[{intensity:5}],spectrumStep:'sample'});
    const original=useStore.getState();
    original.setSpectrumStep('calibrate');
    assert.equal(useStore.getState().activeClickTarget,null);
    assert.equal(useStore.getState().spectralLineStart,null);
    for(const key of ['lineProfile','wavelengthCalibration','spectralData'])assert.equal(useStore.getState()[key],original[key]);
    useStore.setState({spectrumUsePixels:true});original.setSpectrumStep('explore');
    original.setViewMode('analysis');
    original.setSpectrumStep('calibrate');original.navigateSidebar('tools','spectroscopy');original.setViewMode('tracker');
    assert.equal(useStore.getState().lineProfile,original.lineProfile);
    assert.equal(useStore.getState().wavelengthCalibration,original.wavelengthCalibration);
    assert.ok(writes.every(data=>!('spectrumStep' in data) && !('spectrumUsePixels' in data)));
  } finally {useStore.setState(before,true);globalThis.localStorage=storage;}
});


test('Calibration-first workflow: line starts inside native image and new labels have EN/ES parity',()=>{
  assert.equal(initialSamplingLine({w:0,h:100}),null);
  assert.equal(initialSamplingLine({w:100,h:NaN}),null);
  const line=initialSamplingLine({w:1000,h:500});
  assert.deepEqual(line,{p1:{x:200,y:249.5},p2:{x:800,y:249.5},spread:5,channel:'luma'});
  assert.deepEqual(Object.keys(SPECTRUM_PLACEMENT_TEXT.en),Object.keys(SPECTRUM_PLACEMENT_TEXT.es));
});

test('Calibration-first workflow: opening sampling creates once and preserves adjustments/calibration',async()=>{
  const storage=globalThis.localStorage;
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  const {useStore}=await import('../src/store/useStore.js');
  const before=useStore.getState();
  try {
    useStore.setState({spectrumStep:'calibrate',imageObj:{},videoDims:{w:800,h:600},lineProfile:null,wavelengthCalibration:{coordinateMode:'image',p1_wl:400},isPlaying:true});
    const c=useStore.getState().wavelengthCalibration;
    useStore.getState().setSpectrumStep('sample');
    assert.ok(useStore.getState().lineProfile);
    assert.equal(useStore.getState().isPlaying,false);
    const modified={...useStore.getState().lineProfile,p1:{x:22,y:33},spread:17,channel:'red'};
    useStore.getState().setLineProfile(modified);
    useStore.getState().setSpectrumStep('calibrate');
    const version=useStore.getState().spectrumInteractionVersion;
    useStore.getState().setSpectrumStep('sample');
    assert.equal(useStore.getState().lineProfile,modified);
    assert.equal(useStore.getState().wavelengthCalibration,c);
    assert.equal(useStore.getState().spectrumInteractionVersion,version+1);
  } finally {useStore.setState(before,true);globalThis.localStorage=storage;}
});
