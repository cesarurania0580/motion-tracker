import test from 'node:test';
import assert from 'node:assert/strict';
import {motionRows,accelerationRows,spectrumRows,plottedCSV} from '../src/components/graphing/liveData.js';
import {fitSample,makeFigure,clonePlot} from '../src/components/graphing/trialFigure.js';
import {DEFAULT_SETTINGS} from '../src/components/graphing/defaultSettings.js';
import {LIVE_TEXT} from '../src/components/graphing/liveText.js';
import {fitCurve} from '../src/utils/curveFit.js';
import {axisUnit,parameterUnits} from '../src/utils/analysisPresentation.js';
import {spectralRows} from '../src/utils/spectroscopy.js';

const frozen=rows=>Object.freeze(rows.map(Object.freeze));
const times=[0,.2,.5,.9,1.4];
const position=frozen(times.map((time,i)=>({time,x:1+time,y:2+3*time+.5*time*time,error:.02,sourceIndex:i})));
const velocity=frozen(times.map(time=>({time,vx:1,vy:3+time,x:null,y:null,error:null})));

test('GI-02/05: live axes/crops preserve real values, missing velocities and source arrays',()=>{
  const rows=motionRows(position,velocity,'time','vy','.2','.9');
  assert.deepEqual(rows.map(p=>[p.x,p.y]),[[.2,3.2],[.5,3.5],[.9,3.9]]);
  assert.ok(rows.every(p=>p.error===null&&p.xError===null));
  assert.deepEqual(motionRows(position,velocity,'x','vy').map(p=>p.x),position.map(p=>p.x));
  assert.equal(motionRows(position,[],'time','vx').length,0);
  assert.equal(motionRows(position,velocity,'time','y','2','1').length,0);
  assert.equal(motionRows(position,velocity,'time','y','invalid','').length,0);
  assert.equal(motionRows(position,velocity,'x','y')[0].xError,.02);
  rows[0].y=99;assert.equal(velocity[1].vy,3.2);
});

test('GI-03: acceleration differentiates uneven timestamps, including endpoints, before cropping',()=>{
  const quadratic=frozen(times.map(time=>({time,vx:time*time+2*time+3,vy:4*time-1})));
  accelerationRows(quadratic).forEach((row,i)=>{
    assert.ok(Math.abs(row.ax-(2*times[i]+2))<1e-11);
    assert.ok(Math.abs(row.ay-4)<1e-11);
  });
  const cropped=motionRows(position,velocity,'time','ay','.5','.5');
  assert.equal(cropped.length,1);assert.ok(Math.abs(cropped[0].y-1)<1e-12);
  assert.equal(cropped[0].error,null);
  assert.deepEqual(accelerationRows(velocity.slice(0,2)),[]);
  assert.deepEqual(accelerationRows([...velocity,velocity[0]]),[]);
  const missing=velocity.map(row=>({...row}));missing[1].vy=null;
  assert.equal(accelerationRows(missing)[0].ay,null);
  assert.equal(axisUnit('ax',true),'m/s²');assert.equal(axisUnit('ay',false),'px/s²');
  assert.deepEqual(parameterUnits('Linear','time','ay',true),{m:'m/s³',b:'m/s²'});
});

test('GI-02: live motion fits match the existing regression for positions and velocities',()=>{
  for(const [key,source] of [['y',position],['vy',velocity]]){
    for(const model of ['linear','quadratic','sinusoidal']){
      const expected=fitCurve(source,model,'time',key),actual=fitSample(motionRows(position,velocity,'time',key),model);
      if(!expected){assert.equal(actual,null);continue;}
      assert.deepEqual(actual.params,expected.params);assert.equal(actual.r2,expected.r2);
      times.forEach(t=>assert.equal(actual.fn(t),expected.fn(t)));
    }
  }
});

