// Copy values, never references to mutable tracker rows. Full active-object dataset.
export function advancedTransfer(position=[],velocity=[],{scaled=false,x='time',y='x',title=''}={}){
 const unit=scaled?'m':'px',keys=['time','x','y','xError','yError','timeError','vx','vy','vxError','vyError'];
 const labels=['Time (s)',`X (${unit})`,`Y (${unit})`,`±ΔX (${unit})`,`±ΔY (${unit})`,'±Δt (s)',`Vx (${unit}/s)`,`Vy (${unit}/s)`,`±ΔVx (${unit}/s)`,`±ΔVy (${unit}/s)`];
 const columns=labels.map((label,i)=>({label,...([3,4,5,8,9].includes(i)?{uncertainty:true}:{errorIndex:{0:5,1:3,2:4,6:8,7:9}[i]})}));
 const speeds=new Map(velocity.filter(r=>!r.isVirtual).map(r=>[r.time,r]));
 const rows=position.filter(r=>!r.isVirtual&&Number.isFinite(r.time)).map(row=>{
  const v=speeds.get(row.time)||{};return keys.map(key=>{const value=key.startsWith('v')?v[key]:row[key];return Number.isFinite(value)?String(value):'';});
 });
 const axes=[keys.indexOf(x),keys.indexOf(y)].map((index,i)=>index<0?(i===0?0:1):index);
 const names=axes.map(i=>labels[i].replace(/\s*\([^()]*\)$/,''));
 return {table:{columns,rows},axes,meta:{title,xName:names[0],yName:names[1],xUnit:axes[0]===0?'s':axes[0]>=6?`${unit}/s`:unit,yUnit:axes[1]===0?'s':axes[1]>=6?`${unit}/s`:unit}};
}
