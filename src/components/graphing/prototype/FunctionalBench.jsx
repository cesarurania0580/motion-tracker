// THROWAWAY: three functional layouts share in-memory data; choose a design before integration.
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import PlotPreview from '../PlotPreview.jsx';
import ExportActions from '../../ExportActions.jsx';
import {fitSample,makeFigure} from '../trialFigure.js';
import {exportFigure} from '../trialExport.js';
import {DEFAULT_SETTINGS} from '../defaultSettings.js';
import {TRIAL_TEXT} from '../trialText.js';
import {MODEL_EQUATIONS} from '../fitModels.js';
import {worstFit} from '../worstFit.js';
import {WORST_FIT_TEXT} from '../worstFitText.js';
import {parseDelimitedRecords,MAX_ROWS} from '../graphDocument.js';
import {parseVideoCSV} from '../videoCSV.js';
import {transformRows,transformedLabel,TRANSFORMS} from '../studentAnalysis.js';
import {plottedCSV} from '../liveData.js';
import {formatMeasurement} from '../../../utils/measurementUncertainty.js';
import '../../../styles/palette.css';
import '../trial.css';
import './functional.css';
const noop=()=>{};
const initialColumns=[{key:'t',label:'Time (s)',error:'dt'},{key:'p',label:'Position (m)',error:'dp'},{key:'v',label:'Velocity (m/s)',error:'dv'},{key:'dt',label:'Δt (s)'},{key:'dp',label:'Δposition (m)'},{key:'dv',label:'Δvelocity (m/s)'}];
const example=()=>Array.from({length:9},(_,i)=>({t:String(i*.25),p:String(Number((.4+1.6*i*.25+[.01,-.02,.03,-.01,0,.02,-.02,.01,0][i]).toFixed(3))),v:String(1.6),dt:'.01',dp:'.06',dv:'.1'}));
const numeric=value=>String(value??'').trim()!==''&&/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(String(value).trim())&&Number.isFinite(Number(value));
const getVariant=()=>['A','B','C'].includes(new URLSearchParams(location.search).get('variant'))?new URLSearchParams(location.search).get('variant'):'A';
function VariantA({axes,data,plot,fit}){return <div className="bench-workbench"><div className="bench-data-side">{data}</div><div className="bench-graph-side">{axes}{plot}{fit}</div></div>;}
function VariantB({axes,data,plot,fit}){return <div className="bench-studio">{axes}<div className="bench-studio-main">{plot}{fit}</div>{data}</div>;}
function VariantC({axes,data,plot,fit}){return <div className="bench-notebook"><div className="bench-notebook-pages">{data}{plot}</div><aside>{axes}{fit}</aside></div>;}
export default function FunctionalBench(){
 const [variant,setVariant]=useState(getVariant),[language,setLanguage]=useState(new URLSearchParams(location.search).get('lang')==='es'?'es':'en');
 const es=language==='es',say=(en,esText)=>es?esText:en;
 const [showAllColumns,setShowAllColumns]=useState(false);
 const [columns,setColumns]=useState(initialColumns),[raw,setRaw]=useState(example),[x,setX]=useState('t'),[y,setY]=useState('p'),[dx,setDX]=useState('dt'),[dy,setDY]=useState('dp');
 const [model,setModel]=useState('linear'),[worst,setWorst]=useState(false),[operations,setOperations]=useState({x:'identity',y:'identity'});
 const [title,setTitle]=useState(''),[grid,setGrid]=useState(true),[color,setColor]=useState('#215f96'),[range,setRange]=useState(null),[drag,setDrag]=useState('zoom');
 const [panel,setPanel]=useState(null),[paste,setPaste]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState(null);
 const input=useRef(null);
 const names=es?{A:'Mesa de trabajo',B:'Estudio gráfico',C:'Cuaderno de laboratorio'}:{A:'Workbench',B:'Graph studio',C:'Lab notebook'};
 const chooseVariant=useCallback(next=>{setVariant(next);const url=new URL(location.href);url.searchParams.set('variant',next);history.replaceState(null,'',url);},[]);
 useEffect(()=>{
  const keys=event=>{if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,button,[contenteditable]'))return;
   if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();chooseVariant(['A','B','C'][('ABC'.indexOf(variant)+(event.key==='ArrowRight'?1:2))%3]);}};
  const pop=()=>setVariant(getVariant());window.addEventListener('keydown',keys);window.addEventListener('popstate',pop);
  return ()=>{window.removeEventListener('keydown',keys);window.removeEventListener('popstate',pop);};
 },[variant,chooseVariant]);
 const parsed=useMemo(()=>{
  let invalid=0,excluded=0;const rows=[];
  raw.forEach((row,sourceIndex)=>{if(row.excluded){excluded++;return;}if(!numeric(row[x])||!numeric(row[y])||[dx,dy].some(key=>key&&row[key]!==''&&row[key]!=null&&(!numeric(row[key])||Number(row[key])<0))){invalid++;return;}
   const error=key=>key&&numeric(row[key])?Number(row[key]):null;
   rows.push({x:Number(row[x]),y:Number(row[y]),xError:error(dx),error:error(dy),sourceIndex});});
  const result=transformRows(rows,operations);return {rows:result.rows,invalid:invalid+result.invalid,excluded};
 },[raw,x,y,dx,dy,operations]);
 const fit=useMemo(()=>fitSample(parsed.rows,model),[parsed.rows,model]);
 const bounds=useMemo(()=>worst&&model==='linear'?worstFit(parsed.rows.map(row=>({...row,xError:row.xError??0})),fit?.params):null,[worst,model,parsed.rows,fit]);
 const label=key=>columns.find(c=>c.key===key)?.label||key;
 const labels={x:transformedLabel(label(x),operations.x),y:transformedLabel(label(y),operations.y)};
 const figure=useMemo(()=>makeFigure(parsed.rows,fit,{...DEFAULT_SETTINGS,widthCm:20,heightCm:11,title:title||'',xLabel:labels.x,yLabel:labels.y,color,grid,note:false,dragMode:drag,
  axisMode:range?'manual':'auto',xMin:String(range?.x[0]??''),xMax:String(range?.x[1]??''),yMin:String(range?.y[0]??''),yMax:String(range?.y[1]??'')},language,'independent',{dataName:es?'Mediciones':'Measurements',bounds,boundsText:WORST_FIT_TEXT[language]}),[parsed.rows,fit,title,labels.x,labels.y,color,grid,drag,range,language,es,bounds]);
 const point=useCallback(value=>setSelected(value.index),[]);
 const setAxis=(axis,value)=>{if(axis==='x'){setX(value);setDX(columns.find(c=>c.key===value)?.error||'');}else{setY(value);setDY(columns.find(c=>c.key===value)?.error||'');}setRange(null);setSelected(null);};
 function load(text){
  try{
   const video=parseVideoCSV(text);let cols,rows;
   if(video){cols=video.columns.flatMap(c=>[{key:c.key,label:c.label,error:`${c.key}Error`},{key:`${c.key}Error`,label:`±Δ ${c.label}`}]);rows=video.data;}
   else {const records=parseDelimitedRecords(text);if(!records.length)throw Error();const width=records[0].length;if(width<2||width>12)throw Error();
    const header=records[0].every(cell=>!numeric(cell))?records.shift():null;
    if(!records.length||records.length>MAX_ROWS||records.some(row=>row.length!==width||row.some(v=>v!==''&&!numeric(v))))throw Error();
    cols=Array.from({length:width},(_,i)=>({key:`c${i}`,label:(header?.[i]||`Column ${i+1}`).slice(0,64)}));
    if(width===4){cols[0].error='c2';cols[1].error='c3';}
    rows=records.map(row=>Object.fromEntries(cols.map((c,i)=>[c.key,row[i]])));
   }
   const quantities=cols.filter(c=>!c.key.endsWith('Error'));setColumns(cols);setRaw(rows);setX(quantities[0].key);setY(quantities[1].key);setDX(quantities[0].error||'');setDY(quantities[1].error||'');setOperations({x:'identity',y:'identity'});setRange(null);setSelected(null);setPanel(null);setPaste('');setMessage(say('Imported. Choose X and Y above the graph.','Importado. Elige X e Y junto al gráfico.'));
  }catch{setMessage(say('Could not import. Use a video CSV or 2–12 numeric columns, optional header, decimal points.','No se pudo importar. Usa CSV de video o 2–12 columnas numéricas, encabezado opcional y punto decimal.'));}
 }
 async function fileChange(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;try{if(file.size>500000)throw Error();load(await file.text());}catch{setMessage(say('File could not be read (maximum 500 KB).','No se pudo leer el archivo (máximo 500 KB).'));}}
 const changeCell=(index,key,value)=>setRaw(rows=>rows.map((row,i)=>i===index?{...row,[key]:value}:row));
 const axes=<section className="bench-axes" aria-label={say('Graph columns','Columnas del gráfico')}>
  <div className="bench-axis-pair">{[['X',x],['Y',y]].map(([axis,value])=><label key={axis}><strong>{axis}</strong><span>{say('column','columna')}</span><select value={value} onChange={e=>setAxis(axis.toLowerCase(),e.target.value)}>{columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></label>)}
  <button type="button" title={say('Swap axes','Intercambiar ejes')} onClick={()=>{setX(y);setY(x);setDX(dy);setDY(dx);setOperations({x:operations.y,y:operations.x});setRange(null);}}>X ⇄ Y</button></div>
  <details><summary>{say('Uncertainties & transformations','Incertidumbres y transformaciones')}</summary><div className="bench-extra-grid">
   {[[say('±ΔX column','Columna ±ΔX'),dx,setDX],[say('±ΔY column','Columna ±ΔY'),dy,setDY]].map(([name,value,set])=><label key={name}>{name}<select value={value} onChange={e=>set(e.target.value)}><option value="">{say('Not supplied','No indicada')}</option>{columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></label>)}
   {['x','y'].map(axis=><label key={axis}>{say('Transform','Transformar')} {axis.toUpperCase()}<select value={operations[axis]} onChange={e=>{setOperations({...operations,[axis]:e.target.value});setRange(null);}}>{TRANSFORMS.map((key,i)=><option key={key} value={key}>{[say('Original','Original'),'x²','1/x','√x','ln(x)'][i].replaceAll('x',axis)}</option>)}</select></label>)}
  </div><small>{say('Source cells stay unchanged. Logarithms require dimensionless values; review transformed units.','Las celdas originales se conservan. Los logaritmos requieren valores adimensionales; revisa las unidades transformadas.')}</small></details>
 </section>;
 const errorKeys=new Set(columns.map(c=>c.error).filter(Boolean));
 const visibleColumns=columns.filter(c=>showAllColumns||!errorKeys.has(c.key)||c.key===x||c.key===y);
 const data=<section className="bench-data bench-card"><div className="bench-section-head"><h2>{say('Data','Datos')}</h2><span>{raw.length} {say('rows','filas')}</span><button onClick={()=>setPanel(panel==='import'?null:'import')}>{say('Import / paste','Importar / pegar')}</button></div>
  <label className="bench-columns-toggle"><input type="checkbox" checked={showAllColumns} onChange={e=>setShowAllColumns(e.target.checked)}/>{say('Show uncertainty columns','Mostrar columnas de incertidumbre')}</label>
  <div className="bench-table-scroll"><table><thead><tr><th>{say('Use','Usar')}</th>{visibleColumns.map(c=><th key={c.key} className={c.key===x?'axis-x':c.key===y?'axis-y':''}><span>{c.key===x?'X':c.key===y?'Y':''}</span><input aria-label={say('Column name','Nombre de columna')} maxLength={64} value={c.label} onChange={e=>setColumns(columns.map(col=>col.key===c.key?{...col,label:e.target.value}:col))}/></th>)}<th/></tr></thead>
  <tbody>{raw.map((row,index)=><tr key={index} className={`${row.excluded?'bench-excluded':''} ${parsed.rows[selected]?.sourceIndex===index?'bench-selected':''}`}><td><input type="checkbox" aria-label={`${say('Include row','Incluir fila')} ${index+1}`} checked={!row.excluded} onChange={e=>changeCell(index,'excluded',!e.target.checked)}/><small>{index+1}</small></td>
   {visibleColumns.map(c=><td key={c.key}><input inputMode="decimal" aria-label={`${c.label}, ${index+1}`} value={row[c.key]??''} maxLength={64} onFocus={()=>setSelected(parsed.rows.findIndex(p=>p.sourceIndex===index))} onChange={e=>changeCell(index,c.key,e.target.value)}/></td>)}
   <td><button aria-label={`${say('Remove row','Eliminar fila')} ${index+1}`} onClick={()=>setRaw(raw.filter((_,i)=>i!==index))}>×</button></td></tr>)}</tbody></table></div>
  <div className="bench-table-foot"><button disabled={raw.length>=MAX_ROWS} onClick={()=>setRaw([...raw,Object.fromEntries(columns.map(c=>[c.key,'']))])}>+ {say('Row','Fila')}</button><button disabled={columns.length>=12} onClick={()=>{const key=`extra${Date.now()}`;setColumns([...columns,{key,label:say('New column','Nueva columna')}]);}}>+ {say('Column','Columna')}</button><small>{say('Edit cells or column names. Uncheck a row to omit it.','Edita celdas o nombres. Desmarca una fila para omitirla.')}</small></div>
 </section>;
 const plot=<section className="bench-plot bench-card"><div className="bench-section-head"><h2>{say('Graph','Gráfico')}</h2><div className="bench-view-tools"><button aria-pressed={drag==='zoom'} onClick={()=>setDrag('zoom')}>{say('Zoom','Zoom')}</button><button aria-pressed={drag==='pan'} onClick={()=>setDrag('pan')}>{say('Pan','Mover')}</button><button onClick={()=>setRange(null)}>{say('Reset view','Restablecer vista')}</button></div></div>
  {parsed.rows.length?<PlotPreview figure={figure} text={TRIAL_TEXT[language]} onMeasured={noop} onPoint={point} onRange={setRange} selectedIndex={selected}/>:<div className="bench-empty">{say('Enter data and choose X and Y columns.','Introduce datos y elige las columnas X e Y.')}</div>}
  <div className="bench-result" aria-live="polite"><strong>{fit?.text||(model==='none'?say('No fit selected','Sin ajuste'):say('More suitable data needed for this model','Se requieren datos adecuados para este modelo'))}</strong>{fit&&<span>RMSE {fit.rmse.toPrecision(3)} · R² {Number.isFinite(fit.r2)?fit.r2.toFixed(4):'—'}</span>}</div>
 </section>;
 const fitPanel=<section className="bench-fit bench-card"><h2>{say('Fit a model','Ajustar un modelo')}</h2><div className="bench-models">{['none','linear','quadratic','sinusoidal'].map(key=><button key={key} aria-pressed={model===key} onClick={()=>setModel(key)}><span>{TRIAL_TEXT[language][key]}</span><strong>{MODEL_EQUATIONS[key]}</strong></button>)}</div>
  {model==='linear'&&<details><summary>{say('Worst-fit bounds','Límites del peor ajuste')}</summary><label className="bench-check"><input type="checkbox" checked={worst} onChange={e=>setWorst(e.target.checked)}/>{say('Show maximum / minimum slopes','Mostrar pendientes máxima / mínima')}</label>
   <small>{say('Uses selected uncertainty columns. Missing X is treated as exact; every Y needs a bound.','Usa las columnas de incertidumbre seleccionadas. X faltante se trata como exacta; cada Y requiere un límite.')}</small>
   {worst&&(bounds?.status==='ok'?<p>m = {formatMeasurement(fit.params.m,bounds.delta)}<br/>b = {formatMeasurement(fit.params.b,bounds.intercept.delta)}</p>:<p>{WORST_FIT_TEXT[language][bounds?.status||'missing']}</p>)}</details>}
  <small>{say('Choose a model for the physics. Fits are unweighted.','Elige un modelo según la física. Los ajustes no son ponderados.')}</small>
 </section>;
 const actions=['svg','png','pdf'].map(format=>({label:format.toUpperCase(),create:async()=>{setBusy(true);try{return await exportFigure(figure,format,'phystracker-layout-test');}finally{setBusy(false);}}}));
 const components={axes,data,plot,fit:fitPanel};
 return <div className={`graphing-trial functional-bench variant-${variant}`} data-theme="light" lang={language}>
  <header className="bench-header"><a href="/" target="_blank" rel="noopener"><img src="/logo-dark.png" alt="PhysTracker" onError={e=>{e.currentTarget.hidden=true;}}/></a><span>{say('Graphing lab','Laboratorio gráfico')}</span><small>{say('LOCAL TEST BENCH','BANCO DE PRUEBAS LOCAL')}</small><select aria-label="Language / Idioma" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="es">Español</option></select></header>
  <main><div className="bench-command"><div><h1>{names[variant]}</h1><p>{say('Choose columns. Pick a model. Read the graph.','Elige columnas. Selecciona un modelo. Lee el gráfico.')}</p></div><div className="bench-actions"><button onClick={()=>setPanel(panel==='appearance'?null:'appearance')}>{say('Appearance','Apariencia')}</button><button onClick={()=>setPanel(panel==='export'?null:'export')}>{say('Export','Exportar')}</button><button onClick={()=>{if(window.confirm(say('Replace test data with the sample?','¿Reemplazar los datos de prueba por el ejemplo?'))){setColumns(initialColumns);setRaw(example());setX('t');setY('p');setDX('dt');setDY('dp');setRange(null);setOperations({x:'identity',y:'identity'});}}}>{say('Load example','Cargar ejemplo')}</button></div></div>
  <p className="bench-safety">{say('Example data to start. Edits stay in this tab; switching layouts keeps your work. Reloading clears it.','Datos de ejemplo al iniciar. Los cambios quedan en esta pestaña y se conservan al cambiar de diseño. Recargar los borra.')}</p>
  <fieldset disabled={busy} className="bench-content">
   {panel&&<section className="bench-drawer"><button className="bench-close" onClick={()=>setPanel(null)}>{say('Close','Cerrar')} ×</button>
    {panel==='import'&&<><h2>{say('Import or paste data','Importar o pegar datos')}</h2><p>{say('Video CSV or 2–12 columns with optional headers. Four columns mean X, Y, ΔX, ΔY. Import replaces the test table.','CSV de video o 2–12 columnas con encabezados opcionales. Cuatro columnas significan X, Y, ΔX, ΔY. Importar reemplaza la tabla de prueba.')}</p><button onClick={()=>input.current.click()}>{say('Choose CSV file','Elegir archivo CSV')}</button><input hidden ref={input} type="file" accept=".csv,.tsv,.txt" onChange={fileChange}/><textarea aria-label={say('Paste data','Pegar datos')} rows={4} value={paste} maxLength={500000} onChange={e=>setPaste(e.target.value)}/><button onClick={()=>load(paste)}>{say('Use pasted data','Usar datos pegados')}</button></>}
    {panel==='appearance'&&<><h2>{say('Appearance','Apariencia')}</h2><label>{say('Figure title','Título del gráfico')}<input maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{say('Point colour','Color de puntos')}<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label><label className="bench-check"><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/>{say('Grid','Cuadrícula')}</label></>}
    {panel==='export'&&<><h2>{say('Export this graph','Exportar este gráfico')}</h2><p>{say('Uses the same figure engine as the app. CSV includes the plotted axes and uncertainties.','Usa el mismo motor de figuras de la app. El CSV incluye los ejes graficados y sus incertidumbres.')}</p><fieldset disabled={!parsed.rows.length}><ExportActions language={language} actions={[...actions,{label:'CSV',create:()=>({blob:new Blob([plottedCSV(parsed.rows,labels)],{type:'text/csv;charset=utf-8'}),fileName:'graph-layout-data.csv'})}]} buttonClass="bench-export-button"/></fieldset></>}
   </section>}
   {message&&<p role="status" className="bench-message">{message}</p>}
   {variant==='A'?<VariantA {...components}/>:variant==='B'?<VariantB {...components}/>:<VariantC {...components}/>}
  </fieldset>
  <div className="bench-state" aria-live="polite">{variant} · X: {labels.x} · Y: {labels.y} · {MODEL_EQUATIONS[model]} · {parsed.rows.length} {say('plotted','graficadas')} · {parsed.excluded} {say('excluded','excluidas')} · {parsed.invalid} {say('incomplete / invalid','incompletas / no válidas')}</div>
  <details className="bench-debug"><summary>{say('Inspect prototype state','Inspeccionar estado del prototipo')}</summary><pre>{JSON.stringify({variant,columns,axes:{x,y,dx,dy},model,worst,operations,title,range,rows:raw},null,2)}</pre></details>
  </main>
  {import.meta.env.DEV&&<nav className="bench-switcher" aria-label={say('Compare layouts','Comparar diseños')}><button aria-label={say('Previous layout','Diseño anterior')} onClick={()=>chooseVariant('ABC'[('ABC'.indexOf(variant)+2)%3])}>←</button>{['A','B','C'].map(key=><button key={key} aria-pressed={variant===key} onClick={()=>chooseVariant(key)}>{key} <span>{names[key]}</span></button>)}<button aria-label={say('Next layout','Siguiente diseño')} onClick={()=>chooseVariant('ABC'[('ABC'.indexOf(variant)+1)%3])}>→</button></nav>}
 </div>;
}
