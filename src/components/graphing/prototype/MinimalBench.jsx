// Shared minimal worksheet: embedded in the app and available in the local test bench.
import {useMemo,useRef,useState} from 'react';
import PlotPreview from '../PlotPreview.jsx';
import ExportActions from '../../ExportActions.jsx';
import {makeFigure} from '../trialFigure.js';
import {DEFAULT_SETTINGS} from '../defaultSettings.js';
import {TRIAL_TEXT} from '../trialText.js';
import {ADVANCED_MODELS,advancedFit,ADVANCED_FIT_TEXT} from '../advancedFit.js';
import EditableTable from '../EditableTable.jsx';
import MathFormula from '../MathFormula.jsx';
import {MODEL_NAMES,MODEL_TEX,fitTex,mathNumber} from '../mathNotation.js';
import {exportFigure} from '../trialExport.js';
import {MAX_ROWS} from '../graphDocument.js';
import {defaultColumns,readMinimalCSV,readMinimalRecords,graphRows,populatedColumns,importedErrors,ensureUncertainty,tableColumnOrder} from './minimalData.js';
import {plottedCSV} from '../liveData.js';
import {worstFit} from '../worstFit.js';
import {WORST_FIT_TEXT} from '../worstFitText.js';
import '../../../styles/palette.css';
import '../trial.css';
import './minimal.css';
const noop=()=>{};
const blank=(width=4)=>Array(width).fill('');
const initial=()=>Array.from({length:16},()=>blank());
const splitLabel=value=>{const m=value.match(/^(.*?)\s*\(([^()]*)\)\s*$/);return m?[m[1],m[2]]:[value,''];};
export default function MinimalBench({embedded=false,language:providedLanguage,seed}={}){
 const seededRows=()=>seed?.table?.rows||seed?.rows?.map(row=>['x','y','xError','error'].map(key=>row[key]==null?'':String(row[key])))||initial();
 const seededColumns=()=>{if(seed?.table)return seed.table.columns;const result=defaultColumns();if(seed?.meta){for(const [i,axis] of ['x','y'].entries()){const name=seed.meta[`${axis}Name`]||axis.toUpperCase(),unit=seed.meta[`${axis}Unit`];result[i].label=name+(unit?` (${unit})`:'');result[i+2].label=`±Δ${result[i].label}`;}}return result;};
 const [localLanguage,setLanguage]=useState('en'),[raw,setRaw]=useState(seededRows),[model,setModel]=useState('linear');
 const [title,setTitle]=useState(seed?.meta?.title||''),[xLabel,setXLabel]=useState(seed?.meta?.xName||'X'),[yLabel,setYLabel]=useState(seed?.meta?.yName||'Y'),[xUnit,setXUnit]=useState(seed?.meta?.xUnit||''),[yUnit,setYUnit]=useState(seed?.meta?.yUnit||'');
 const [range,setRange]=useState(null),[worst,setWorst]=useState(false),[message,setMessage]=useState(''),[columns,setColumns]=useState(seededColumns),[axes,setAxes]=useState(seed?.axes||[0,1]);
 const [visibleColumns,setVisibleColumns]=useState(()=>seed?populatedColumns(seededRows(),seededColumns()):[true,true,false,false]);
 const [enabledErrors,setEnabledErrors]=useState(()=>seed?importedErrors(seededRows(),seededColumns()):[]);
 const language=providedLanguage||localLanguage;
 const displayColumns=tableColumnOrder(columns).filter(i=>visibleColumns[i]);
 const [tableRevision,setTableRevision]=useState(0);
 const file=useRef(null),say=(en,es)=>language==='es'?es:en;
 const labels={x:xLabel+(xUnit?` (${xUnit})`:''),y:yLabel+(yUnit?` (${yUnit})`:'')};
 const parsed=useMemo(()=>graphRows(raw,columns,axes,axes.map(i=>!!enabledErrors[i])),[raw,columns,axes,enabledErrors]);
 const fitted=useMemo(()=>advancedFit(parsed.rows,model),[parsed.rows,model]);
 const fit=fitted.fit;
 const bounds=useMemo(()=>worst&&model==='linear'?worstFit(parsed.rows.map(r=>({...r,xError:r.xError??0})),fit?.params):null,[worst,model,parsed.rows,fit]);
 const figure=useMemo(()=>makeFigure(parsed.rows,fit,{...DEFAULT_SETTINGS,title,xLabel:labels.x,yLabel:labels.y,heightCm:12,note:fit?.method==='log-y',legend:false,dragMode:'zoom',axisMode:range?'manual':'auto',xMin:String(range?.x[0]??''),xMax:String(range?.x[1]??''),yMin:String(range?.y[0]??''),yMax:String(range?.y[1]??'')},language,'independent',{dataName:language==='es'?'Mediciones':'Measurements',note:ADVANCED_FIT_TEXT[language].logMethod,bounds,boundsText:WORST_FIT_TEXT[language]}),[parsed.rows,fit,title,labels.x,labels.y,range,language,bounds]);
 function rename(headers){const x=splitLabel(headers[0]),y=splitLabel(headers[1]);setXLabel(x[0]);setXUnit(x[1]);setYLabel(y[0]);setYUnit(y[1]);}
 function loadTable(data){setTableRevision(value=>value+1);setColumns(data.columns);setRaw([...data.rows,...(data.rows.length<MAX_ROWS?[blank(data.columns.length)]:[])]);setVisibleColumns(data.rows.some(r=>r.some(v=>String(v).trim()!==''))?populatedColumns(data.rows,data.columns):data.columns.map(c=>!c.uncertainty));setEnabledErrors(importedErrors(data.rows,data.columns));setAxes([0,1]);rename(data.columns.slice(0,2).map(c=>c.label));setRange(null);setMessage('');}
 function selectAxis(index,value){const next=axes.map((v,i)=>i===index?Number(value):v);setAxes(next);rename(next.map(i=>columns[i].label));setRange(null);}
 function toggleUncertainty(axis,checked){
  if(checked){const next=ensureUncertainty(raw,columns,axis);setColumns(next.columns);setRaw(next.rows);setVisibleColumns(previous=>next.columns.map((_,i)=>i===next.index||i===axis?true:!!previous[i]));}
  setEnabledErrors(previous=>{const next=[...previous];next[axis]=checked;return next;});
 }
 async function importFile(event){const picked=event.target.files?.[0];event.target.value='';if(!picked)return;try{if(picked.size>500000)throw Error();loadTable(readMinimalCSV(await picked.text()));}catch{setMessage(say('Use a video CSV or a numeric table with 2–32 columns.','Usa un CSV de video o una tabla numérica de 2–32 columnas.'));}}
 const actions=['png','svg','pdf'].map(format=>({label:format.toUpperCase(),create:()=>exportFigure(figure,format,'minimal-graph')}));
 actions.push({label:'CSV',create:()=>({blob:new Blob([plottedCSV(parsed.rows,labels)],{type:'text/csv;charset=utf-8'}),fileName:'minimal-data.csv'})});
 return <div className={`graphing-trial minimal-bench ${embedded?'minimal-embedded':''}`} data-theme="light" lang={language}>
  {!embedded&&<header className="minimal-header"><img src="/logo-dark.png" alt="PhysTracker"/><span>{say('Graph lab · local test','Laboratorio gráfico · prueba local')}</span><select aria-label="Language / Idioma" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="es">Español</option></select></header>}
  <main className="minimal-main">
   <div className="minimal-top"><label className="minimal-title">{say('Title','Título')}<input placeholder={say('Untitled graph','Gráfico sin título')} value={title} maxLength={100} onChange={e=>setTitle(e.target.value)}/></label><button onClick={()=>file.current.click()}>{say('Import CSV','Importar CSV')}</button><input hidden ref={file} type="file" accept=".csv,.tsv,.txt" onChange={importFile}/><button onClick={()=>{if(window.confirm(say('Clear the table?','¿Borrar la tabla?'))){loadTable({columns:defaultColumns(),rows:initial()});}}}>{say('Clear','Borrar')}</button></div>
   <div className="minimal-workspace"><section className="minimal-data" aria-label={say('Data','Datos')}>
    <div className="minimal-axis-labels">{[['X',xLabel,setXLabel,xUnit,setXUnit],['Y',yLabel,setYLabel,yUnit,setYUnit]].map(([axis,label,setLabel,unit,setUnit])=><div key={axis}><label>{axis} {say('label','etiqueta')}<input value={label} maxLength={64} onChange={e=>setLabel(e.target.value)}/></label><label>{say('Unit','Unidad')}<input value={unit} maxLength={24} placeholder="—" onChange={e=>setUnit(e.target.value)}/></label></div>)}</div>
    <div className="minimal-source">{axes.map((axis,i)=><div className="minimal-axis-choice" key={i}><label>{i===0?'X':'Y'} {say('column','columna')}<select value={axis} onChange={e=>selectAxis(i,e.target.value)}>{columns.map((c,j)=><option key={j} value={j}>{c.label}</option>)}</select></label><label className="minimal-uncertainty-toggle"><input type="checkbox" checked={!!enabledErrors[axis]} disabled={columns[axis].uncertainty} onChange={e=>toggleUncertainty(axis,e.target.checked)}/>{say('± Uncertainty','± Incertidumbre')}</label></div>)}</div>
    <div className="minimal-columns" role="group" aria-label={say('Visible columns','Columnas visibles')}>{columns.map(({label:name},index)=><label key={index}><input type="checkbox" checked={visibleColumns[index]} onChange={e=>{const checked=e.target.checked;setVisibleColumns(previous=>previous.map((value,i)=>i===index?checked:value));}}/>{name}</label>)}</div>
    <EditableTable key={`${tableRevision}:${columns.length}`} rows={raw} columns={columns} display={displayColumns} language={language} onChange={setRaw} onImport={records=>loadTable(readMinimalRecords(records))}/>

   </section><section className="minimal-graph" aria-label={say('Graph','Gráfico')}>
    <div className="minimal-fit"><label>{say('Fit','Ajuste')}<select value={model} onChange={e=>setModel(e.target.value)}>{Object.keys(ADVANCED_MODELS).map(key=><option key={key} value={key}>{MODEL_NAMES[language][key]}</option>)}</select>{model!=='none'&&<MathFormula tex={MODEL_TEX[model]} className="model-equation"/>}</label><label className="minimal-check"><input type="checkbox" checked={worst} disabled={model!=='linear'} onChange={e=>setWorst(e.target.checked)}/>{say('Worst fit','Ajuste extremo')}</label><button onClick={()=>setRange(null)}>{say('Reset view','Restablecer vista')}</button></div>
    <PlotPreview figure={figure} text={TRIAL_TEXT[language]} onMeasured={noop} onPoint={noop} onRange={setRange} theme="light"/>
    <div className="minimal-result" aria-live="polite">{fit?<><MathFormula tex={fitTex(fit,model)} className="fitted-equation"/><span className="fit-statistics"><MathFormula tex={`\\mathrm{RMSE}=${mathNumber(fit.rmse)}${fit.r2==null?'':`\\qquad R^{2}=${mathNumber(fit.r2)}`}`}/></span></>:fitted.issue?ADVANCED_FIT_TEXT[language][fitted.issue]:parsed.rows.length&&model!=='none'?ADVANCED_FIT_TEXT[language].noFit:!parsed.rows.length?say('Enter or paste data to begin.','Ingresa o pega datos para comenzar.'):''}{fit?.method==='log-y'&&<span>{ADVANCED_FIT_TEXT[language].logMethod}</span>}{bounds&&<span>{bounds.status==='ok'?<MathFormula tex={`m_{\\min}=${mathNumber(bounds.min.m)}\\qquad m_{\\max}=${mathNumber(bounds.max.m)}`}/>:WORST_FIT_TEXT[language][bounds.status]}</span>}</div>
    <div className="minimal-export"><span>{say('Export','Exportar')}</span><fieldset disabled={!parsed.rows.length}><ExportActions language={language} actions={actions} buttonClass="minimal-export-button"/></fieldset></div>
   </section></div>
   <footer role="status">{message||`${parsed.rows.length} ${say('points','puntos')}${parsed.invalid?` · ${parsed.invalid} ${say('incomplete / invalid rows','filas incompletas / no válidas')}`:''}`}<span>{say('Export your data before closing.','Exporta tus datos antes de cerrar.')}</span></footer>
  </main>
 </div>;
}
