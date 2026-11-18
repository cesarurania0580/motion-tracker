import test from 'node:test';
import assert from 'node:assert/strict';
import {blankRow,evaluateRows,parseTable,graphDocument,readGraphDocument,MAX_ROWS} from '../src/components/graphing/graphDocument.js';
import {MODEL_EQUATIONS,parameterSymbol,arbitraryUnits} from '../src/components/graphing/fitModels.js';
import {DEFAULT_SETTINGS} from '../src/components/graphing/defaultSettings.js';
import {fitSample} from '../src/components/graphing/trialFigure.js';
import {fitCurve} from '../src/utils/curveFit.js';

const meta={title:'Pendulum',xName:'Length',yName:'Period²',xUnit:'m',yUnit:'s²'};
const state={model:'linear',showWorst:true,dx:'',dy:'0.1',settings:{...DEFAULT_SETTINGS,title:null,xLabel:null,yLabel:null,dragMode:'zoom'}};
test('GF-03: blanks and invalid drafts never turn into plotted zeros',()=>{
 const source=[blankRow(),{x:'0',y:'1',xError:'',error:''},{x:'2e-3',y:'3.2',xError:'0',error:'0.1'},{x:'',y:'2'},{x:'3',y:'no'},{x:'4',y:'5',error:'-1'},{x:'0x12',y:'4'}];
 const before=JSON.stringify(source),result=evaluateRows(source);
 assert.equal(result.rows.length,2);assert.equal(result.invalid,4);
 assert.equal(result.rows[0].x,0);assert.equal(result.rows[0].xError,null);assert.equal(result.rows[1].x,.002);
 assert.equal(result.rows[1].sourceIndex,2);assert.equal(JSON.stringify(source),before);
});
test('GF-03: quoted CSV, TSV and semicolon imports preserve numbers and optional uncertainties',()=>{
 const csv='"Length (m)","Period² (s²)","±X","±Y"\r\n0,1,,0.1\r\n2,3,0.02,0.2';
 const result=parseTable(csv);assert.equal(result.headers[0],'Length (m)');assert.equal(result.rows[0].xError,'');
 assert.deepEqual(evaluateRows(parseTable('0\t1\n2\t3').rows).rows.map(p=>[p.x,p.y]),[[0,1],[2,3]]);
 assert.equal(parseTable('0;1;0;0.1\n2;3;0;0.1').rows.length,2);
 for(const text of ['0,1\n2,hello','0,1,2','0,1\n2,3,0,1','0,1,0,-1','"bad,header\n0,1','x,y\n','0,NaN'])assert.throws(()=>parseTable(text),text);
 assert.throws(()=>parseTable(Array.from({length:MAX_ROWS+1},()=> '0,1').join('\n')));
});
test('GF-04: graph documents round-trip data, metadata and graph settings without a video project',()=>{
 const rows=[{x:'0',y:'1',xError:'',error:'.2'},{x:'1',y:'3',xError:'0',error:'.2'}];
 const restored=readGraphDocument(graphDocument(meta,rows,state));
 assert.deepEqual(restored,{meta,rows,graph:state});
 const changed=JSON.parse(graphDocument(meta,rows,state));changed.version=99;assert.throws(()=>readGraphDocument(JSON.stringify(changed)));
 changed.version=1;changed.graph.settings.fontSize=500;assert.throws(()=>readGraphDocument(JSON.stringify(changed)));
 assert.throws(()=>readGraphDocument(JSON.stringify({objects:[],points:[]})));
 assert.equal(readGraphDocument(graphDocument(meta,[blankRow()],undefined)).rows[0].x,'');
});
test('GF-02/05: standard notation maps to existing fit parameters and preserves fitted numbers',()=>{
 assert.equal(MODEL_EQUATIONS.linear,'y = Ax + B');assert.equal(parameterSymbol('Linear','m'),'A');
 assert.equal(parameterSymbol('Sinusoidal','B'),'ω');assert.equal(parameterSymbol('Sinusoidal','C'),'φ');
 assert.deepEqual(arbitraryUnits('Linear','m','s²'),{m:'s²/(m)',b:'s²'});
 const rows=evaluateRows(parseTable('0,1\n1,3\n2,5').rows).rows;
 const fit=fitSample(rows,'linear'),previous=fitCurve(rows,'linear','x','y');
 assert.deepEqual(fit.params,previous.params);assert.equal(fit.r2,previous.r2);
});
test('GF-01/03: standalone initial view has simultaneous worksheet and figure, with no media prerequisite',async()=>{
 const {build}=await import('esbuild'),{fileURLToPath}=await import('node:url'),{createRequire}=await import('node:module'),{runInThisContext}=await import('node:vm');
 const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Graph from './src/components/graphing/StandaloneGraphing.jsx';export const html=renderToStaticMarkup(<Graph/>);export const embedded=renderToStaticMarkup(<Graph embedded language="es"/>);`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,write:false,loader:{'.css':'empty','.ttf':'empty'},platform:'node',format:'cjs',jsx:'automatic',packages:'external',logLevel:'silent'});
 const module={exports:{}};runInThisContext(`(function(require,module,exports){${result.outputFiles[0].text}\n})`)(createRequire(import.meta.url),module,module.exports);
 assert.match(module.exports.embedded,/design-workbench/);
 assert.doesNotMatch(module.exports.embedded,/design-f|tools-top|tools-close/);
 assert.match(module.exports.embedded,/role="tabpanel"/);
 assert.match(module.exports.embedded,/y = Ax/);
 assert.match(module.exports.embedded,/Etiqueta X/);
 assert.match(module.exports.embedded,/f-worksheet/);
 assert.match(module.exports.embedded,/X columna/);
 assert.match(module.exports.embedded,/workbench-models/);
 assert.doesNotMatch(module.exports.html,/design-workbench|workbench-axis-controls/);
 assert.match(module.exports.html,/design-f tools-top/);
 assert.match(module.exports.html,/No video needed/);assert.match(module.exports.html,/f-worksheet/);assert.match(module.exports.html,/trial-graph-section/);assert.match(module.exports.html,/X label/);assert.match(module.exports.html,/Y label/);assert.doesNotMatch(module.exports.html,/X quantity|Y quantity/);assert.ok(module.exports.html.indexOf('id="trial-tab-fit"')<module.exports.html.indexOf('class="trial-graph-section"'));assert.match(module.exports.html,/Save graph document/);
});
