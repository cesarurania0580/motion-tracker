import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {numberParts,numberColumns} from '../src/components/graphing/numberAlignment.js';
import {MODEL_TEX,fitTex,mathNumber} from '../src/components/graphing/mathNotation.js';
import {advancedFit} from '../src/components/graphing/advancedFit.js';
import {selectedTSV} from '../src/components/graphing/selectionData.js';
test('decimal alignment preserves signs, precision, blanks and scientific notation',()=>{
 for(const text of ['0.1','12.35','-2.004','100','+0.0500','.5','12.','-1.020e-7']){
  const p=numberParts(text);assert.ok(p);assert.equal(p.integer+p.point+p.fraction+p.exponent,text);
 }
 for(const text of ['','-','.','n/a'])assert.equal(numberParts(text),null);
 const rows=[['0.1'],['12.3500'],['-2.004e-7'],['100']],before=JSON.stringify(rows);
 const metrics=numberColumns(rows,[{label:'X'}]);assert.equal(metrics[0].fraction,4);assert.equal(metrics[0].exponent,3);assert.equal(metrics[0].point,1);
 assert.equal(selectedTSV(rows,[0],{anchor:{row:0,col:0},focus:{row:3,col:0}}),'0.1\n12.3500\n-2.004e-7\n100');assert.equal(JSON.stringify(rows),before);
});
test('every model equation and coefficient equation renders as real mathematical HTML and MathML',()=>{
 const fits={linear:{m:-2,b:3},quadratic:{A:1,B:-2,C:3},sinusoidal:{A:2,B:3,C:-.5,D:1},power:{A:12,B:-2},exponential:{A:1e-8,B:-.5},logarithmic:{A:2,B:-3}};
 for(const model of Object.keys(fits))for(const tex of [MODEL_TEX[model],fitTex({params:fits[model]},model)]){
  const html=katex.renderToString(tex,{throwOnError:true,trust:false,output:'htmlAndMathml'});assert.match(html,/katex-html/);assert.match(html,/<math/);assert.doesNotMatch(html,/katex-error/);
 }
 assert.equal(fitTex({params:fits.power},'power'),'y=12x^{-2}');assert.equal(mathNumber(1e-8),String.raw`1\times 10^{-8}`);
});
test('typesetting does not change the computed fit or scientific precision',()=>{
 const rows=[{x:1,y:12},{x:2,y:3},{x:3,y:12/9}];const {fit}=advancedFit(rows,'power');const before={...fit.params},prediction=fit.fn(2);
 fitTex(fit,'power');assert.deepEqual(fit.params,before);assert.equal(fit.fn(2),prediction);
});
