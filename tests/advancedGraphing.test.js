import test from 'node:test';
import assert from 'node:assert/strict';
import {advancedFit,ADVANCED_MODELS} from '../src/components/graphing/advancedFit.js';
import {MODEL_EQUATIONS} from '../src/components/graphing/fitModels.js';
import {fitSample,makeFigure} from '../src/components/graphing/trialFigure.js';
import {DEFAULT_SETTINGS} from '../src/components/graphing/defaultSettings.js';
import {advancedTransfer} from '../src/components/graphing/advancedTransfer.js';
import {graphRows} from '../src/components/graphing/prototype/minimalData.js';
import {selectedTSV} from '../src/components/graphing/selectionData.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('advanced models recover inverse-square, exponential decay and logarithmic coefficients',()=>{
 for(const [model,A,B,fn] of [['power',12,-2,x=>12*x**-2],['exponential',50,-.3,x=>50*Math.exp(-.3*x)],['logarithmic',3,-2,x=>3*Math.log(x)-2]]){
  const rows=Array.from({length:15},(_,i)=>({x:(i+1)/2,y:fn((i+1)/2)}));
  const {fit,issue}=advancedFit(rows,model);assert.equal(issue,null);near(fit.params.A,A);near(fit.params.B,B);near(fit.rmse,0);near(fit.r2,1);
  for(const row of rows)near(fit.fn(row.x),row.y);
 }
});
test('advanced fits report invalid domains without silently discarding measurements',()=>{
 for(const [model,rows] of [['power',[{x:0,y:1},{x:2,y:3}]],['exponential',[{x:0,y:0},{x:1,y:2}]],['logarithmic',[{x:-1,y:0},{x:2,y:1}]]]){
  assert.equal(advancedFit(rows,model).issue,model);assert.equal(advancedFit(rows,model).fit,null);
 }
 assert.equal(advancedFit([{x:1,y:2},{x:1,y:3}],'power').issue,'range');
 assert.equal(advancedFit([{x:1,y:2}],'power').issue,'points');
});
test('log-transformed fit reports original-scale residuals and finite domain gaps in exported figure',()=>{
 const rows=[{x:1,y:10},{x:2,y:3},{x:3,y:1.2},{x:4,y:.7}];const {fit}=advancedFit(rows,'power');
 const expected=Math.sqrt(rows.reduce((s,r)=>s+(r.y-fit.fn(r.x))**2,0)/rows.length);near(fit.rmse,expected);assert.equal(fit.method,'log-y');
 const figure=makeFigure(rows,fit,{...DEFAULT_SETTINGS,title:'Power',xLabel:'r',yLabel:'I',axisMode:'manual',xMin:'-1',xMax:'4',yMin:'0',yMax:'12'},'en','independent');
 assert.ok(figure.data[1].y.some(v=>v===null));assert.ok(figure.data[1].y.every(v=>v===null||Number.isFinite(v)));assert.equal(figure.data[1].cliponaxis,true);
});
test('video fit menu and original fitting results remain unchanged',()=>{
 assert.equal(MODEL_EQUATIONS.power,undefined);assert.ok(ADVANCED_MODELS.power);
 const rows=[{x:0,y:1},{x:1,y:3},{x:2,y:5}];const before=fitSample(rows,'linear'),after=advancedFit(rows,'linear').fit;
 assert.deepEqual(after.params,before.params);assert.equal(after.text,before.text);assert.equal(after.rmse,before.rmse);
});
test('direct transfer preserves complete measured columns and units, omits virtual samples, and isolates edits',()=>{
 const position=[{time:0,x:2,y:-1,xError:.1,yError:.2,timeError:0},{time:1,x:4,y:-3,xError:.1,yError:.2},{time:2,x:99,y:99,isVirtual:true}];
 const velocity=[{time:0,vx:2,vy:-2,vxError:.3,vyError:.4}];const original=JSON.stringify(position);
 const seed=advancedTransfer(position,velocity,{scaled:true,x:'time',y:'vy',title:'Object A'});
 assert.equal(seed.table.columns.length,10);assert.equal(seed.table.rows.length,2);assert.deepEqual(seed.axes,[0,7]);assert.equal(seed.meta.yUnit,'m/s');
 const plotted=graphRows(seed.table.rows,seed.table.columns,seed.axes);assert.equal(plotted.rows[0].y,-2);assert.equal(plotted.rows[0].error,.4);assert.equal(plotted.rows[0].xError,0);
 assert.equal(seed.table.rows[1][7],'');seed.table.rows[0][1]='77';assert.equal(JSON.stringify(position),original);
 assert.equal(advancedTransfer(position,velocity).meta.yUnit,'px');
});
test('rectangular copy preserves blanks, precision and visible order without changing source',()=>{
 const rows=[['1.234567890123','2','','4'],['5','6','7','8']];const snapshot=JSON.stringify(rows);
 assert.equal(selectedTSV(rows,[0,2,1],{anchor:{row:1,col:1},focus:{row:0,col:0}}),'1.234567890123\t\t2\n5\t7\t6');
 assert.equal(selectedTSV(rows,[0,1],{anchor:{row:0,col:2},focus:{row:1,col:0}}),'');assert.equal(JSON.stringify(rows),snapshot);
});
