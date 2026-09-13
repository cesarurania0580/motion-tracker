const TAU = 2 * Math.PI;

// Variable projection: solve amplitude, phase and offset linearly at each
// frequency, leaving only a bounded one-dimensional frequency search.
export function fitSinusoidal(x, y) {
  const sorted = [...new Set(x)].sort((a,b)=>a-b);
  if (sorted.length < 6) return null;
  const origin = sorted[0], span = sorted.at(-1)-origin;
  const yOrigin = y.reduce((a,b)=>a+b,0)/y.length;
  const scale = Math.max(...y)-Math.min(...y);
  if (!(span > 0) || !(scale > 0)) return null;
  const u = x.map(v=>(v-origin)/span), z=y.map(v=>(v-yOrigin)/scale);
  const gaps=sorted.slice(1).map((v,i)=>v-sorted[i]).sort((a,b)=>a-b);
  const median=gaps[Math.floor(gaps.length/2)];
  const lower=.1, upper=Math.min(128,(sorted.length-1)/2,span/(2*median));
  if (!(upper > lower)) return null;

  function evaluate(cycles) {
    const s=u.map(v=>Math.sin(TAU*cycles*v));
    const c=u.map(v=>Math.cos(TAU*cycles*v));
    const ms=s.reduce((a,b)=>a+b,0)/s.length, mc=c.reduce((a,b)=>a+b,0)/c.length;
    let ss=0,cc=0,sc=0,sy=0,cy=0;
    for(let i=0;i<u.length;i++) {
      const ds=s[i]-ms, dc=c[i]-mc;
      ss+=ds*ds; cc+=dc*dc; sc+=ds*dc; sy+=ds*z[i]; cy+=dc*z[i];
    }
    const det=ss*cc-sc*sc;
    if (!(det > 1e-12*ss*cc)) return {cycles,error:Infinity};
    const p=(sy*cc-cy*sc)/det, q=(cy*ss-sy*sc)/det, d=-p*ms-q*mc;
    let error=0;
    for(let i=0;i<u.length;i++) error+=(z[i]-p*s[i]-q*c[i]-d)**2;
    return {cycles,error,p,q,d};
  }

  const count=Math.ceil((upper-lower)*16), step=(upper-lower)/count;
  const grid=Array.from({length:count+1},(_,i)=>evaluate(lower+i*step));
  const minima=grid.filter((v,i)=>v.error <= (grid[i-1]?.error ?? Infinity) && v.error <= (grid[i+1]?.error ?? Infinity));
  // Refine several basins: a single starting frequency can settle at a local minimum.
  const refined=minima.sort((a,b)=>a.error-b.error).slice(0,8).map(seed=>{
    let a=Math.max(lower,seed.cycles-step),b=Math.min(upper,seed.cycles+step);
    const ratio=(Math.sqrt(5)-1)/2;
    let left=evaluate(b-ratio*(b-a)),right=evaluate(a+ratio*(b-a));
    for(let i=0;i<48;i++) {
      if(left.error<right.error){b=right.cycles;right=left;left=evaluate(b-ratio*(b-a));}
      else {a=left.cycles;left=right;right=evaluate(a+ratio*(b-a));}
    }
    return [seed,left,right].sort((a,b)=>a.error-b.error)[0];
  }).sort((a,b)=>a.error-b.error);
  const best=refined[0];
  if (!best || !Number.isFinite(best.error)) return null;
  const {p,q,d,cycles}=best;
  const A=scale*Math.hypot(p,q), B=TAU*cycles/span, phase=Math.atan2(q,p), D=yOrigin+scale*d;
  const C=Math.atan2(Math.sin(phase-B*origin),Math.cos(phase-B*origin));
  const ssTot=z.reduce((a,b)=>a+b*b,0);
  const ambiguous=refined.some(v=>Math.abs(v.cycles-cycles)>.25 && v.error-best.error <= Math.max(ssTot*1e-8,best.error*.01));
  const warning=cycles<1 || cycles-lower<step*.01 || upper-cycles<step*.01 || ambiguous ? 'fitUncertain' : null;
  return {
    params:{A,B,C,D}, warning,
    // Centered evaluation avoids loss of phase precision at large time origins.
    fn:value=>yOrigin+scale*(p*Math.sin(TAU*cycles*((value-origin)/span))+q*Math.cos(TAU*cycles*((value-origin)/span))+d)
  };
}
