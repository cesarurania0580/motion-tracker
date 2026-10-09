import {test} from 'node:test';
import assert from 'node:assert/strict';

test('Spectral calibration updater preserves values and serializes reference edits', async () => {
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{}}});
  try {
    const {useStore}=await import('../src/store/useStore.js');
    useStore.getState().setWavelengthCalibration({p1_wl:486.1,p2_wl:656.3,p1_t:0,p2_t:1});
    useStore.getState().setWavelengthCalibration(prev=>({...prev,p1_t:0.25}));
    const saved=JSON.parse(JSON.stringify({calibration:useStore.getState().wavelengthCalibration}));
    assert.equal(saved.calibration?.p1_wl,486.1);
    assert.equal(saved.calibration?.p1_t,0.25);
  } finally {
    if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;
  }
});

import {anchorCalibration,referencePoints,validCalibration,wavelengthAt,sampleSpectrum,spectralRows,spectrumCSV} from '../src/utils/spectroscopy.js';
import {SPECTRUM_TEXT} from '../src/utils/spectrumText.js';

const calibration={coordinateMode:'image',p1_point:{x:2,y:2},p2_point:{x:8,y:2},p1_wl:400,p2_wl:700};
const line={p1:{x:0,y:3},p2:{x:10,y:3},spread:1,channel:'red'};

test('Two known image lines produce calibrated intensity peaks and spectral CSV', () => {
  const width=11,height=5,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(const x of [2,8])data[(y*width+x)*4]=240;
  const samples=sampleSpectrum({data,width,height},line);
  const spectrum=spectralRows(samples,line,calibration,'wavelength',null);
  const peaks=spectrum.rows.filter(p=>p.intensity===240);
  assert.deepEqual(peaks.map(p=>p.xVal),[400,700]);
  assert.equal(spectrum.mode,'wavelength');
  const csv=spectrumCSV(spectrum.rows,spectrum.mode);
  assert.match(csv,/Wavelength \(nm\),Intensity/);
  assert.match(csv,/400,240,240,0,0/);
  assert.doesNotMatch(csv,/Time|Velocity/);
});

test('Moving or reversing the sampling line keeps wavelength references fixed', () => {
  const before=structuredClone(calibration);
  for(const moved of [line,{...line,p1:{x:10,y:4},p2:{x:0,y:4}}]) {
    assert.equal(wavelengthAt({x:5,y:4},calibration,moved),550);
    assert.deepEqual(referencePoints(calibration,moved),[calibration.p1_point,calibration.p2_point]);
  }
  assert.deepEqual(calibration,before);
  const rotated={...calibration,guideAngleDeg:90,p1_point:{x:2,y:2},p2_point:{x:2,y:8}};
  assert.equal(wavelengthAt({x:7,y:5},rotated,line),550);
});

test('Invalid or incomplete references cannot silently fabricate a wavelength scale', () => {
  const samples=[{x:2,y:2,distance:2,r:0,g:0,b:0,intensity:0}];
  for(const c of [null,{...calibration,p2_point:null},{...calibration,p2_point:calibration.p1_point},
    {...calibration,p1_wl:0},{...calibration,p1_wl:NaN},{...calibration,p2_wl:400}]) {
    assert.equal(validCalibration(c,line),false);
    assert.equal(wavelengthAt({x:2,y:2},c,line),null);
    const spectrum=spectralRows(samples,line,c,'wavelength',null);
    assert.equal(spectrum.mode,'pixels');assert.equal(spectrum.rows[0].xVal,2);
  }
});

test('Legacy relative references convert to fixed image points before a line moves', () => {
  const old={p1_t:.2,p2_t:.8,p1_wl:400,p2_wl:700};
  const anchored=anchorCalibration(old,line);
  assert.equal(wavelengthAt({x:2,y:3},old,line),400);
  assert.equal(wavelengthAt({x:2,y:3},anchored,{...line,p1:{x:5,y:3}}),400);
  assert.deepEqual(JSON.parse(JSON.stringify(anchored)),anchored);
  assert.equal(anchorCalibration(anchored,line),anchored);
});

