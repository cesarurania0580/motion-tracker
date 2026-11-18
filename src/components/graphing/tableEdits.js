import {MAX_ROWS} from './graphDocument.js';
import {numeric} from './prototype/minimalData.js';
import {selectedRectangle} from './selectionData.js';
export function pasteCells(rows,columns,display,selection,records){
 const area=selectedRectangle(selection,display,rows.length);if(!area)throw Error('selection');
 const block=records.map(row=>row.map(value=>String(value).trim())),width=block[0]?.length;
 if(!width||block.some(row=>row.length!==width))throw Error('shape');
 const scalar=block.length===1&&width===1;
 const targets=scalar?area.columns:display.slice(display.indexOf(area.columns[0]),display.indexOf(area.columns[0])+width);
 const count=scalar?area.bottom-area.top+1:block.length;
 if((targets.length!==width&&!scalar)||area.top+count>MAX_ROWS)throw Error('size');
 const updates=[];
 for(let r=0;r<count;r++)for(let c=0;c<targets.length;c++){
  const value=scalar?block[0][0]:block[r][c];
  if(value!==''&&(!numeric(value)||(columns[targets[c]].uncertainty&&Number(value)<0)))throw Error('value');
  updates.push([area.top+r,targets[c],value]);
 }
 const result=rows.map(row=>[...row]);while(result.length<area.top+count)result.push(columns.map(()=>''));
 for(const [r,c,v] of updates)result[r][c]=v;
 return result;
}
