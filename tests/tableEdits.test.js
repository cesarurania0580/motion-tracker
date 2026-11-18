import test from 'node:test';
import assert from 'node:assert/strict';
import {pasteCells} from '../src/components/graphing/tableEdits.js';
const columns=[{label:'X'},{label:'Y'},{label:'Hidden'},{label:'±ΔY',uncertainty:true}],rows=[['1','2','99','.1'],['3','4','98','.2'],['5','6','97','.3']];
const selection={anchor:{row:0,col:1},focus:{row:2,col:1}};
test('scalar paste fills the selected column without touching other cells or original rows',()=>{
 const before=JSON.stringify(rows),result=pasteCells(rows,columns,[0,1,3],selection,[['.05']]);
 assert.deepEqual(result.map(r=>r[1]),['.05','.05','.05']);assert.deepEqual(result.map(r=>r[2]),['99','98','97']);assert.equal(JSON.stringify(rows),before);
});
test('rectangular paste follows visible order, grows rows and rejects invalid blocks atomically',()=>{
 const sel={anchor:{row:2,col:1},focus:{row:2,col:1}};
 const result=pasteCells(rows,columns,[0,1,3],sel,[['7','.4'],['8','.5']]);assert.deepEqual(result[2],['5','7','97','.4']);assert.deepEqual(result[3],['','8','','.5']);
 const before=JSON.stringify(rows);assert.throws(()=>pasteCells(rows,columns,[0,1,3],sel,[['7','.4'],['8','-.5']]));assert.equal(JSON.stringify(rows),before);
 assert.throws(()=>pasteCells(rows,columns,[0,1],sel,[['7','8']]));
});
test('clear and zero uncertainties remain distinct',()=>{
 const sel={anchor:{row:0,col:3},focus:{row:2,col:3}};
 assert.deepEqual(pasteCells(rows,columns,[0,1,3],sel,[['0']]).map(r=>r[3]),['0','0','0']);
 assert.deepEqual(pasteCells(rows,columns,[0,1,3],sel,[['']]).map(r=>r[3]),['','','']);
 assert.throws(()=>pasteCells(rows,columns,[0,1,3],sel,[['Infinity']]));
});
