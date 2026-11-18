import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSheet,mapSheetRows,videoWorksheet,parseWideWorksheet} from '../src/components/graphing/workbenchData.js';
import {evaluateRows,graphDocument,readGraphDocument} from '../src/components/graphing/graphDocument.js';
const meta={title:'Trial',xName:'Time',yName:'Position',xUnit:'s',yUnit:'m'};
test('workbench axis swaps map matching bounds without altering source values or exclusions',()=>{
 const rows=[{x:'1',y:'2',xError:'.01',error:'.2',reason:'blurred',excluded:true}];
 const sheet={...defaultSheet(),x:'y',y:'x'},copy=JSON.stringify(rows);
 const mapped=mapSheetRows(rows,sheet);assert.equal(mapped[0].x,'2');assert.equal(mapped[0].error,'.01');assert.equal(mapped[0].xError,'.2');assert.equal(mapped[0].excluded,true);assert.equal(JSON.stringify(rows),copy);
});
test('all video columns and source edits survive graph documents and axis reselection',()=>{
 const source={columns:[{key:'time',label:'Time (s)'},{key:'y',label:'Y (m)'},{key:'vy',label:'Vy (m/s)'}],data:[{time:'0',y:'2',vy:'3',timeError:'0',yError:'.1',vyError:''}]};
 const imported=videoWorksheet(source,'time','y');
 const doc=readGraphDocument(graphDocument(meta,imported.rows,undefined,{x:'identity',y:'identity'},imported.sheet));
 assert.deepEqual(doc.rows,imported.rows);assert.deepEqual(doc.sheet,imported.sheet);
 doc.rows[0].c2='4';doc.sheet.y='c2';const mapped=evaluateRows(mapSheetRows(doc.rows,doc.sheet)).rows;
 assert.equal(mapped[0].y,4);assert.equal(mapped[0].error,null);assert.equal(mapped[0].xError,0);
 const malformed=JSON.parse(graphDocument(meta,imported.rows,undefined,undefined,imported.sheet));malformed.sheet.y='missing';assert.throws(()=>readGraphDocument(JSON.stringify(malformed)));
});
test('wide tables preserve named quantities; invalid four-column uncertainty data cannot bypass validation',()=>{
 const imported=parseWideWorksheet('Time (s),X (m),Y (m)\n0,1,2\n1,3,4');
 assert.equal(imported.sheet.columns[2].unit,'m');assert.equal(imported.rows[1].c2,'4');
 assert.throws(()=>parseWideWorksheet('0,1,0,-1'));assert.throws(()=>parseWideWorksheet('a,b,c\n0,1,no'));
});
test('remapping uncertainty to another column preserves original uncertainty cells on save',()=>{
 const source={columns:[{key:'time',label:'Time (s)'},{key:'y',label:'Y (m)'},{key:'bound',label:'Bound (m)'}],data:[{time:'0',y:'2',bound:'.3',yError:'.1'}]};
 const imported=videoWorksheet(source,'time','y');imported.sheet.columns[1].errorKey='c2';
 const restored=readGraphDocument(graphDocument(meta,imported.rows,undefined,undefined,imported.sheet));
 assert.equal(restored.rows[0].c1Error,'.1');assert.equal(evaluateRows(mapSheetRows(restored.rows,restored.sheet)).rows[0].error,.3);
 restored.sheet.columns[1].errorKey='c1Error';assert.equal(evaluateRows(mapSheetRows(restored.rows,restored.sheet)).rows[0].error,.1);
});
