import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseVideoCSV,selectVideoColumns} from '../src/components/graphing/videoCSV.js';
import {parseTable} from '../src/components/graphing/graphDocument.js';
const csv='Time (s),X (m),Y (m),±ΔX (m),±ΔY (m),±Δt (s),Vx (m/s),Vy (m/s),±ΔVx (m/s),±ΔVy (m/s)\n0,1,2,.01,.02,0,3,4,.1,.2\n1,4,6,.03,.04,.01,,,,\n2,7,10,.05,.06,.01,3,4,,.3';
test('video CSV maps chosen axes and matching errors, preserving missing velocities/bounds',()=>{
 const source=parseVideoCSV(csv);assert.equal(source.columns.length,5);
 const result=selectVideoColumns(source,'time','y');assert.deepEqual(result.headers,['Time (s)','Y (m)']);
 assert.equal(result.rows[0].y,'2');assert.equal(result.rows[0].xError,'0');assert.equal(result.rows[0].error,'.02');
 const velocity=selectVideoColumns(source,'x','vx');assert.equal(velocity.rows.length,2);assert.equal(velocity.skipped,1);
 assert.equal(velocity.rows[1].x,'7');assert.equal(velocity.rows[1].error,'');
 assert.throws(()=>parseVideoCSV(csv.replace(',.03,.04',',-.03,.04')));
 assert.equal(parseVideoCSV('t,d\n0,1\n1,2'),null);
 assert.equal(parseTable('0,1,0,.1\n1,2,0,.1').rows.length,2);
});
test('legacy multi-section export maps position and velocity without treating Y as uncertainty',()=>{
 const old='Time (s),X (m),Y (m),Uncertainty (m)\n0,1,-2,.1\n1,2,-4,.1\n\nVelocity Data (Central Difference),Time (s),Vx (m/s),Vy (m/s)\n,0,1,-2\n,1,1,-2';
 const source=parseVideoCSV(old),position=selectVideoColumns(source,'time','y'),velocity=selectVideoColumns(source,'time','vy');
 assert.equal(position.rows[0].y,'-2');assert.equal(position.rows[0].error,'.1');assert.equal(position.rows[0].xError,'');
 assert.equal(velocity.rows[1].y,'-2');assert.equal(velocity.rows[1].error,'');
 assert.deepEqual(selectVideoColumns(parseVideoCSV(csv.replaceAll('(m','(px')),'x','y').headers,['X (px)','Y (px)']);
});
test('primary and secondary palette hover mappings differ from their base colors',()=>{
 const css=readFileSync(new URL('../src/styles/palette.css',import.meta.url),'utf8');
 const declaration=key=>{const line=css.split('\n').find(line=>line.startsWith('[data-theme] .'+key)&&line.includes('background-color:'));assert.ok(line,key);return line.match(/background-color:([^;}]+)/)[1];};
 for(const [base,hover] of [['bg-cyan-400','hover\\:bg-cyan-300'],['bg-slate-700','hover\\:bg-slate-600'],['bg-slate-100','hover\\:bg-slate-200']])assert.notEqual(declaration(base),declaration(hover),base);
});
