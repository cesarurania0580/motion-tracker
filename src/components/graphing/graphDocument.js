import {TRANSFORMS} from './studentAnalysis.js';
import {MODEL_EQUATIONS} from './fitModels.js';
import {DEFAULT_SETTINGS} from './defaultSettings.js';
import {figureSize,manualRanges} from './trialFigure.js';
export const MAX_ROWS=2000;
export const blankRow=()=>({x:'',y:'',xError:'',error:''});
const numeric=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
function value(raw){const s=String(raw??'').trim();return s!==''&&numeric.test(s)&&Number.isFinite(Number(s))?Number(s):null;}
export function evaluateRows(rawRows){
  let invalid=0,excluded=0;
  const rows=[];
  rawRows.forEach((raw,sourceIndex)=>{
    if(['x','y','xError','error'].every(key=>String(raw[key]??'').trim()===''))return;
    if(raw.excluded&&raw.reason?.trim()){excluded++;return;}
    const x=value(raw.x),y=value(raw.y),xError=value(raw.xError),error=value(raw.error);
    if(x===null||y===null||['xError','error'].some(key=>String(raw[key]??'').trim()!==''&&(value(raw[key])===null||value(raw[key])<0))){invalid++;return;}
    rows.push({x,y,xError,error,sourceIndex});
  });
  return {rows,invalid,excluded};
}

// Quoted fields, CRLF and spreadsheet tabs; reject malformed records atomically.
export function parseDelimitedRecords(text){
  if(typeof text!=='string'||text.length>500000)throw Error('size');
  const source=text.replace(/^\uFEFF/,'').trim();
  if(!source)throw Error('empty');
  const first=source.split(/\r?\n/)[0];
  const separator=first.includes('\t')?'\t':first.includes(';')?';':',';
  const records=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<=source.length;i++){
    const c=source[i]??'\n';
    if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c==='"'){if(field.trim()||closed)throw Error('format');quoted=true;continue;}
    if(c===separator||c==='\n'||c==='\r'){
      row.push(field.trim());field='';closed=false;
      if(c!==separator){if(row.some(cell=>cell!==''))records.push(row);row=[];if(c==='\r'&&source[i+1]==='\n')i++;}
    }else{if(closed&&!/\s/.test(c))throw Error('format');field+=c;}
  }
  if(quoted)throw Error('format');
  return records;
}
export function parseTable(text){
  const records=parseDelimitedRecords(text);
  let headers=null;
  if(records[0]?.length>=2&&value(records[0][0])===null&&value(records[0][1])===null)headers=records.shift();
  if(!records.length||records.length>MAX_ROWS)throw Error('size');
  const width=records[0].length;
  if(![2,4].includes(width)||records.some(r=>r.length!==width))throw Error('columns');
  const rows=records.map(c=>({x:c[0],y:c[1],xError:c[2]??'',error:c[3]??''}));
  if(evaluateRows(rows).invalid||evaluateRows(rows).rows.length!==rows.length)throw Error('values');
  return {rows,headers};
}
const safeString=(value,max)=>typeof value==='string'&&value.length<=max;
export function validateGraphState(state){
  if(!state)return undefined;
  if(!Object.hasOwn(MODEL_EQUATIONS,state.model)||typeof state.showWorst!=='boolean')throw Error('document');
  for(const k of ['dx','dy'])if(typeof state[k]!=='string'||state[k].length>64||(state[k]!==''&&(value(state[k])===null||value(state[k])<0)))throw Error('document');
  const s=state.settings;
  if(!s||typeof s!=='object')throw Error('document');
  figureSize(s);manualRanges(s);
  if(!['auto','manual'].includes(s.axisMode)||!['zoom','pan'].includes(s.dragMode)||!['circle','square','diamond','cross'].includes(s.marker))throw Error('document');
  if(!/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(s.color)||!Number.isFinite(s.fontSize)||s.fontSize<12||s.fontSize>20||!Number.isFinite(s.markerSize)||s.markerSize<3||s.markerSize>10)throw Error('document');
  for(const key of ['grid','legend','errorBars','note'])if(typeof s[key]!=='boolean')throw Error('document');
  for(const key of ['title','xLabel','yLabel'])if(s[key]!==null&&!safeString(s[key],100))throw Error('document');
  for(const key of ['xMin','xMax','yMin','yMax'])if(!safeString(s[key],64))throw Error('document');
  const keys=[...Object.keys(DEFAULT_SETTINGS),'title','xLabel','yLabel','dragMode'];
  return {model:state.model,showWorst:state.showWorst,dx:state.dx,dy:state.dy,settings:Object.fromEntries(keys.map(k=>[k,s[k]]))};
}
export function readGraphDocument(text){
  if(typeof text!=='string'||text.length>1000000)throw Error('size');
  const doc=JSON.parse(text);
  if(doc.type!=='phystracker-graph'||doc.version!==1||!Array.isArray(doc.rows)||doc.rows.length>MAX_ROWS)throw Error('document');
  const meta={};for(const key of ['title','xName','yName','xUnit','yUnit']){if(!safeString(doc.meta?.[key],100))throw Error('document');meta[key]=doc.meta[key];}
  let sheet;
  if(doc.sheet!==undefined){
    const input=doc.sheet,validKey=key=>typeof key==='string'&&/^(x|y|c\d{1,2})$/.test(key);
    if(!input||!Array.isArray(input.columns)||input.columns.length<2||input.columns.length>12)throw Error('document');
    const columns=input.columns.map(c=>{
      if(!validKey(c?.key)||!safeString(c.name,100)||!safeString(c.unit,100)||typeof c.errorKey!=='string'||!/^(|x|y|xError|error|c\d{1,2}(Error)?)$/.test(c.errorKey))throw Error('document');
      return {key:c.key,name:c.name,unit:c.unit,errorKey:c.errorKey};
    });
    if(new Set(columns.map(c=>c.key)).size!==columns.length||!['x','y'].every(axis=>columns.some(c=>c.key===input[axis])))throw Error('document');
    sheet={columns,x:input.x,y:input.y};
  }
  const rows=doc.rows.map(row=>{const fields=Object.fromEntries(['x','y','xError','error'].map(key=>{
    if(!safeString(row?.[key],64))throw Error('document');return [key,row[key]];
  }));
    if(sheet)for(const c of sheet.columns)for(const key of [c.key,c.errorKey,c.key==='x'?'xError':c.key==='y'?'error':`${c.key}Error`].filter(Boolean)){if(!safeString(row[key]??'',64))throw Error('document');fields[key]=row[key]??'';}
    if(row.excluded!==undefined){if(typeof row.excluded!=='boolean')throw Error('document');fields.excluded=row.excluded;}
    for(const key of ['reason','note'])if(row[key]!==undefined){if(!safeString(row[key],2000))throw Error('document');fields[key]=row[key];}
    if(fields.excluded&&!fields.reason?.trim())throw Error('document');
    return fields;
  });
  const result={meta,rows,graph:validateGraphState(doc.graph)};
  if(sheet)result.sheet=sheet;
  if(doc.operations!==undefined){if(!doc.operations||!['x','y'].every(k=>TRANSFORMS.includes(doc.operations[k])))throw Error('document');result.operations={x:doc.operations.x,y:doc.operations.y};}
  return result;
}
export function graphDocument(meta,rows,graph,operations,sheet){
  const text=JSON.stringify({type:'phystracker-graph',version:1,meta,rows,graph,operations,sheet},null,2);
  readGraphDocument(text);return text;
}
