import test from 'node:test';
import assert from 'node:assert/strict';
import {uncertaintyRows,worstFit} from '../src/components/graphing/worstFit.js';
import {WORST_FIT_TEXT} from '../src/components/graphing/worstFitText.js';
import {fitSample,makeFigure,clonePlot} from '../src/components/graphing/trialFigure.js';
import {DEFAULT_SETTINGS} from '../src/components/graphing/defaultSettings.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const row=(x,y,error=1,xError=0)=>({x,y,error,xError});
function verify(rows,result){
 assert.equal(result.status,'ok');
 for(const key of ['min','max'])for(const p of rows)
  assert.ok(Math.abs(result[key].fn(p.x)-p.y)<=p.error+Math.abs(result[key].m)*p.xError+1e-9);
}

test('WF-01: exact textbook bounds, signed negative gradients and worst deviation',()=>{
 const rows=[row(0,0),row(10,10)],r=worstFit(rows,{m:1,b:0});verify(rows,r);
 near(r.min.m,.8);near(r.max.m,1.2);near(r.delta,.2);near(r.percent,20);
 const negative=[row(0,0),row(10,-10)],n=worstFit(negative,{m:-1,b:0});verify(negative,n);
 near(n.min.m,-1.2);near(n.max.m,-.8);near(n.delta,.2);
 const offCenter=worstFit(rows,{m:.9,b:.5});assert.equal(offCenter.worst,'max');near(offCenter.delta,.3);
});

test('WF-03: interior uncertainty bars constrain bounds, not just endpoints',()=>{
 const rows=[row(0,0,1),row(5,5.8,.1),row(10,10,1)];
 const result=worstFit(rows,{m:1,b:.4});verify(rows,result);
 near(result.min.m,.94);near(result.max.m,1.06);
 assert.equal(result.bestAcceptable,false);
 assert.equal(worstFit([row(0,0,.1),row(1,5,.1),row(2,2,.1)],{m:1,b:0}).status,'infeasible');
});

test('WF-02: uncertainty rectangles include X errors and explicit uniform overrides',()=>{
 const rows=Object.freeze([Object.freeze(row(0,0,1,1)),Object.freeze(row(10,10,1,1))]);
 const r=worstFit(rows,{m:1,b:0});verify(rows,r);near(r.min.m,8/12);near(r.max.m,12/8);
 const mapped=uncertaintyRows(rows,'0','.5');assert.equal(mapped[0].error,.5);assert.equal(rows[0].error,1);
 assert.equal(uncertaintyRows(rows,'-1',''),null);assert.equal(uncertaintyRows(rows,'','Infinity'),null);
 assert.equal(worstFit(uncertaintyRows([row(0,0,null,null),row(10,10,null,null)]),{m:1,b:0}).status,'missing');
 assert.equal(uncertaintyRows([row(0,0,1,null)])[0].xError,0);
});

test('WF-03: degenerate, flat, missing and unbounded datasets report honest results',()=>{
 assert.equal(worstFit([row(0,0),row(0,0)],{m:0,b:0}).status,'unbounded');
 assert.equal(worstFit([row(0,0,0,5),row(1,1,0,5)],{m:1,b:0}).status,'unbounded');
 assert.equal(worstFit([row(0,0,0),row(1,1,0)],{m:1,b:0}).status,'missing');
 assert.equal(worstFit([row(0,0)],{m:0,b:0}).status,'missing');
 assert.equal(worstFit([row(0,0),row(NaN,1)],{m:1,b:0}).status,'missing');
 const rows=[row(0,2),row(10,2)],r=worstFit(rows,{m:0,b:2});verify(rows,r);
 near(r.min.m,-.2);near(r.max.m,.2);assert.equal(r.percent,null);
});

test('WF-04: shared preview/export includes distinct clipped lines and actual uncertainties',()=>{
 const rows=uncertaintyRows([row(0,0),row(10,10)],'0','.5'),fit=fitSample(rows,'linear');
 const before=JSON.stringify(rows),bounds=worstFit(rows,fit.params);
 const figure=makeFigure(rows,fit,{...DEFAULT_SETTINGS,title:'Bounds',xLabel:'s',yLabel:'m',axisMode:'manual',xMin:0,xMax:5,yMin:0,yMax:5},'en','motion',{bounds,boundsText:WORST_FIT_TEXT.en});
 assert.equal(figure.data.length,4);assert.ok(figure.data.every(trace=>trace.cliponaxis));
 assert.deepEqual(figure.data[0].error_y.array,[.5,.5]);assert.notEqual(figure.data[2].line.dash,figure.data[3].line.dash);
 assert.deepEqual(figure.data[2].x,[0,5]);assert.equal(figure.data[2].y[1],bounds.min.fn(5));
 clonePlot(figure).data[0].y[0]=100;assert.equal(JSON.stringify(rows),before);
 assert.deepEqual(Object.keys(WORST_FIT_TEXT.en).sort(),Object.keys(WORST_FIT_TEXT.es).sort());
});
