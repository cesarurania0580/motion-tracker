import test from 'node:test';
import assert from 'node:assert/strict';
import {fitCurve} from '../src/utils/curveFit.js';
import {SAMPLES,DEFAULT_SETTINGS,sampleRows} from '../src/prototypes/graphing/trialData.js';
import {TRIAL_TEXT} from '../src/components/graphing/trialText.js';
import {fitSample,makeFigure,figureSize,clonePlot,plainText} from '../src/components/graphing/trialFigure.js';

const settings={...DEFAULT_SETTINGS,title:'Motion α <sample>',xLabel:'Time (s)',yLabel:'Position (m)'};

test('GRAPH-02: trial passes identical data to the existing motion fits without changing results',()=>{
  for(const sample of ['velocity','acceleration','oscillation']){
    const rows=sampleRows(sample),before=JSON.stringify(rows),model=SAMPLES[sample].model;
    const existing=fitCurve(rows,model,'x','y'),trial=fitSample(rows,model);
    assert.deepEqual(trial.params,existing.params);assert.equal(trial.r2,existing.r2);
    assert.equal(trial.text,existing.text);assert.equal(JSON.stringify(rows),before);
    assert.ok(trial.rmse>=0&&Number.isFinite(trial.rmse));
    for(const row of rows)assert.equal(trial.fn(row.x),existing.fn(row.x));
  }
});

test('GRAPH-02/06: spectrum fixtures are deterministic with no fitted scientific claim',()=>{
  const rows=sampleRows('spectrum');assert.equal(rows.length,401);
  assert.equal(rows[0].x,380);assert.equal(rows.at(-1).x,780);
  const peak=rows.reduce((a,b)=>a.y>b.y?a:b);assert.ok(Math.abs(peak.x-546)<=1);
  assert.deepEqual(rows,sampleRows('spectrum'));
  assert.equal(sampleRows('spectrum',true).length,5001);
  assert.equal(fitSample(rows,'none'),null);
});

test('GRAPH-03: figure data, labels, uncertainty bars and clipping are shared without mutating fixtures',()=>{
  const rows=sampleRows('velocity'),fit=fitSample(rows,'linear');
  const figure=makeFigure(rows,fit,settings,'en','velocity');
  assert.equal(figure.data[0].type,'scatter');assert.equal(figure.data[1].type,'scatter');
  assert.deepEqual(figure.data[0].x,rows.map(row=>row.x));
  assert.deepEqual(figure.data[0].error_y.array,rows.map(row=>row.error));
  assert.equal(figure.data[0].cliponaxis,true);assert.equal(figure.data[1].cliponaxis,true);
  const copy=clonePlot(figure);copy.data[0].y[0]=999;copy.layout.title.text='changed';
  assert.notEqual(figure.data[0].y[0],999);assert.notEqual(figure.layout.title.text,'changed');
  assert.match(figure.layout.title.text,/&lt;sample&gt;/);
  assert.equal(plainText('<script>&'),'&lt;script&gt;&amp;');
  assert.equal(figure.layout.font.family,'Liberation Sans');
});

test('GRAPH-04: invalid ranges are rejected; manual view supplies identical bounds to preview/export',()=>{
  const rows=sampleRows('velocity'),fit=fitSample(rows,'linear');
  const manual={...settings,axisMode:'manual',xMin:'0',xMax:'3',yMin:'-4',yMax:'0'};
  const figure=makeFigure(rows,fit,manual,'en','velocity');
  assert.deepEqual(figure.layout.xaxis.range,[0,3]);assert.deepEqual(figure.layout.yaxis.range,[-4,0]);
  assert.equal(figure.layout.xaxis.autorange,false);
  assert.ok(figure.data[1].y.at(-1)<-4,'fit crosses boundary and must be clipped by renderer');
  for(const bad of [{xMin:''},{xMax:0},{yMax:-5},{yMin:'Infinity'}])
    assert.throws(()=>makeFigure(rows,fit,{...manual,...bad},'en','velocity'),/Invalid range/);
});

test('GRAPH-05: physical export dimensions and bilingual interface are explicit',()=>{
  const size=figureSize({...settings,widthCm:16,heightCm:10,dpi:300});
  assert.equal(size.pngWidth,1890);assert.equal(size.pngHeight,1181);
  assert.equal(size.width,605);assert.equal(size.height,378);
  assert.throws(()=>figureSize({...settings,widthCm:0}),/Invalid figure size/);
  assert.deepEqual(Object.keys(TRIAL_TEXT.en).sort(),Object.keys(TRIAL_TEXT.es).sort());
  const figure=makeFigure(sampleRows('spectrum'),null,settings,'es','spectrum');
  assert.match(figure.layout.annotations[0].text,/λ = 546 nm/);
  assert.equal(figure.data.length,1);
});
