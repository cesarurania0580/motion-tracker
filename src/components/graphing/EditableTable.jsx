import {useEffect,useMemo,useRef,useState} from 'react';
import {parseDelimitedRecords,MAX_ROWS} from './graphDocument.js';
import {selectedRectangle,selectedTSV,copyTableText} from './selectionData.js';
import {numberParts,numberColumns} from './numberAlignment.js';
import {pasteCells} from './tableEdits.js';
import {fillUncertainty} from './prototype/minimalData.js';

export function FillDialog({language,title,allowColumn,onApply,onClose}){
 const es=language==='es',say=(en,sp)=>es?sp:en;
 const [value,setValue]=useState(''),[scope,setScope]=useState(allowColumn?'column':'selection'),[error,setError]=useState(false);
 const dialog=useRef(null),input=useRef(null);
 useEffect(()=>{const before=document.activeElement;input.current?.focus();return ()=>before?.focus();},[]);
 return <div className="minimal-modal-backdrop" onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();onClose();}
  if(event.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('input,select,button')],first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 }}><form ref={dialog} className="minimal-fill-dialog" role="dialog" aria-modal="true" aria-labelledby="minimal-fill-title" onSubmit={event=>{event.preventDefault();try{onApply(value,scope);onClose();}catch{setError(true);}}}>
  <h2 id="minimal-fill-title">{title}</h2>
  {allowColumn&&<label>{say('Apply to','Aplicar a')}<select value={scope} onChange={event=>setScope(event.target.value)}><option value="column">{say('Whole column','Toda la columna')}</option><option value="selection">{say('Selected rows','Filas seleccionadas')}</option></select></label>}
  <label>{say('Value (absolute, not %)','Valor (absoluto, no %)')}<input ref={input} inputMode="decimal" value={value} onChange={event=>{setValue(event.target.value);setError(false);}} aria-invalid={error}/></label>
  <p>{say('Replaces values in the chosen cells. You can undo this change.','Reemplaza los valores de las celdas elegidas. Puedes deshacer este cambio.')}</p>
  {error&&<p role="alert">{say('Enter a finite number. Uncertainties must be ≥ 0.','Introduce un número finito. Las incertidumbres deben ser ≥ 0.')}</p>}
  <div><button type="button" onClick={onClose}>{say('Cancel','Cancelar')}</button><button type="submit" disabled={!value.trim()}>{say('Apply','Aplicar')}</button></div>
 </form></div>;
}

