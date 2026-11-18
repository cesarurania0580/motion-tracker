export const emptyBudget=()=>({length:'',endpoint:'',time:''});
export function cleanBudget(value){
  return Object.fromEntries(Object.keys(emptyBudget()).map(key=>{
    const raw=value?.[key];
    return [key,typeof raw==='string'&&raw.length<=64&&(raw===''||(Number.isFinite(Number(raw))&&Number(raw)>=0))?raw:''];
  }));
}
export const optionalBound=value=>value===''||value==null||!Number.isFinite(Number(value))||Number(value)<0?null:Number(value);
export function scaleBudget(ppm,points,budget){
  if(!(ppm>0))return {relative:0,complete:true};
  const d=points?.length===2?Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y):0;
  const length=optionalBound(budget?.length),endpoint=optionalBound(budget?.endpoint);
  if(!(d>0))return {relative:0,complete:false};
  return {relative:(length??0)/(d/ppm)+2*(endpoint??0)/d,complete:length!==null&&endpoint!==null};
}
export function positionBounds(x,y,pixelBound,ppm,scale){
  const local=pixelBound/(ppm>0?ppm:1);
  return {xError:local+Math.abs(x)*scale.relative,yError:local+Math.abs(y)*scale.relative};
}
// Conservative first-order propagation through the EXISTING velocity stencil.
// Common scale error enters once. Timestamp bounds apply to the denominator;
// irregular endpoint spacing violates the one-sided stencil's uniform-grid premise.
export function velocityBounds(points,index,vx,vy,pixelBound,ppm,scale,timeBound){
  const dtError=optionalBound(timeBound),n=points.length-1;
  if(dtError===null||n<2||!scale.complete)return {vxError:null,vyError:null};
  const edge=index===0||index===n;
  const dt=edge?(index===0?points[1].time-points[0].time:points[n].time-points[n-1].time):points[index+1].time-points[index-1].time;
  if(!(dt>2*dtError)||!(dt>0))return {vxError:null,vyError:null};
  if(edge){const other=index===0?points[2].time-points[1].time:points[n-1].time-points[n-2].time;
    if(Math.abs(other-dt)>1e-6*Math.max(dt,other))return {vxError:null,vyError:null};}
  const local=pixelBound/(ppm>0?ppm:1)*(edge?4:2)/dt;
  const relative=scale.relative+2*dtError/dt;
  return {vxError:local+Math.abs(vx)*relative,vyError:local+Math.abs(vy)*relative};
}
export function formatMeasurement(value,error){
  if(!Number.isFinite(value))return '—';
  if(!Number.isFinite(error)||error<0)return Number(value.toPrecision(6)).toString();
  if(error===0)return `${Number(value.toPrecision(6))} ± 0`;
  let exponent=Math.floor(Math.log10(error));
  const digits=error/10**exponent<2?2:1;
  let place=exponent-digits+1;
  const rounded=Math.round(error/10**place)*10**place;
  // Carry across a power of ten without retaining misleading decimal places.
  if(Math.floor(Math.log10(rounded))>exponent)place++;
  if(place<-6||place>5){
    exponent=Math.floor(Math.log10(Math.max(Math.abs(value),error)));
    const decimals=Math.max(0,Math.min(12,exponent-place));
    return `(${(value/10**exponent).toFixed(decimals)} ± ${(error/10**exponent).toFixed(decimals)}) × 10^${exponent}`;
  }
  const decimals=Math.max(0,-place),step=10**place;
  return `${(Math.round(value/step)*step).toFixed(decimals)} ± ${(Math.round(error/step)*step).toFixed(decimals)}`;
}
