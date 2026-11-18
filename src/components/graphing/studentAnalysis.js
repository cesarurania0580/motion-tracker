export const TRANSFORMS=['identity','square','reciprocal','sqrt','ln'];
export function transformValue(value,error,operation){
 if(!TRANSFORMS.includes(operation))throw Error('operation');
 const apply=x=>operation==='square'?x*x:operation==='reciprocal'?1/x:operation==='sqrt'?Math.sqrt(x):operation==='ln'?Math.log(x):x;
 const valid=x=>Number.isFinite(x)&&(operation!=='reciprocal'||x!==0)&&(operation!=='sqrt'||x>=0)&&(operation!=='ln'||x>0);
 if(!valid(value))throw Error('domain');
 const result=apply(value);
 if(!Number.isFinite(result))throw Error('domain');
 if(error==null)return {value:result,error:null};
 if(!Number.isFinite(error)||error<0)throw Error('uncertainty');
 const lo=value-error,hi=value+error;
 if(!valid(lo)||!valid(hi)||(operation==='reciprocal'&&lo<=0&&hi>=0))throw Error('domain');
 const ends=[apply(lo),apply(hi)];if(operation==='square'&&lo<=0&&hi>=0)ends.push(0);
 const bound=Math.max(...ends.map(x=>Math.abs(x-result)));
 if(!Number.isFinite(bound))throw Error('domain');
 return {value:result,error:bound};
}
export function transformRows(rows,operations){
 const output=[];let invalid=0;
 for(const row of rows){try{const x=transformValue(row.x,row.xError,operations.x),y=transformValue(row.y,row.error,operations.y);output.push({...row,x:x.value,y:y.value,xError:x.error,error:y.error});}catch{invalid++;}}
 return {rows:output,invalid};
}
export function transformedLabel(label,operation){return operation==='identity'?label:operation==='square'?`(${label})²`:operation==='reciprocal'?`1/(${label})`:operation==='sqrt'?`√(${label})`:`ln(${label})`;}
export function repeatedMeasurement(values,instrument){
 if(!Array.isArray(values)||values.length<2||!values.every(Number.isFinite)||!Number.isFinite(instrument)||instrument<0)throw Error('repeats');
 const mean=values.reduce((a,b)=>a+b/values.length,0),halfRange=(Math.max(...values)-Math.min(...values))/2;
 if(!Number.isFinite(mean)||!Number.isFinite(halfRange))throw Error('repeats');
 return {mean,halfRange,error:Math.max(halfRange,instrument),values:[...values],instrument};
}
