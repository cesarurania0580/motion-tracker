import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBudget,cleanBudget,scaleBudget,positionBounds,velocityBounds,formatMeasurement} from '../src/utils/measurementUncertainty.js';
import {transformValue,transformRows,repeatedMeasurement} from '../src/components/graphing/studentAnalysis.js';
import {evaluateRows,graphDocument,readGraphDocument} from '../src/components/graphing/graphDocument.js';
import {worstFit} from '../src/components/graphing/worstFit.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('MU: location and shared calibration contributions are separate; old budgets are unknown',()=>{
 assert.deepEqual(cleanBudget(undefined),emptyBudget());assert.deepEqual(cleanBudget({length:'-2',endpoint:'0',time:'Infinity'}),{length:'',endpoint:'0',time:''});
 const points=[{x:0,y:0},{x:500,y:0}];
 const missing=scaleBudget(500,points,emptyBudget());assert.equal(missing.complete,false);
 const scale=scaleBudget(500,points,{length:'.001',endpoint:'1'});
 near(scale.relative,.005);assert.equal(scale.complete,true);
 const errors=positionBounds(-2,1,2,500,scale);near(errors.xError,.014);near(errors.yError,.009);
 assert.deepEqual(positionBounds(100,20,2,null,scaleBudget(null,[],emptyBudget())),{xError:2,yError:2});
 assert.equal(scaleBudget(500,[],{length:'0',endpoint:'0'}).complete,false);
});
test('MU: velocity propagates stencil weights and common scale once without altering points',()=>{
 const points=Object.freeze([0,1,2].map(time=>Object.freeze({time}))),scale={relative:.01,complete:true};
 const middle=velocityBounds(points,1,3,-4,2,500,scale,'0');near(middle.vxError,.034);near(middle.vyError,.044);
 const edge=velocityBounds(points,0,3,-4,2,500,scale,'.01');near(edge.vxError,.106);
 for(const timing of ['', '1'])assert.equal(velocityBounds(points,1,3,4,2,500,scale,timing).vxError,null);
 assert.equal(velocityBounds([{time:0},{time:1},{time:3}],0,1,1,2,500,scale,'0').vxError,null);
 assert.equal(velocityBounds(points,1,3,4,2,500,{relative:0,complete:false},'0').vxError,null);
});
test('MU: display rounding follows uncertainty while source precision stays intact',()=>{
 assert.equal(formatMeasurement(1.23456,.0123),'1.235 ± 0.012');
 assert.equal(formatMeasurement(1.23456,.0345),'1.23 ± 0.03');
 assert.equal(formatMeasurement(-1.23456,0),'-1.23456 ± 0');
 assert.equal(formatMeasurement(1.23456,null),'1.23456');
 assert.match(formatMeasurement(1.23e-9,2e-11),/10\^-9/);
});
test('MU: transformed intervals bound nonlinear errors, preserve missing errors and reject singularities',()=>{
 const square=transformValue(2,.1,'square');near(square.value,4);near(square.error,.41);
 near(transformValue(.1,.2,'square').error,.08);
 near(transformValue(2,.5,'reciprocal').error,1/6);
 assert.equal(transformValue(2,null,'square').error,null);
 for(const [value,error,operation] of [[0,1,'reciprocal'],[1,2,'ln'],[1,2,'sqrt'],[1,0,'eval']])assert.throws(()=>transformValue(value,error,operation));
 const rows=Object.freeze([Object.freeze({x:2,y:3,xError:.1,error:.2,sourceIndex:4})]);
 const result=transformRows(rows,{x:'square',y:'identity'});near(result.rows[0].x,4);near(rows[0].x,2);assert.equal(result.rows[0].sourceIndex,4);
});
test('MU: repeat summaries apply instrument floor and preserve original repeats',()=>{
 const values=Object.freeze([9,10,11]);const result=repeatedMeasurement(values,.5);near(result.mean,10);near(result.error,1);
 near(repeatedMeasurement([10,10],.2).error,.2);
 assert.throws(()=>repeatedMeasurement([1],0));assert.throws(()=>repeatedMeasurement([1,2],-1));
 assert.deepEqual(result.values,[9,10,11]);
});
test('MU: reversible exclusions, reasons, provenance and transforms survive graph save/open',()=>{
 const meta={title:'Test',xName:'t',yName:'x',xUnit:'s',yUnit:'m'};
 const rows=[{x:'1',y:'2',xError:'0',error:'.1',excluded:true,reason:'Occluded frame',note:'Original repeated readings: 1, 2, 3'},{x:'2',y:'3',xError:'',error:'.2'}];
 const operations={x:'square',y:'identity'},doc=readGraphDocument(graphDocument(meta,rows,undefined,operations));
 assert.deepEqual(doc.rows,rows);assert.deepEqual(doc.operations,operations);
 const selected=evaluateRows(doc.rows);assert.equal(selected.excluded,1);assert.equal(selected.rows[0].sourceIndex,1);
 doc.rows[0].excluded=false;assert.equal(evaluateRows(doc.rows).rows.length,2);
 assert.throws(()=>graphDocument(meta,[{...rows[0],reason:''}]));
});
test('MU: intercept extrema can occur away from the extreme-gradient lines',()=>{
 const rows=[{x:-1,y:0,error:1,xError:0},{x:0,y:0,error:.2,xError:0},{x:1,y:0,error:1,xError:0}];
 const result=worstFit(rows,{m:0,b:0});assert.equal(result.status,'ok');near(result.min.b,0);near(result.max.b,0);
 near(result.intercept.min,-.2);near(result.intercept.max,.2);near(result.intercept.delta,.2);
 const shifted=worstFit(rows.map(p=>({...p,x:p.x+10,y:p.y+3})),{m:0,b:3});near(shifted.intercept.min,-7);near(shifted.intercept.max,13);
});
