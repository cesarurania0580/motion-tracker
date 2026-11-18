import test from 'node:test';
import assert from 'node:assert/strict';
import {readMinimalCSV,graphRows} from '../src/components/graphing/prototype/minimalData.js';
const header='Time (s),X (m),Y (m),±ΔX (m),±ΔY (m),±Δt (s),Vx (m/s),Vy (m/s),±ΔVx (m/s),±ΔVy (m/s)';
const values=['0','0.16453383501418922','-0.10092168329748102','0.007378848265968348','0.007378848265968348','0','-0.0002129748740309442','-0.34226846148300244','',''];
test('minimal CSV table keeps all ten video columns, original precision and empty bounds',()=>{
 const result=readMinimalCSV(`${header}\n${values.join(',')}`);
 assert.deepEqual(result.columns.map(c=>c.label),header.split(','));
 assert.deepEqual(result.rows,[values]);
});

test('wide numeric imports retain all columns and reject malformed records atomically',()=>{
 const result=readMinimalCSV('a,b,c,d,e\n1,2,-3,4,5\n6,7,8,9,10');
 assert.equal(result.columns.length,5);assert.deepEqual(result.rows[0],['1','2','-3','4','5']);
 assert.throws(()=>readMinimalCSV('a,b,c\n1,2'));assert.throws(()=>readMinimalCSV('X,Y,±ΔX,±ΔY\n1,2,-1,0'));
});

test('axis selection uses matching uncertainty columns and preserves edits in the full table',()=>{
 const table=readMinimalCSV(`${header}\n${values.join(',')}`);
 const original=JSON.stringify(table);
 let plotted=graphRows(table.rows,table.columns,[0,2]).rows[0];
 assert.equal(plotted.y,Number(values[2]));assert.equal(plotted.error,Number(values[4]));assert.equal(plotted.xError,0);
 assert.equal(JSON.stringify(table),original);
 table.rows[0][7]='-8.25';
 plotted=graphRows(table.rows,table.columns,[0,7]).rows[0];
 assert.equal(plotted.y,-8.25);assert.equal(plotted.error,null);
 graphRows(table.rows,table.columns,[0,1]);
 assert.equal(table.rows[0][7],'-8.25');assert.equal(table.columns.length,10);
});
test('ordinary two and four column data retain numeric and uncertainty semantics',()=>{
 const table=readMinimalCSV('0,1,.01,.2\n1,2,.01,.2');
 assert.equal(graphRows(table.rows,table.columns,[0,1]).rows[0].error,.2);
 const two=readMinimalCSV('Time (s),Position (m)\n0,1\n1,2');
 assert.equal(graphRows(two.rows,two.columns,[0,1]).rows[0].error,null);
 assert.throws(()=>readMinimalCSV('0,1,.01,-.2'));
});

test('empty imported columns hide while zero counts as data and activates its uncertainty',async()=>{
 const {populatedColumns,importedErrors}=await import('../src/components/graphing/prototype/minimalData.js');
 const table=readMinimalCSV(`${header}\n${values.join(',')}`);
 assert.deepEqual(populatedColumns(table.rows,table.columns),[true,true,true,true,true,true,true,true,false,false]);
 assert.equal(importedErrors(table.rows,table.columns)[0],true);
 assert.equal(importedErrors(table.rows,table.columns)[7],false);
 const time=readMinimalCSV('Time (s),Velocity (m/s),±ΔTime (s)\n0,2,0');
 assert.equal(time.columns[0].errorIndex,2);
});

test('adding uncertainty creates blank cells, reuses them, and leaves other quantities intact',async()=>{
 const {ensureUncertainty,tableColumnOrder}=await import('../src/components/graphing/prototype/minimalData.js');
 const table=readMinimalCSV('Time (s),Velocity (m/s)\n0,2\n1,3');
 const original=JSON.stringify(table);
 const next=ensureUncertainty(table.rows,table.columns,1);
 assert.equal(next.columns[1].errorIndex,2);assert.equal(next.columns[2].label,'±ΔVelocity (m/s)');
 assert.deepEqual(next.rows,[['0','2',''],['1','3','']]);assert.equal(JSON.stringify(table),original);
 const again=ensureUncertainty(next.rows,next.columns,1);assert.equal(again.columns.length,3);
 const time=ensureUncertainty(next.rows,next.columns,0);assert.deepEqual(tableColumnOrder(time.columns),[0,3,1,2]);
});

test('fill all validates bounds, preserves blank rows, and disabled errors do not erase measurements',async()=>{
 const {ensureUncertainty,fillUncertainty}=await import('../src/components/graphing/prototype/minimalData.js');
 const table=readMinimalCSV('Time (s),Velocity (m/s)\n0,2\n1,3');
 const next=ensureUncertainty([...table.rows,['','']],table.columns,1);
 const filled=fillUncertainty(next.rows,next.columns,next.index,'.15');
 assert.deepEqual(filled,[['0','2','.15'],['1','3','.15'],['','','']]);
 for(const value of ['-1','Infinity','oops',''])assert.throws(()=>fillUncertainty(next.rows,next.columns,next.index,value));
 assert.equal(graphRows(filled,next.columns,[0,1],[false,true]).rows[0].error,.15);
 assert.equal(graphRows(filled,next.columns,[0,1],[false,false]).rows[0].error,null);
 assert.equal(filled[0][2],'.15');
 assert.equal(graphRows(fillUncertainty(filled,next.columns,next.index,'0'),next.columns,[0,1],[false,true]).rows[0].error,0);
});

test('embedded minimal worksheet receives transferred measurements, units and uncertainties in app language',async()=>{
 const {build}=await import('esbuild'),{fileURLToPath}=await import('node:url'),{createRequire}=await import('node:module'),{runInThisContext}=await import('node:vm');
 const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Graph from './src/components/graphing/prototype/MinimalBench.jsx';export const html=renderToStaticMarkup(<Graph embedded language="es" seed={{rows:[{x:'1.25',y:'-2.5',xError:'0',error:'.15'}],meta:{title:'Transfer',xName:'Time',xUnit:'s',yName:'Velocity',yUnit:'m/s'}}}/>);`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,write:false,plugins:[{name:'ignore-styles',setup(build){build.onResolve({filter:/\.css$/},args=>({path:args.path,namespace:'empty-style'}));build.onLoad({filter:/.*/,namespace:'empty-style'},()=>({contents:'',loader:'js'}));}}],loader:{'.css':'empty','.ttf':'empty'},platform:'node',format:'cjs',jsx:'automatic',packages:'external',logLevel:'silent'});
 const module={exports:{}};runInThisContext(`(function(require,module,exports){${result.outputFiles[0].text}\n})`)(createRequire(import.meta.url),module,module.exports);
 const html=module.exports.html;
 assert.match(html,/katex-html/);assert.doesNotMatch(html,/katex-error/);
 assert.match(html,/minimal-embedded/);assert.match(html,/Importar CSV/);assert.doesNotMatch(html,/minimal-header/);
 for(const value of ['1.25','-2.5','.15','Transfer','m/s'])assert.ok(html.includes(`value="${value}"`));
 assert.match(html,/±ΔVelocity \(m\/s\)/);assert.match(html,/Time \(s\)/);
 assert.match(html,/type="checkbox" checked=""/);
});
