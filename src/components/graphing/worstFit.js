// Geometric bounds, not a statistical confidence interval. No measurement mutation.
export function uncertaintyRows(rows,xOverride='',yOverride='') {
  const parse=value=>value===''?null:Number(value);
  const dx=parse(xOverride),dy=parse(yOverride);
  if((dx!==null&&(!Number.isFinite(dx)||dx<0))||(dy!==null&&(!Number.isFinite(dy)||dy<0)))return null;
  return rows.map(row=>({...row,xError:dx??row.xError??0,error:dy??row.error}));
}

export function worstFit(rows,best) {
  if(!rows || rows.length<2 || !best || !Number.isFinite(best.m)||!Number.isFinite(best.b))return {status:'missing'};
  if(!rows.every(p=>[p.x,p.y,p.xError,p.error].every(Number.isFinite)&&p.xError>=0&&p.error>=0))return {status:'missing'};
  if(!rows.some(p=>p.xError>0||p.error>0))return {status:'missing'};
  // Translate to reduce cancellation in intercept constraints at large coordinates.
  const ox=rows[0].x,oy=rows[0].y;
  const points=rows.map(p=>({...p,x:p.x-ox,y:p.y-oy}));
  const intervals=[];
  for(const sign of [-1,1]) {
    let lo=sign===1?0:-Infinity,hi=sign===1?Infinity:0,possible=true;
    // For fixed sign(m), every lower intercept bound must be <= every upper.
    // This yields linear half-space constraints a*m <= c.
    for(let i=0;i<points.length&&possible;i++)for(let j=0;j<points.length;j++) {
      const p=points[i],q=points[j];
      const a=q.x-p.x-sign*(p.xError+q.xError),c=q.y-p.y+p.error+q.error;
      if(a>0)hi=Math.min(hi,c/a);
      else if(a<0)lo=Math.max(lo,c/a);
      else if(c<0){possible=false;break;}
      if(lo>hi){
        const tolerance=32*Number.EPSILON*Math.max(Math.abs(lo),Math.abs(hi),Number.MIN_VALUE);
        if(lo-hi>tolerance){possible=false;break;}
        lo=hi=(lo+hi)/2;
      }
    }
    if(possible)intervals.push([lo,hi]);
  }
  if(!intervals.length)return {status:'infeasible'};
  const minimum=Math.min(...intervals.map(i=>i[0])),maximum=Math.max(...intervals.map(i=>i[1]));
  if(!Number.isFinite(minimum)||!Number.isFinite(maximum))return {status:'unbounded'};
  const line=m=>{
    let lo=-Infinity,hi=Infinity;
    for(const p of points){
      lo=Math.max(lo,p.y-p.error-m*p.x-Math.abs(m)*p.xError);
      hi=Math.min(hi,p.y+p.error-m*p.x+Math.abs(m)*p.xError);
    }
    const centered=(lo+hi)/2;
    return {m,b:oy+centered-m*ox,fn:x=>oy+centered+m*(x-ox)};
  };
  // b bounds are envelopes over ALL admissible slopes, not just the two
  // extreme-gradient lines. Each sign branch is convex (lower) / concave (upper).
  const envelope=(m,upper)=>{
    let result=upper?Infinity:-Infinity;
    for(const p of rows){const value=p.y-m*p.x+(upper?1:-1)*(p.error+Math.abs(m)*p.xError);
      result=upper?Math.min(result,value):Math.max(result,value);}
    return result;
  };
  const extreme=(interval,upper)=>{
    let [lo,hi]=interval;
    for(let i=0;i<100;i++){
      const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;
      if(a===lo||b===hi)break;
      if((upper?-1:1)*envelope(a,upper)<(upper?-1:1)*envelope(b,upper))hi=b;else lo=a;
    }
    const values=[envelope(interval[0],upper),envelope(interval[1],upper),envelope((lo+hi)/2,upper)];
    return upper?Math.max(...values):Math.min(...values);
  };
  const interceptMin=Math.min(...intervals.map(interval=>extreme(interval,false)));
  const interceptMax=Math.max(...intervals.map(interval=>extreme(interval,true)));
  const intercept={min:interceptMin,max:interceptMax,delta:Math.max(Math.abs(interceptMin-best.b),Math.abs(interceptMax-best.b))};
  const min=line(minimum),max=line(maximum);
  const delta=Math.max(Math.abs(min.m-best.m),Math.abs(max.m-best.m));
  const bestAcceptable=rows.every(p=>Math.abs(best.m*p.x+best.b-p.y)<=p.error+Math.abs(best.m)*p.xError+64*Number.EPSILON*Math.max(1,Math.abs(best.m*p.x),Math.abs(best.b),Math.abs(p.y)));
  return {status:'ok',min,max,delta,intercept,worst:Math.abs(min.m-best.m)>=Math.abs(max.m-best.m)?'min':'max',
    percent:best.m===0?null:100*delta/Math.abs(best.m),bestAcceptable};
}