export default function EditableTable({rows,columns,display,language,onChange,onImport}){
 const say=(en,es)=>language==='es'?es:en;
 const [selection,setSelection]=useState(null),[editing,setEditing]=useState(null),[draft,setDraft]=useState(''),[message,setMessage]=useState(''),[dialog,setDialog]=useState(null),[history,setHistory]=useState([]);
 const table=useRef(null),drag=useRef(false),skipBlur=useRef(false);
 const metrics=useMemo(()=>numberColumns(rows,columns),[rows,columns]);
 const area=selectedRectangle(selection,display,rows.length);
 const visibleKey=display.join(',');
 useEffect(()=>{setSelection(null);setEditing(null);},[visibleKey]);
 useEffect(()=>{if(editing){const input=table.current?.querySelector(`[data-row="${editing.row}"][data-col="${editing.col}"]`);input?.focus();if(editing.select)input?.select();else input?.setSelectionRange(input.value.length,input.value.length);}},[editing]);
 function commit(next){setHistory(previous=>[...previous.slice(-39),rows.map(row=>[...row])]);onChange(next);setMessage('');}
 function undo(){if(!history.length)return;onChange(history.at(-1));setHistory(previous=>previous.slice(0,-1));setEditing(null);setMessage('');}
 function apply(records,target=selection){try{commit(pasteCells(rows,columns,display,target,records));return true;}catch{setMessage(say('Nothing changed. Check the paste size and numbers; uncertainties must be ≥ 0.','No se cambió nada. Revisa el tamaño y los números; las incertidumbres deben ser ≥ 0.'));return false;}}
 function finishEdit(){if(!editing)return true;const ok=apply([[draft]],{anchor:editing,focus:editing});if(ok)setEditing(null);return ok;}
 function startEdit(cell,value){setSelection({anchor:cell,focus:cell});setEditing({...cell,select:value===undefined});setDraft(value??rows[cell.row][cell.col]);}
 function begin(event,row,col){if(editing?.row===row&&editing?.col===col)return;if(editing){if(!finishEdit())return;skipBlur.current=true;}event.preventDefault();table.current.focus();drag.current=true;table.current.setPointerCapture?.(event.pointerId);const cell={row,col};setSelection(previous=>({anchor:event.shiftKey&&previous?previous.anchor:cell,focus:cell}));}
 function move(event){if(!drag.current)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-row]');if(cell&&table.current.contains(cell))setSelection(previous=>previous?{...previous,focus:{row:Number(cell.dataset.row),col:Number(cell.dataset.col)}}:previous);}
 function key(event){
  if(editing){if(event.key==='Escape'){event.preventDefault();skipBlur.current=true;setEditing(null);table.current.focus();}else if(event.key==='Enter'||event.key==='Tab'){event.preventDefault();if(finishEdit()){skipBlur.current=true;table.current.focus();}}return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a'){event.preventDefault();if(display.length&&rows.length)setSelection({anchor:{row:0,col:display[0]},focus:{row:rows.length-1,col:display.at(-1)}});return;}
  if(!selection)return;
  if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();apply([['']]);return;}
  if(event.key==='Enter'||event.key==='F2'){event.preventDefault();startEdit(selection.focus);return;}
  if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key.length===1&&/[0-9.+-]/.test(event.key)){event.preventDefault();startEdit(selection.focus,event.key);return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'].includes(event.key))return;
  event.preventDefault();const index=display.indexOf(selection.focus.col),focus={row:Math.max(0,Math.min(rows.length-1,selection.focus.row+(event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0))),col:display[Math.max(0,Math.min(display.length-1,index+(event.key==='ArrowRight'||event.key==='Tab'&&!event.shiftKey?1:event.key==='ArrowLeft'||event.key==='Tab'&&event.shiftKey?-1:0)))]};
  setSelection({anchor:event.shiftKey&&event.key!=='Tab'?selection.anchor:focus,focus});table.current?.querySelector(`[data-row="${focus.row}"][data-col="${focus.col}"]`)?.scrollIntoView?.({block:'nearest',inline:'nearest'});
 }
 function paste(event){
  event.preventDefault();if(!selection)return;
  try{const plain=event.clipboardData.getData('text/plain'),html=event.clipboardData.getData('text/html');if(plain.length+html.length>1000000)throw Error();let records;
   if(html){const parsed=new DOMParser().parseFromString(html,'text/html').querySelector('table');if(parsed)records=[...parsed.rows].map(row=>[...row.cells].map(c=>c.textContent));}
   if(!records){const text=plain.replace(/\r\n?/g,'\n').replace(/\n+$/,'');records=text.includes('\t')?text.split('\n').map(row=>row.split('\t')):text===''?[['']]:parseDelimitedRecords(text);}
   // A header-bearing table pasted at the first cell is an explicit whole-sheet import.
   if(selection.anchor.row===0&&selection.anchor.col===display[0]&&records[0]?.length>=2&&(records[0].slice(0,2).every(v=>v.trim()&&!Number.isFinite(Number(v)))||(records[0].length>display.length&&rows.every(row=>row.every(v=>v===''))))){onImport(records);setHistory([]);setEditing(null);return;}
   if(apply(records)){skipBlur.current=!!editing;setEditing(null);table.current?.focus();}
  }catch{setMessage(say('Could not paste this table. No cells changed.','No se pudo pegar esta tabla. No se cambió ninguna celda.'));}
 }
 async function copy(){try{await copyTableText(selectedTSV(rows,display,selection));setMessage(say('Cells copied.','Celdas copiadas.'));}catch{setMessage(say('Use Ctrl/Cmd+C to copy the selection.','Usa Ctrl/Cmd+C para copiar la selección.'));}}
 return <>
 <div inert={dialog?true:undefined}>
 <div className="minimal-selection-tools"><button disabled={!area||area.top!==area.bottom||area.columns.length!==1} onClick={()=>startEdit(selection.focus)}>{say('Edit cell','Editar celda')}</button><button disabled={!area} onClick={copy}>{say('Copy','Copiar')}</button><button disabled={!area} onClick={()=>setDialog({index:null})}>{say('Fill selection…','Rellenar selección…')}</button><button disabled={!area} onClick={()=>apply([['']])}>{say('Clear cells','Vaciar celdas')}</button><button disabled={!history.length} onClick={undo}>{say('Undo','Deshacer')}</button></div>
 <div className="minimal-table spreadsheet-table" tabIndex={0} ref={table} aria-label={say('Data table. Click to select; double-click or Enter to edit.','Tabla de datos. Clic para seleccionar; doble clic o Enter para editar.')} onKeyDown={key} onPointerMove={move} onPointerUp={()=>{drag.current=false;}} onPointerCancel={()=>{drag.current=false;}} onPaste={paste} onCopy={event=>{if(area&&!editing){event.preventDefault();event.clipboardData.setData('text/plain',selectedTSV(rows,display,selection));}}}>
 <table style={{minWidth:Math.max(300,display.reduce((sum,col)=>sum+metrics[col].width,26))}}><colgroup><col style={{width:26}}/>{display.map(col=><col key={col} style={{width:metrics[col].width}}/>)}</colgroup><thead><tr><th>#</th>{display.map(col=><th key={col}>{columns[col].label}{columns[col].uncertainty&&<button className="minimal-fill" onClick={()=>setDialog({index:col})}>{say('Fill all…','Rellenar…')}</button>}</th>)}</tr></thead><tbody>{rows.map((row,r)=><tr key={r}><th>{r+1}</th>{display.map(col=>{const active=editing?.row===r&&editing?.col===col,parts=numberParts(row[col]),metric=metrics[col];return <td key={col} className={area&&r>=area.top&&r<=area.bottom&&area.columns.includes(col)?'minimal-selected':undefined}><input className={!active&&parts?'decimal-input':undefined} data-row={r} data-col={col} aria-label={`${columns[col].label} ${r+1}`} inputMode="decimal" readOnly={!active} value={active?draft:row[col]} onPointerDown={event=>begin(event,r,col)} onDoubleClick={()=>startEdit({row:r,col})} onChange={event=>setDraft(event.target.value)} onBlur={()=>{if(skipBlur.current){skipBlur.current=false;return;}if(active)finishEdit();}}/>{!active&&parts&&<span aria-hidden="true" className="decimal-display" style={{gridTemplateColumns:`minmax(0,1fr) ${metric.point?'.4ch':'0px'} ${metric.fraction}ch ${metric.exponent?metric.exponent+.4:0}ch`}}><span className="decimal-integer">{parts.integer}</span><span>{parts.point}</span><span>{parts.fraction}</span><span className="decimal-exponent">{parts.exponent}</span></span>}</td>;})}</tr>)}</tbody></table>
 </div>
 <div className="minimal-table-footer"><button disabled={rows.length>=MAX_ROWS} onClick={()=>commit([...rows,columns.map(()=>'')])}>+ {say('Row','Fila')}</button><span>{say('Click to select · Enter to edit','Clic para seleccionar · Enter para editar')}</span></div>
 {message&&<p role="status" className="minimal-table-message">{message}</p>}
 </div>
 {dialog&&<FillDialog language={language} title={dialog.index===null?say('Fill selected cells','Rellenar celdas seleccionadas'):columns[dialog.index].label} allowColumn={dialog.index!==null&&!!area} onClose={()=>setDialog(null)} onApply={(value,scope)=>{
  if(dialog.index!==null&&(scope==='column'||!area))commit(fillUncertainty(rows,columns,dialog.index,value));
  else {const target=dialog.index===null?selection:{anchor:{row:area.top,col:dialog.index},focus:{row:area.bottom,col:dialog.index}};commit(pasteCells(rows,columns,display,target,[[value]]));}
 }}/>}
 </>;
}
