import {parseDelimitedRecords,MAX_ROWS} from './graphDocument.js';
const number=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const finite=v=>typeof v==='string'&&v.length<=64&&number.test(v)&&Number.isFinite(Number(v));
// Recognize our headers before the generic 2/4-column parser can misinterpret
// Time,X,Y,Uncertainty as X,Y,dX,dY. Never guess columns from their numeric values.
export function parseVideoCSV(text){
 const records=parseDelimitedRecords(text),header=records[0];
 const match=header?.[1]?.match(/^X \((m|px)\)$/);
 if(header?.[0]!=='Time (s)'||!match||header[2]!==`Y (${match[1]})`)return null;
 const unit=match[1];
 const columns=[{key:'time',label:'Time (s)',unit:'s'}, {key:'x',label:`X (${unit})`,unit}, {key:'y',label:`Y (${unit})`,unit}, {key:'vx',label:`Vx (${unit}/s)`,unit:`${unit}/s`}, {key:'vy',label:`Vy (${unit}/s)`,unit:`${unit}/s`}];
 const expected=['Time (s)',`X (${unit})`,`Y (${unit})`,`±ΔX (${unit})`,`±ΔY (${unit})`,'±Δt (s)',`Vx (${unit}/s)`,`Vy (${unit}/s)`,`±ΔVx (${unit}/s)`,`±ΔVy (${unit}/s)`];
 let data;
 if(JSON.stringify(header)===JSON.stringify(expected)){
  data=records.slice(1).map(row=>{
   if(row.length!==10||!row.slice(0,3).every(finite)||!row.slice(3).every(v=>v===''||finite(v))||[3,4,5,8,9].some(i=>row[i]!==''&&Number(row[i])<0))throw Error('values');
   return {time:row[0],x:row[1],y:row[2],xError:row[3],yError:row[4],timeError:row[5],vx:row[6],vy:row[7],vxError:row[8],vyError:row[9]};
  });
 }else if(header.length===4&&header[3]===`Uncertainty (${unit})`){
  const split=records.findIndex(row=>row[0]==='Velocity Data (Central Difference)');
  const positions=split<0?records.slice(1):records.slice(1,split);
  data=positions.map(row=>{if(row.length!==4||!row.every(finite)||Number(row[3])<0)throw Error('values');return {time:row[0],x:row[1],y:row[2],xError:row[3],yError:row[3],timeError:'',vx:'',vy:'',vxError:'',vyError:''};});
  if(split>=0){
   if(JSON.stringify(records[split])!==JSON.stringify(['Velocity Data (Central Difference)','Time (s)',`Vx (${unit}/s)`,`Vy (${unit}/s)`]))throw Error('columns');
   const byTime=new Map(data.map(row=>[Number(row.time),row]));
   for(const row of records.slice(split+1)){
    if(row.length!==4||row[0]!==''||!row.slice(1).every(finite))throw Error('values');
    const point=byTime.get(Number(row[1]));if(!point||point.vx!=='')throw Error('time');
    point.vx=row[2];point.vy=row[3];
   }
  }
 }else throw Error('columns');
 if(!data.length||data.length>MAX_ROWS)throw Error('size');
 return {columns:columns.filter(c=>data.some(row=>row[c.key]!=='')),data};
}
export function selectVideoColumns(source,xKey='time',yKey='x'){
 const x=source.columns.find(c=>c.key===xKey),y=source.columns.find(c=>c.key===yKey);
 if(!x||!y)throw Error('columns');
 const valid=source.data.filter(row=>row[xKey]!==''&&row[yKey]!=='');
 if(!valid.length)throw Error('empty');
 return {rows:valid.map(row=>({x:row[xKey],y:row[yKey],xError:row[`${xKey}Error`]??'',error:row[`${yKey}Error`]??'',note:`Video CSV: ${x.label}; ${y.label}`})),
  headers:[x.label,y.label],skipped:source.data.length-valid.length};
}