test('Clipping retains spatial coordinates; averaging uses the selected width', () => {
  const width=11,height=5,data=new Uint8ClampedArray(width*height*4);
  for(let x=0;x<width;x++) {data[(2*width+x)*4]=100;data[(3*width+x)*4]=200;}
  const samples=sampleSpectrum({data,width,height},{...line,p1:{x:-2,y:2},p2:{x:10,y:2},spread:2});
  assert.equal(samples[0].distance,2);
  assert.equal(samples[0].intensity,150);
  const calibrated=spectralRows(samples,line,calibration,'wavelength',null);
  assert.equal(calibrated.rows.find(p=>p.x===2).xVal,400);
  assert.deepEqual(sampleSpectrum({data,width,height},{...line,p2:line.p1}),[]);
});

test('Spectroscopy instructions have matching English and Spanish keys', () => {
  assert.deepEqual(Object.keys(SPECTRUM_TEXT.en).sort(),Object.keys(SPECTRUM_TEXT.es).sort());
});

 test('Guides default to vertical regardless of reference heights; explicit tilt controls calibration', () => {
  const c={...calibration,p2_point:{x:8,y:5}};
  assert.equal(wavelengthAt({x:2,y:20},c,line),400);
  assert.equal(wavelengthAt({x:8,y:0},c,line),700);
  const tilted={...c,guideAngleDeg:45};
  assert.ok(Math.abs(wavelengthAt({x:0,y:4},tilted,line)-400)<1e-9);
  assert.ok(Math.abs(wavelengthAt({x:6,y:7},tilted,line)-700)<1e-9);
  assert.equal(validCalibration({...c,p2_point:{x:2,y:9}},line),false);
  assert.equal(JSON.parse(JSON.stringify(tilted)).guideAngleDeg,45);
  const old={p1_wl:400,p2_wl:700,p1_t:0,p2_t:1};
  const diagonal={...line,p1:{x:0,y:0},p2:{x:10,y:10}};
  const anchored=anchorCalibration(old,diagonal);
  assert.equal(anchored.guideAngleDeg,45);
  assert.equal(wavelengthAt({x:5,y:5},anchored,diagonal),550);
 });

test('Comparison toggles preserve axis mode, calibration and experimental spectrum', async () => {
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{}}});
  const {useStore}=await import('../src/store/useStore.js');
  const previous=useStore.getState();
  try {
    const data=[{x:3,y:3,distance:3,intensity:200,r:200,g:0,b:0}];
    for(const mode of ['pixels','distance','wavelength']) {
      useStore.setState({wavelengthCalibration:calibration,lineProfile:line,spectralData:data,spectralMode:mode});
      const before=spectralRows(data,line,calibration,mode,10);
      for(const element of ['h2','he','hg']) for(const enabled of [true,false]) {
        useStore.getState().setActiveReferenceOverlays({h2:false,he:false,hg:false,[element]:enabled});
        const state=useStore.getState();
        assert.equal(state.spectralMode,mode);
        assert.equal(state.activeReferenceOverlays[element],enabled);
        assert.equal(state.wavelengthCalibration,calibration);
        assert.equal(state.lineProfile,line);
        assert.equal(state.spectralData,data);
        assert.deepEqual(spectralRows(state.spectralData,state.lineProfile,state.wavelengthCalibration,state.spectralMode,10),before);
      }
    }
  } finally {
    useStore.setState(previous);
    if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;
  }
});

test('Hidden media canvas cannot produce negative fit zoom during analysis', async () => {
  const {mediaFitZoom}=await import('../src/utils/mediaFit.js');
  for(const [w,h] of [[0,0],[20,600],[800,40]]) {
    assert.equal(mediaFitZoom(1000,800,w,h),null);
  }
  assert.equal(mediaFitZoom(1000,800,540,440),0.5);
  assert.equal(mediaFitZoom(1000,800,2040,1640),1);
  assert.equal(mediaFitZoom(0,800,540,440),null);
});

test('Changing color channels samples the chosen intensity without changing wavelengths', () => {
  const image={width:11,height:5,data:new Uint8ClampedArray(11*5*4)};
  for(let i=0;i<image.data.length;i+=4)image.data.set([100,150,200,255],i);
  for(const [channel,expected] of [['red',100],['green',150],['blue',200],['luma',140.75]]) {
    const selected={...line,channel};
    const rows=spectralRows(sampleSpectrum(image,selected),selected,calibration,'wavelength',null).rows;
    assert.ok(Math.abs(rows[0].intensity-expected)<1e-9);
    assert.equal(rows.find(row=>row.x===2).xVal,400);
    assert.equal(rows.find(row=>row.x===8).xVal,700);
  }
});
