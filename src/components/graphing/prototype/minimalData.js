import {parseDelimitedRecords,MAX_ROWS,evaluateRows} from '../graphDocument.js';
import {parseVideoCSV} from '../videoCSV.js';
export const numeric=v=>/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(String(v).trim())&&Number.isFinite(Number(v));
export const defaultColumns=()=>[{label:'X',errorIndex:2},{label:'Y',errorIndex:3},{label:'±ΔX',uncertainty:true},{label:'±ΔY',uncertainty:true}];
const quantity=label=>label.replace(/\s*\([^()]*\)\s*$/,'').trim().toLowerCase();
export function readMinimalRecords(records){
 const cells=records.map(row=>row.map(v=>String(v).trim()));
 const headers=cells[0]?.slice(0,2).length===2&&cells[0].slice(0,2).every(v=>v&&!numeric(v))?cells.shift():null;
 const width=cells[0]?.length;
 if((headers&&headers.length!==width)||!width||width<2||width>32||!cells.length||cells.length>MAX_ROWS||cells.some(row=>row.length!==width||row.some(v=>v!==''&&!numeric(v))))throw Error('columns');
 const columns=Array.from({length:width},(_,i)=>({label:headers?.[i]||(['X','Y','±ΔX','±ΔY'][i]&&(width===2||width===4)?['X','Y','±ΔX','±ΔY'][i]:`C${i+1}`)}));
 columns.forEach(c=>{c.uncertainty=/^(?:±\s*)?Δ/.test(c.label);});
 columns.forEach((c,i)=>{if(c.uncertainty)return;const name=quantity(c.label);const error=columns.findIndex(d=>d.uncertainty&&[name,...(name==='time'?['t']:[])].includes(quantity(d.label.replace(/^(?:±\s*)?Δ\s*/,''))));if(error>=0&&error!==i)c.errorIndex=error;});
 if(!headers&&width===4){columns[0].errorIndex=2;columns[1].errorIndex=3;}
 if(cells.some(row=>row.some((v,i)=>columns[i].uncertainty&&v!==''&&Number(v)<0)))throw Error('uncertainty');
 return {columns,rows:cells};
}
export function readMinimalCSV(text){
 const source=parseVideoCSV(text),records=parseDelimitedRecords(text);
 // Current video files already contain all ten columns in the desired order.
 if(source&&records[0].length===10){const result=readMinimalRecords(records);result.columns[0].errorIndex=5;return result;}
 // Older video exports contain separate position and velocity sections.
 if(source){const columns=source.columns.flatMap(c=>[{label:c.label},{label:`±Δ${c.label}`,uncertainty:true}]);columns.forEach((c,i)=>{if(!c.uncertainty)c.errorIndex=i+1;});return {columns,rows:source.data.map(row=>source.columns.flatMap(c=>[row[c.key]??'',row[`${c.key}Error`]??'']))};}
 return readMinimalRecords(records);
}
export function graphRows(rows,columns,axes,enabled=[true,true]){
 return evaluateRows(rows.map(row=>({x:row[axes[0]]??'',y:row[axes[1]]??'',xError:enabled[0]?(row[columns[axes[0]]?.errorIndex]??''):'',error:enabled[1]?(row[columns[axes[1]]?.errorIndex]??''):''})));
}

export const populatedColumns=(rows,columns)=>columns.map((_,i)=>rows.some(row=>String(row[i]??'').trim()!==''));
export const importedErrors=(rows,columns)=>columns.map(c=>Number.isInteger(c.errorIndex)&&rows.some(row=>String(row[c.errorIndex]??'').trim()!==''));
export function ensureUncertainty(rows,columns,axis){
 const existing=columns[axis].errorIndex;
 if(Number.isInteger(existing)&&columns[existing])return {rows,columns,index:existing};
 const index=columns.length;
 return {index,columns:[...columns.map((c,i)=>i===axis?{...c,errorIndex:index}:c),{label:`±Δ${columns[axis].label}`,uncertainty:true}],rows:rows.map(row=>[...row,''])};
}
export function fillUncertainty(rows,columns,index,value){
 const text=String(value).trim();
 if(!columns[index]?.uncertainty||!numeric(text)||Number(text)<0)throw Error('uncertainty');
 return rows.map(row=>row.map((cell,i)=>i===index&&row.some((v,j)=>!columns[j]?.uncertainty&&String(v).trim()!=='')?text:cell));
}
export function tableColumnOrder(columns){
 const order=[],seen=new Set();
 function add(i){if(!seen.has(i)){seen.add(i);order.push(i);}}
 columns.forEach((c,i)=>{if(!c.uncertainty){add(i);if(Number.isInteger(c.errorIndex)&&columns[c.errorIndex])add(c.errorIndex);}});
 columns.forEach((_,i)=>add(i));return order;
}
