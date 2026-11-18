// Presentation only: original strings remain the source of editing, copy and export.
export function numberParts(value){
 const text=String(value??'');const match=text.match(/^([+-]?\d*)(\.?)(\d*)((?:[eE][+-]?\d+)?)$/);
 if(!text||!match||!/[0-9]/.test(match[1]+match[3]))return null;
 return {integer:match[1],point:match[2],fraction:match[3],exponent:match[4]};
}
export function numberColumns(rows,columns){
 return columns.map((_,i)=>{
  const parts=rows.map(row=>numberParts(row[i])).filter(Boolean);
  const integer=Math.max(1,...parts.map(p=>p.integer.length)),fraction=Math.max(0,...parts.map(p=>p.fraction.length)),exponent=Math.max(0,...parts.map(p=>p.exponent.length));
  const point=parts.some(p=>p.point)?1:0;
  return {fraction,exponent,point,width:Math.max(105,(integer+fraction+exponent+point+1)*8+12)};
 });
}
