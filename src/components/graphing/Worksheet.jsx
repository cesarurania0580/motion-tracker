import {useState} from 'react';
export default function Worksheet({rows,labels,language,onEdit,onAdd,onRemove,onSelect,selectedIndex,columns,axes,compact=false,hiddenColumns=[],onToggleColumn}) {
  const [paging,setPaging]=useState({page:0,selection:undefined});
  const page=Number.isInteger(selectedIndex)&&paging.selection!==selectedIndex?Math.floor(selectedIndex/50):paging.page;
  const setPage=next=>setPaging({page:next,selection:selectedIndex});
  const pages=Math.max(1,Math.ceil(rows.length/50)),current=Math.min(page,pages-1);
  const es=language==='es';
  const [showErrors,setShowErrors]=useState(false),[showReasons,setShowReasons]=useState(false);
  const fields=columns?columns.filter(c=>!compact||!hiddenColumns.includes(c.key)).flatMap(c=>[{key:c.key,label:c.label},...(c.errorKey&&(!compact||showErrors)?[{key:c.errorKey,label:`±Δ ${c.label}`}]:[])]).filter((field,i,all)=>all.findIndex(f=>f.key===field.key)===i):['x','y','xError','error'].map(key=>({key,label:{x:labels.x,y:labels.y,xError:'±ΔX',error:'±ΔY'}[key]}));
  return <>
    {compact&&columns&&onToggleColumn&&<fieldset className="workbench-column-visibility"><legend>{es?'Mostrar columnas':'Show columns'}</legend><div>{columns.map(c=><label key={c.key}><input type="checkbox" checked={!hiddenColumns.includes(c.key)} onChange={()=>onToggleColumn(c.key)}/>{c.label}</label>)}</div></fieldset>}
    {compact&&<div className="workbench-table-options"><label><input type="checkbox" checked={showErrors} onChange={e=>setShowErrors(e.target.checked)}/>{es?'Incertidumbres':'Uncertainties'}</label><label><input type="checkbox" checked={showReasons} onChange={e=>setShowReasons(e.target.checked)}/>{es?'Exclusiones y notas':'Exclusions & notes'}</label></div>}
    {compact&&!fields.length&&<p className="f-data-note" role="status">{es?'Selecciona una columna para mostrarla. El gráfico no cambia.':'Select a column to show it. The graph is unchanged.'}</p>}
    <div className="trial-table-wrap f-table"><table><thead><tr><th>#</th>{fields.map(field=><th key={field.key}>{axes&&(field.key===axes.x||field.key===axes.y)&&<b className="workbench-axis-tag">{field.key===axes.x?'X':''}{field.key===axes.y?'Y':''} </b>}{field.label}</th>)}{onEdit&&(!compact||showReasons)&&<th>{es?'Uso / justificación':'Use / justification'}</th>}{onRemove&&<th><span className="trial-sr-only">{es?'Eliminar':'Remove'}</span></th>}</tr></thead>
      <tbody>{rows.slice(current*50,current*50+50).map((row,offset)=>{
        const index=current*50+offset;
        return <tr key={index} className={`${index===selectedIndex?'f-selected':''} ${row.excluded?'worksheet-excluded':''}`}>
          <td><button type="button" onClick={()=>onSelect?.(index)} aria-label={`${es?'Seleccionar fila':'Select row'} ${index+1}`}>{index+1}</button></td>
          {fields.map(({key,label})=><td key={key}>{onEdit?<input aria-label={`${label} · ${es?'fila':'row'} ${index+1}`} inputMode="decimal" value={row[key]??''} onChange={event=>onEdit(index,key,event.target.value)} onFocus={()=>onSelect?.(index)}/>:Number.isFinite(row[key])?Number(row[key].toPrecision(6)).toString():'—'}</td>)}
          {onEdit&&(!compact||showReasons)&&<td className="worksheet-reason"><label><input type="checkbox" checked={!row.excluded} disabled={!row.excluded&&!row.reason?.trim()} onChange={e=>onEdit(index,'excluded',!e.target.checked)}/>{es?'Incluir':'Include'}</label>
            <input aria-label={`${es?'Justificación':'Justification'} ${index+1}`} placeholder={es?'Motivo antes de excluir':'Reason before excluding'} value={row.reason||''} maxLength={2000} onChange={e=>onEdit(index,'reason',e.target.value)}/>
            {row.note&&<details><summary>{es?'Procedencia':'Provenance'}</summary><small>{row.note}</small></details>}</td>}
          {onRemove&&<td><button type="button" onClick={()=>onRemove(index)} aria-label={`${es?'Eliminar fila':'Remove row'} ${index+1}`}>×</button></td>}
        </tr>;
      })}</tbody></table></div>
    <div className="f-table-footer">
      {onAdd&&<button type="button" onClick={onAdd}>+ {es?'Añadir fila':'Add row'}</button>}
      <button type="button" disabled={current===0} onClick={()=>setPage(current-1)} aria-label={es?'Página anterior':'Previous page'}>‹</button>
      <span>{current+1} / {pages} · {rows.length} {es?'filas':'rows'}</span>
      <button type="button" disabled={current>=pages-1} onClick={()=>setPage(current+1)} aria-label={es?'Página siguiente':'Next page'}>›</button>
    </div>
  </>;
}
