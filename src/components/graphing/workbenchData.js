import {blankRow,parseDelimitedRecords,MAX_ROWS} from './graphDocument.js';
export const defaultSheet=()=>({columns:[{key:'x',name:'X',unit:'',errorKey:'xError'},{key:'y',name:'Y',unit:'',errorKey:'error'}],x:'x',y:'y'});
export const columnLabel=c=>c.name+(c.unit?` (${c.unit})`:'');
export function splitLabel(label){const match=label.match(/^(.*?)\s*\(([^()]*)\)\s*$/);return {name:(match?match[1].trim():label).slice(0,100),unit:(match?match[2]:'').slice(0,100)};}
export function mapSheetRows(rows,sheet){
 const x=sheet.columns.find(c=>c.key===sheet.x),y=sheet.columns.find(c=>c.key===sheet.y);
 return rows.map(row=>({...row,x:row[x.key]??'',y:row[y.key]??'',xError:row[x.errorKey]??'',error:row[y.errorKey]??''}));
}
export function videoWorksheet(source,xKey,yKey){
 const columns=source.columns.map((c,i)=>({key:`c${i}`,...splitLabel(c.label),errorKey:`c${i}Error`}));
 return {sheet:{columns,x:columns[source.columns.findIndex(c=>c.key===xKey)].key,y:columns[source.columns.findIndex(c=>c.key===yKey)].key},
  rows:source.data.map(row=>({...blankRow(),...Object.fromEntries(source.columns.flatMap((c,i)=>[[`c${i}`,row[c.key]??''],[`c${i}Error`,row[`${c.key}Error`]??'']])),note:'Imported video CSV'}))};
}
export function parseWideWorksheet(text){
 const records=parseDelimitedRecords(text),width=records[0]?.length;
 if(!width||width<2||width>12||width===2||width===4)throw Error('columns');
 const number=v=>/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(v)&&Number.isFinite(Number(v));
 const headers=records[0].every(v=>!number(v))?records.shift():null;
 if(!records.length||records.length>MAX_ROWS||records.some(row=>row.length!==width||row.some(v=>v.length>64||(v!==''&&!number(v)))))throw Error('values');
 const columns=Array.from({length:width},(_,i)=>({key:`c${i}`,...splitLabel(headers?.[i]||`Column ${i+1}`),errorKey:`c${i}Error`}));
 return {sheet:{columns,x:'c0',y:'c1'},rows:records.map(row=>({...blankRow(),...Object.fromEntries(columns.flatMap((c,i)=>[[c.key,row[i]],[c.errorKey,'']]))}))};
}