test('GI-04: real RGB/luma and calibrated spectrum use existing coordinates without mutation',()=>{
  const data=frozen([{x:0,y:0,distance:0,r:10,g:20,b:30,intensity:10},{x:10,y:0,distance:10,r:20,g:40,b:60,intensity:20}]);
  const line={p1:{x:0,y:0},p2:{x:10,y:0}};
  const calibration={coordinateMode:'image',p1_point:line.p1,p2_point:line.p2,p1_wl:400,p2_wl:500};
  const spectral=spectralRows(data,line,calibration,'wavelength',100);
  assert.deepEqual(spectrumRows(spectral.rows,'red').map(p=>[p.x,p.y]),[[400,10],[500,20]]);
  assert.ok(Math.abs(spectrumRows(spectral.rows,'luma')[0].y-18.15)<1e-12);
  assert.equal(spectrumRows(spectralRows(data,line,null,'distance',100).rows,'blue')[1].x,.1);
  assert.equal(spectralRows(data,line,null,'wavelength',100).mode,'pixels');
  assert.equal(data[0].intensity,10);
});

test('GI-05/06: live figure, clipped references and CSV contain measured labels, units and copied values',()=>{
  const rows=motionRows(position,velocity,'time','y');
  const settings={...DEFAULT_SETTINGS,title:'Object A',xLabel:'Time (s)',yLabel:'Y (m)',axisMode:'manual',xMin:0,xMax:1,yMin:0,yMax:4};
  const figure=makeFigure(rows,fitSample(rows,'linear'),settings,'en','motion',{
    text:LIVE_TEXT.en,note:LIVE_TEXT.en.sampleNote,
    shapes:[{x0:.5},{x0:2}],annotations:[{x:.5,text:'in'},{x:2,text:'out'}],
  });
  assert.equal(figure.layout.shapes.length,1);assert.equal(figure.layout.annotations.length,2);
  assert.ok(!JSON.stringify(figure).includes('Synthetic'));
  const copy=clonePlot(figure);copy.data[0].y[0]=99;assert.equal(rows[0].y,2);
  assert.equal(figure.data[0].y[0],2);
  const csv=plottedCSV(rows,{x:'Time (s)',y:'Y (m)'});
  assert.ok(csv.startsWith('"Time (s)","Y (m)"'));assert.ok(csv.includes('0,2,,0.02'));
  assert.deepEqual(Object.keys(LIVE_TEXT.en).sort(),Object.keys(LIVE_TEXT.es).sort());
});

test('GI-01/06: real workspace renders bilingual labels and empty states without loading browser plotting',async()=>{
  const {build}=await import('esbuild');
  const {fileURLToPath}=await import('node:url');
  const {createRequire}=await import('node:module');
  const {runInThisContext}=await import('node:vm');
  const result=await build({stdin:{contents:`
    import React from 'react';
    import {renderToStaticMarkup} from 'react-dom/server';
    import NewGraphing from './src/components/graphing/NewGraphing.jsx';
    export const render=props=>renderToStaticMarkup(<NewGraphing {...props}/>);
  `,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,write:false,
    loader:{'.css':'empty','.ttf':'empty'},platform:'node',format:'cjs',jsx:'automatic',packages:'external',logLevel:'silent'});
  const module={exports:{}};
  runInThisContext(`(function(require,module,exports){${result.outputFiles[0].text}\n})`)(createRequire(import.meta.url),module,module.exports);
  const props={language:'en',positionData:position,velocityData:velocity,activeObject:'COM',color:'#f00',pixelsPerMeter:100,
    spectralData:[],lineProfile:null,calibration:null,initial:{mode:'kinematics',x:'time',y:'y',start:'',end:'',model:'linear',spectralMode:'pixels'}};
  const html=module.exports.render(props);
  assert.match(html,/Object COM/);assert.match(html,/Y position \(m\)/);assert.doesNotMatch(html,/Synthetic|sample data/);
  assert.match(module.exports.render({...props,language:'es'}),/Posición Y/);
  assert.match(module.exports.render({...props,positionData:[]}),/No finite data/);
  assert.match(module.exports.render({...props,initial:{...props.initial,mode:'spectroscopy'}}),/No spectrum data/);
});
