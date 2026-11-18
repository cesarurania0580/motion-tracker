// Read-only adapters: source arrays remain owned by App. No store imports here.
export function accelerationRows(velocity) {
  const rows=velocity.filter(row=>Number.isFinite(row.time)).slice().sort((a,b)=>a.time-b.time);
  if(rows.length<3 || rows.some((row,i)=>i>0&&row.time===rows[i-1].time))return [];
  return rows.map((row,i)=>{
    const start=Math.max(0,Math.min(i-1,rows.length-3)),triple=rows.slice(start,start+3);
    const derivative=key=>{
      if(!triple.every(point=>Number.isFinite(point[key])))return null;
      // Derivative of the quadratic interpolant; center times for numerical stability.
      const t=triple.map(point=>point.time-row.time);
      return triple.reduce((sum,point,j)=>{
        const k=(j+1)%3,l=(j+2)%3;
        return sum-point[key]*(t[k]+t[l])/((t[j]-t[k])*(t[j]-t[l]));
      },0);
    };
    return {time:row.time,ax:derivative('vx'),ay:derivative('vy')};
  });
}

export function motionRows(position,velocity,plotX,plotY,start='',end='') {
  const speeds=new Map(velocity.map(row=>[row.time,row]));
  const accelerations=new Map(accelerationRows(velocity).map(row=>[row.time,row]));
  const lower=start===''?-Infinity:Number(start),upper=end===''?Infinity:Number(end);
  if(Number.isNaN(lower)||Number.isNaN(upper)||lower>upper)return [];
  return position.filter(row=>row.time>=lower&&row.time<=upper).map(row=>{
    const speed=speeds.get(row.time),acceleration=accelerations.get(row.time);
    const value=key=>['vx','vy'].includes(key)?speed?.[key]:['ax','ay'].includes(key)?acceleration?.[key]:row[key];
    const error=key=>{const source=['vx','vy'].includes(key)?speed:row;const value=source?.[key==='time'?'timeError':`${key}Error`]??(['x','y'].includes(key)?row.error:null);return Number.isFinite(value)&&value>=0?value:null;};
    return {x:value(plotX),y:value(plotY),xError:error(plotX),error:error(plotY),time:row.time,sourceIndex:row.sourceIndex};
  }).filter(row=>Number.isFinite(row.x)&&Number.isFinite(row.y));
}

export function spectrumRows(rows,channel) {
  const key={luma:'intensity',red:'r',green:'g',blue:'b'}[channel];
  // Intensity may have been sampled with a single channel; luma always comes from RGB.
  return rows.map(row=>({x:row.xVal,y:channel==='luma'?.299*row.r+.587*row.g+.114*row.b:row[key],
    xError:null,error:null})).filter(row=>Number.isFinite(row.x)&&Number.isFinite(row.y));
}

export function plottedCSV(rows,labels) {
  const quote=value=>{const text=String(value);return '"'+(/^[=+@-]/.test(text)?"'":'')+text.replaceAll('"','""')+'"';};
  return [[labels.x,labels.y,`± ${labels.x}`,`± ${labels.y}`].map(quote).join(','),
    ...rows.map(row=>[row.x,row.y,row.xError??'',row.error??''].join(','))].join('\n');
}
