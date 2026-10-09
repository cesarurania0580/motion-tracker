const dimensions={time:[0,1],x:[1,0],y:[1,0],vx:[1,-1],vy:[1,-1]};

function units([distance,time],calibrated) {
  const numerator=[],denominator=[];
  for(const [name,power] of [[calibrated?'m':'px',distance],['s',time]]) {
    if(!power)continue;
    const magnitude=Math.abs(power);
    const term=name+(magnitude===1?'':magnitude===2?'²':magnitude===3?'³':`^${magnitude}`);
    (power>0?numerator:denominator).push(term);
  }
  if(!numerator.length && !denominator.length)return '';
  return (numerator.join('·') || '1')+(denominator.length?`/${denominator.length>1?'(':''}${denominator.join('·')}${denominator.length>1?')':''}`:'');
}

export const axisUnit=(key,calibrated)=>units(dimensions[key],calibrated);

export function parameterUnits(model,plotX,plotY,calibrated) {
  const x=dimensions[plotX], y=dimensions[plotY];
  const ratio=power=>units(y.map((value,i)=>value-power*x[i]),calibrated);
  if(model==='Linear')return {m:ratio(1),b:ratio(0)};
  if(model==='Quadratic')return {A:ratio(2),B:ratio(1),C:ratio(0)};
  const inverse=units(x.map(value=>-value),calibrated);
  return {A:ratio(0),B:inverse.startsWith('1/')?`rad${inverse.slice(1)}`:`rad${inverse?'·'+inverse:''}`,C:'rad',D:ratio(0)};
}

export function formatCoordinate(value) {
  if(!Number.isFinite(value))return '—';
  if(value===0)return '0';
  if(Math.abs(value)<.001 || Math.abs(value)>=1e6)return value.toExponential(3);
  return String(Number(value.toFixed(3)));
}

export function plottedCoordinates(payload,plotX,plotY) {
  const row=(payload || []).map(entry=>entry.payload).find(point=>point && !point.isVirtual &&
    Number.isFinite(point[plotX]) && Number.isFinite(point[plotY]));
  return row?[...new Set([plotX,plotY])].map(key=>({key,value:row[key]})):[];
}

export function interpretationKey(model,plotX,plotY) {
  if(plotX==='time') {
    if(['x','y'].includes(plotY) && model==='Linear')return 'positionLinear';
    if(['x','y'].includes(plotY) && model==='Quadratic')return 'positionQuadratic';
    if(['vx','vy'].includes(plotY) && model==='Linear')return 'velocityLinear';
  }
  return model==='Linear'?'linearHelp':model==='Quadratic'?'quadraticHelp':'sinusoidalHelp';
}
