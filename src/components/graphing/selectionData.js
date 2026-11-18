export function selectedRectangle(selection,displayColumns,rowCount){
 if(!selection||!rowCount)return null;
 const a=displayColumns.indexOf(selection.anchor.col),b=displayColumns.indexOf(selection.focus.col);
 if(a<0||b<0)return null;
 return {top:Math.max(0,Math.min(selection.anchor.row,selection.focus.row)),bottom:Math.min(rowCount-1,Math.max(selection.anchor.row,selection.focus.row)),columns:displayColumns.slice(Math.min(a,b),Math.max(a,b)+1)};
}
export function selectedTSV(rows,displayColumns,selection){
 const area=selectedRectangle(selection,displayColumns,rows.length);if(!area)return '';
 return rows.slice(area.top,area.bottom+1).map(row=>area.columns.map(i=>String(row[i]??'')).join('\t')).join('\n');
}
export async function copyTableText(text){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}}catch{/* HTTP/iPad fallback below. */}
 const previous=document.activeElement,area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;top:0;left:-9999px';document.body.append(area);
 try{area.focus();area.select();area.setSelectionRange(0,area.value.length);if(!document.execCommand('copy'))throw Error('clipboard');}finally{area.remove();previous?.focus();}
}
