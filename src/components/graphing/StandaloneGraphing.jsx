import {defaultSheet,columnLabel,mapSheetRows,videoWorksheet,parseWideWorksheet} from './workbenchData.js';
import {parseVideoCSV,selectVideoColumns} from './videoCSV.js';
import StudentTools from './StudentTools.jsx';
import {transformRows,transformedLabel} from './studentAnalysis.js';
import '../../styles/palette.css';
import {useCallback,useMemo,useRef,useState} from 'react';
import GraphWorkspace from './GraphWorkspace.jsx';
import Worksheet from './Worksheet.jsx';
import ExportActions from '../ExportActions.jsx';
import {LIVE_TEXT} from './liveText.js';
import {arbitraryUnits} from './fitModels.js';
import {blankRow,evaluateRows,parseTable,graphDocument,readGraphDocument,MAX_ROWS} from './graphDocument.js';
import {plottedCSV} from './liveData.js';
import './trial.css';

const TEXT={
 en:{title:'Data & graphing',subtitle:'Create a figure from your own measurements. No video needed.',
 name:'Figure title',xName:'X label',yName:'Y label',xUnit:'X unit',yUnit:'Y unit',
 import:'Import CSV',open:'Open graph document',save:'Save graph document',paste:'Paste spreadsheet data',
 pasteHelp:'PhysTracker video CSV, or two/four columns: X, Y, ±ΔX, ±ΔY. Tab, comma or semicolon separated; optional header. Decimal point required. Loading replaces the table.',
 load:'Load pasted data',notice:'Independent dataset. Edit the cells; your video measurements are not changed.',
 description:'Choose a model that matches your physical relationship. Uncertainties are not used as fitting weights.',
 invalid:'Rows with incomplete or invalid values are omitted from the graph:',error:'Could not load the data. Use a PhysTracker video CSV, 2 or 4 numeric columns (X, Y, ±ΔX, ±ΔY), or a saved graph document. Uncertainties must be nonnegative.',
 limit:'Maximum 2,000 rows. Save your graph document to keep data and settings.',reset:'New blank sheet',confirm:'Replace this worksheet with a blank one? Save your graph document first if needed.',
 fileHelp:'CSV imports and graph documents replace the current worksheet. Save it first if needed.',
 },
 es:{title:'Datos y gráficos',subtitle:'Crea una figura con tus propias mediciones. No necesitas un video.',
 name:'Título de la figura',xName:'Etiqueta X',yName:'Etiqueta Y',xUnit:'Unidad X',yUnit:'Unidad Y',
 import:'Importar CSV',open:'Abrir documento gráfico',save:'Guardar documento gráfico',paste:'Pegar datos de hoja de cálculo',
 pasteHelp:'CSV de video PhysTracker, o dos/cuatro columnas: X, Y, ±ΔX, ±ΔY. Separadas por tabulador, coma o punto y coma; encabezado opcional. Usa punto decimal. Cargar reemplaza la tabla.',
 load:'Cargar datos pegados',notice:'Datos independientes. Edita las celdas; tus mediciones de video no cambian.',
 description:'Elige un modelo que corresponda a la relación física. Las incertidumbres no ponderan el ajuste.',
 invalid:'Se omiten del gráfico las filas incompletas o no válidas:',error:'No se pudieron cargar los datos. Usa un CSV de video PhysTracker, 2 o 4 columnas numéricas (X, Y, ±ΔX, ±ΔY), o un documento gráfico guardado. Las incertidumbres deben ser no negativas.',
 limit:'Máximo 2000 filas. Guarda el documento gráfico para conservar datos y ajustes.',reset:'Nueva hoja vacía',confirm:'¿Reemplazar esta hoja por una vacía? Guarda el documento primero si lo necesitas.',
 fileHelp:'Importar CSV o abrir un documento reemplaza la hoja actual. Guárdala primero si lo necesitas.',
 }
};
const initialMeta={title:'',xName:'X',yName:'Y',xUnit:'',yUnit:''};
export default function StandaloneGraphing({embedded=false,language:providedLanguage,seed}={}){
 const [localLanguage,setLanguage]=useState('en'),[raw,setRaw]=useState(()=>seed?.rows||Array.from({length:6},blankRow));
 const [meta,setMeta]=useState(seed?.meta||initialMeta),[paste,setPaste]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const [revision,setRevision]=useState(0),[initialGraph,setInitialGraph]=useState(undefined);
 const [sheet,setSheet]=useState(defaultSheet);
 const [hiddenColumns,setHiddenColumns]=useState([]);
 const [operations,setOperations]=useState({x:'identity',y:'identity'});
 const [pendingCSV,setPendingCSV]=useState(null),[csvX,setCSVX]=useState('time'),[csvY,setCSVY]=useState('x');
 const graphRef=useRef(),fileInput=useRef(),openInput=useRef();
 const theme='light';
 const LabelsContainer=embedded?'details':'div';
 const language=providedLanguage||localLanguage;
 const t=TEXT[language]||TEXT.en;
 const sourceColumns=useMemo(()=>sheet.columns.map(c=>c.key==='x'?{...c,name:meta.xName,unit:meta.xUnit}:c.key==='y'?{...c,name:meta.yName,unit:meta.yUnit}:c),[sheet.columns,meta]);
 const evaluated=useMemo(()=>evaluateRows(mapSheetRows(raw,sheet)),[raw,sheet]);
 const processed=useMemo(()=>transformRows(evaluated.rows,operations),[evaluated.rows,operations]);
 const labels={x:meta.xName+(meta.xUnit?` (${meta.xUnit})`:''),y:meta.yName+(meta.yUnit?` (${meta.yUnit})`:'')};
 const axisColumn=axis=>sourceColumns.find(c=>c.key===sheet[axis]);
 const graphLabels={x:transformedLabel(columnLabel(axisColumn('x')),operations.x),y:transformedLabel(columnLabel(axisColumn('y')),operations.y)};
 const overrides=useMemo(()=>({...LIVE_TEXT[language],dataHint:t.notice,fitHint:t.description}),[language,t]);
 const rememberGraph=useCallback(graph=>{graphRef.current=graph;},[]);
 function replace(next){setHiddenColumns([]);setSheet(next.sheet||defaultSheet());setPendingCSV(null);setOperations(next.operations||{x:'identity',y:'identity'});setRaw(next.rows);if(next.meta)setMeta(next.meta);else if(next.headers){
   const split=header=>{const match=header.match(/^(.*?)\s*\(([^()]*)\)\s*$/);return match?[match[1].trim().slice(0,100),match[2].slice(0,100)]:[header.slice(0,100),''];};
   const [xName,xUnit]=split(next.headers[0]),[yName,yUnit]=split(next.headers[1]);setMeta(previous=>({...previous,xName,xUnit,yName,yUnit}));
  }setInitialGraph(next.graph);graphRef.current=next.graph;setRevision(r=>r+1);setError(false);}
 function importCSV(text){
  setPendingCSV(null);
  const source=parseVideoCSV(text);
  if(source){setPendingCSV(source);setCSVX('time');setCSVY('x');setError(false);}else {try{replace(parseTable(text));}catch(error){if(!embedded)throw error;replace(parseWideWorksheet(text));}}
 }
 const selectedCSV=useMemo(()=>{if(!pendingCSV)return null;try{return selectVideoColumns(pendingCSV,csvX,csvY);}catch{return null;}},[pendingCSV,csvX,csvY]);
 async function importFile(event,isDocument){
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  setBusy(true);setPendingCSV(null);
  try{if(file.size>1000000)throw Error('size');const text=await file.text();if(isDocument)replace(readGraphDocument(text));else importCSV(text);}
  catch{setError(true);}finally{setBusy(false);}
 }
 function changeAxis(axis,key){
  setSheet(previous=>({...previous,[axis]:key}));setOperations({x:'identity',y:'identity'});
  const graph=graphRef.current;
  if(graph){const next={...graph,dx:'',dy:'',settings:{...graph.settings,axisMode:'auto',xLabel:null,yLabel:null}};setInitialGraph(next);graphRef.current=next;}
  setRevision(r=>r+1);
 }
 const axisControls=<><div className="workbench-axis-controls">{['x','y'].map(axis=><label className="trial-field" key={axis}><strong>{axis.toUpperCase()} {language==='es'?'columna':'column'}</strong><select value={sheet[axis]} aria-label={`${axis.toUpperCase()} ${language==='es'?'columna':'column'}`} onChange={e=>changeAxis(axis,e.target.value)}>{sourceColumns.map(c=><option key={c.key} value={c.key}>{columnLabel(c)}</option>)}</select></label>)}</div>
 <details className="workbench-uncertainty-sources"><summary>{language==='es'?'Columnas de incertidumbre':'Uncertainty columns'}</summary><div className="trial-pair">{['x','y'].map(axis=>{
   const c=axisColumn(axis),ownError=c.key==='x'?'xError':c.key==='y'?'error':`${c.key}Error`;
   return <label className="trial-field" key={axis}>±Δ{axis.toUpperCase()}<select value={c.errorKey} onChange={e=>setSheet({...sheet,columns:sheet.columns.map(col=>col.key===c.key?{...col,errorKey:e.target.value}:col)})}>
     <option value="">{language==='es'?'No indicada':'Not supplied'}</option><option value={ownError}>±Δ {columnLabel(c)}</option>{sourceColumns.map(col=><option key={col.key} value={col.key}>{columnLabel(col)}</option>)}
   </select></label>;
 })}</div></details></>;
 const edit=(index,key,value)=>setRaw(rows=>rows.map((row,i)=>i===index?{...row,[key]:typeof value==='string'?value.slice(0,key==='reason'?2000:64):value,...(key==='reason'&&!value.trim()?{excluded:false}:{})}:row));
 const dataControls=(    <fieldset disabled={busy} className={`standalone-inputs ${embedded?'workbench-top-toolbar':''}`} aria-label={language==='es'?'Herramientas de la hoja':'Worksheet tools'}>
      <div className="standalone-actions"><button type="button" onClick={()=>fileInput.current.click()}>{t.import}</button><button type="button" onClick={()=>openInput.current.click()}>{t.open}</button>
        <ExportActions language={language} buttonClass="trial-export-button" actions={[{label:t.save,create:()=>({blob:new Blob([graphDocument(meta,raw,graphRef.current,operations,sheet)],{type:'application/json'}),fileName:'phystracker.phygraph.json'})}]}/>
        <button type="button" onClick={()=>{if(window.confirm(t.confirm))replace({rows:Array.from({length:6},blankRow),meta:initialMeta});}}>{t.reset}</button>
      </div>
      {!embedded&&<p className="f-data-note">{t.fileHelp}</p>}
      <LabelsContainer className="workbench-labels">{embedded&&<summary>{language==='es'?'Nombres y unidades':'Labels & units'}</summary>}<div className="standalone-labels">{['title',...(sheet.columns.some(c=>c.key==='x')?['xName','xUnit']:[]),...(sheet.columns.some(c=>c.key==='y')?['yName','yUnit']:[])].map(key=><label className="trial-field" key={key}>{t[key==='title'?'name':key]}<input maxLength={100} value={meta[key]} onChange={e=>setMeta({...meta,[key]:e.target.value})}/></label>)}</div>
      {embedded&&sourceColumns.filter(c=>c.key!=='x'&&c.key!=='y').map(c=><div className="trial-pair" key={c.key}><label className="trial-field">{language==='es'?'Etiqueta':'Label'}<input maxLength={100} value={c.name} onChange={e=>setSheet({...sheet,columns:sheet.columns.map(col=>col.key===c.key?{...col,name:e.target.value}:col)})}/></label><label className="trial-field">{language==='es'?'Unidad':'Unit'}<input maxLength={100} value={c.unit} onChange={e=>setSheet({...sheet,columns:sheet.columns.map(col=>col.key===c.key?{...col,unit:e.target.value}:col)})}/></label></div>)}
      </LabelsContainer>
      <details className="standalone-paste"><summary>{t.paste}</summary>{embedded&&<p>{t.fileHelp}</p>}<p>{embedded?(language==='es'?'CSV de video, 2 columnas de valores, 4 columnas (X, Y, ±ΔX, ±ΔY), o hasta 12 columnas con encabezados. Usa punto decimal. Cargar reemplaza la tabla.':'Video CSV, 2 value columns, 4 columns (X, Y, ±ΔX, ±ΔY), or up to 12 named columns. Use decimal points. Loading replaces the table.'):t.pasteHelp}</p><textarea aria-label={t.paste} value={paste} maxLength={500000} onChange={e=>setPaste(e.target.value)} rows={5}/><button type="button" onClick={()=>{try{importCSV(paste);setPaste('');}catch{setError(true);}}}>{t.load}</button></details>
      {pendingCSV&&<section className="csv-column-picker" aria-label={language==='es'?'Importar columnas de video':'Import video columns'}>
        <h3>{language==='es'?'Selecciona los ejes del CSV de video':'Choose axes from the video CSV'}</h3>
        <p>{language==='es'?'Se importan las incertidumbres correspondientes. Confirmar reemplaza la hoja; cancelar la conserva. Los campos vacíos siguen sin estimación.':'Matching uncertainty columns are imported automatically. Confirming replaces the worksheet; cancelling keeps it. Blank uncertainties remain unestimated.'}</p>
        <div className="trial-pair">{[['X',csvX,setCSVX],['Y',csvY,setCSVY]].map(([axis,value,set])=><label className="trial-field" key={axis}>{axis}<select aria-label={`CSV ${axis} axis`} value={value} onChange={e=>set(e.target.value)}>{pendingCSV.columns.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></label>)}</div>
        <p role="status">{selectedCSV?`${selectedCSV.rows.length} ${language==='es'?'filas para importar':'rows to import'} · ${selectedCSV.skipped} ${language==='es'?'filas sin ambos valores, omitidas':'rows missing an axis value, omitted'}`:(language==='es'?'No hay filas con ambos valores.':'No rows have both selected values.')}</p>
        <div className="standalone-actions"><button type="button" disabled={!selectedCSV} onClick={()=>replace(embedded?videoWorksheet(pendingCSV,csvX,csvY):selectedCSV)}>{language==='es'?'Importar columnas seleccionadas':'Import selected columns'}</button><button type="button" onClick={()=>setPendingCSV(null)}>{language==='es'?'Cancelar importación':'Cancel import'}</button></div>
      </section>}
      {embedded&&<button type="button" disabled={sheet.columns.length>=12} className="workbench-add-column" onClick={()=>{let i=0;while(sheet.columns.some(c=>c.key===`c${i}`))i++;setSheet({...sheet,columns:[...sheet.columns,{key:`c${i}`,name:language==='es'?`Columna ${sheet.columns.length+1}`:`Column ${sheet.columns.length+1}`,unit:'',errorKey:`c${i}Error`}]});}}>+ {language==='es'?'Añadir columna':'Add column'}</button>}
      <StudentTools language={language} operations={operations} onOperations={setOperations} onRepeat={row=>{if(raw.length<MAX_ROWS)setRaw([...raw,{...blankRow(),[sheet.x]:row.x,[sheet.y]:row.y,[axisColumn('x').errorKey]:row.xError,[axisColumn('y').errorKey]:row.error,note:row.note}]);}}/>
      <input ref={fileInput} type="file" accept=".csv,.tsv,.txt" hidden onChange={e=>importFile(e,false)}/><input ref={openInput} type="file" accept=".json" hidden onChange={e=>importFile(e,true)}/>
    </fieldset>);
 return <div className={`graphing-trial standalone-graphing ${embedded?'embedded-graphing':''}`} lang={language} data-theme={theme}>
  {!embedded&&<header className="trial-header"><a className="trial-brand" href="/" target="_blank" rel="noopener">PhysTracker <span>{t.title}</span></a><label className="trial-language"><select aria-label="Language / Idioma" value={language} disabled={busy} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="es">Español</option></select></label></header>}
  <main className="standalone-main">
    {!embedded&&<><h1>{t.title}</h1><p className="f-data-note">{t.subtitle}</p></>}
    {dataControls}
    {error&&<p role="alert" className="trial-error">{t.error}</p>}
    {evaluated.invalid>0&&<p role="status" className="trial-error">{t.invalid} {evaluated.invalid}</p>}
    {evaluated.excluded>0&&<p role="status">{evaluated.excluded} {language==='es'?'filas excluidas del gráfico y ajuste; conservadas en la tabla y documento.':'rows excluded from graph and fit; retained in table and document.'}</p>}
    {processed.invalid>0&&<p role="alert">{processed.invalid} {language==='es'?'filas fuera del dominio de transformación (valor o incertidumbre); no se grafican.':'rows outside the transformation domain (value or uncertainty); not plotted.'}</p>}
    <GraphWorkspace axisControls={embedded?axisControls:null} theme={theme} layout={embedded?'workbench':'F'} toolsPosition={embedded?'side':'top'} key={revision} sample="independent" language={language} rows={processed.rows} initialModel="none" initialState={initialGraph} onStateChange={rememberGraph}
      onBusy={setBusy} labels={graphLabels} title={meta.title||t.title} description={t.description} notice={t.notice} textOverrides={overrides}
      unitsForFit={model=>arbitraryUnits(model,transformedLabel(axisColumn('x').unit||'1',operations.x),transformedLabel(axisColumn('y').unit||'1',operations.y))}
      exportData={rows=>({blob:new Blob([plottedCSV(rows,graphLabels)],{type:'text/csv;charset=utf-8'}),fileName:'graph-data.csv'})}
      renderWorksheet={({selectedIndex,onSelect})=><fieldset disabled={busy}><Worksheet hiddenColumns={hiddenColumns} onToggleColumn={key=>setHiddenColumns(previous=>previous.includes(key)?previous.filter(k=>k!==key):[...previous,key])} compact={embedded} columns={embedded||sheet.columns.some(c=>c.key.startsWith('c'))?sourceColumns.map(c=>({...c,label:columnLabel(c)})):undefined} axes={sheet} rows={raw} labels={labels} language={language} selectedIndex={processed.rows[selectedIndex]?.sourceIndex}
        onSelect={index=>onSelect(processed.rows.findIndex(row=>row.sourceIndex===index))} onEdit={edit}
        onAdd={()=>{if(raw.length<MAX_ROWS)setRaw([...raw,blankRow()]);}} onRemove={index=>setRaw(raw.filter((_,i)=>i!==index))}/></fieldset>}/>
    <p className="f-data-note">{t.limit}</p>
  </main>
 </div>;
}
