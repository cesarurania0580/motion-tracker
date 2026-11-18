import {formatMeasurement} from '../../utils/measurementUncertainty.js';
import {MODEL_EQUATIONS,parameterSymbol} from './fitModels.js';
import Worksheet from './Worksheet.jsx';
import {uncertaintyRows,worstFit} from './worstFit.js';
import {WORST_FIT_TEXT} from './worstFitText.js';
import {Fragment,useCallback,useMemo,useState,useEffect} from 'react';
import {ChartNoAxesCombined,Download,FlaskConical,Move,RotateCcw,ZoomIn} from 'lucide-react';
import ExportActions from '../ExportActions.jsx';
import PlotPreview from './PlotPreview.jsx';
import {DEFAULT_SETTINGS} from './defaultSettings.js';
import {fitSample,makeFigure} from './trialFigure.js';
import {exportFigure} from './trialExport.js';
import {TRIAL_TEXT} from './trialText.js';
const tabs=['fit','appearance','export','data'];
const number=value=>Number.isFinite(value)?Number(value.toPrecision(5)).toString():'—';
function Toggle({label,checked,onChange}) {
  return <label className="trial-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/></label>;
}
const EMPTY_TEXT={};
export default function GraphWorkspace({sample,language,onBusy,rows,initialModel,onModelChange,labels,title,description,notice,textOverrides=EMPTY_TEXT,unitsForFit,initialColor,extraDataControls,exportData,figureExtras,showDiagnostics=false,renderWorksheet,initialState,onStateChange,toolsPosition='bottom',layout='F',theme='light',axisControls,worksheetControls}) {
  const FitResult=layout==='workbench'?'details':Fragment;
  const t=useMemo(()=>({...TRIAL_TEXT[language],...textOverrides}),[language,textOverrides]);
  const wt=WORST_FIT_TEXT[language]||WORST_FIT_TEXT.en;
  const [showWorst,setShowWorst]=useState(initialState?.showWorst||false),[dx,setDX]=useState(initialState?.dx||''),[dy,setDY]=useState(initialState?.dy||'');
  const [tab,setTab]=useState(toolsPosition==='top'?null:'fit');
  const [model,setModel]=useState(initialState?.model||initialModel);
  const [settings,setSettings]=useState({...DEFAULT_SETTINGS,color:initialColor||DEFAULT_SETTINGS.color,errorBars:sample!=='spectrum',title:null,xLabel:null,yLabel:null,dragMode:'zoom',...initialState?.settings});
  const [point,setPoint]=useState(null),[renderMs,setRenderMs]=useState(null),[exportMs,setExportMs]=useState(null),[exporting,setExporting]=useState(false);
  useEffect(()=>{onStateChange?.({model,settings,showWorst,dx,dy});},[model,settings,showWorst,dx,dy,onStateChange]);
  const worstEnabled=showWorst&&model==='linear'&&sample!=='spectrum';
  const uncertainRows=useMemo(()=>worstEnabled?uncertaintyRows(rows,dx,dy):rows,[rows,worstEnabled,dx,dy]);
  const fit=useMemo(()=>fitSample(rows,model),[rows,model]);
  const bounds=useMemo(()=>worstEnabled?worstFit(uncertainRows,fit?.params):null,[uncertainRows,fit,worstEnabled]);
  const resolved=useMemo(()=>({...settings,title:settings.title??title,
    xLabel:settings.xLabel??labels.x,yLabel:settings.yLabel??labels.y,errorBars:worstEnabled||settings.errorBars}),[settings,title,labels.x,labels.y,worstEnabled]);
  const result=useMemo(()=>{
    try{return {figure:makeFigure(uncertainRows||rows,fit,resolved,language,sample,{...figureExtras,text:t,bounds,boundsText:wt,...(bounds?.status==='ok'?{note:`m = ${formatMeasurement(fit.params.m,bounds.delta)}; b = ${formatMeasurement(fit.params.b,bounds.intercept.delta)}`}:{})})};}catch(error){return {error:error.message};}
  },[rows,uncertainRows,fit,resolved,language,sample,figureExtras,t,bounds,wt]);
  const figure=result.figure;
  const selectPoint=useCallback(value=>setPoint({...value,rows}),[rows]);
  const selectedPoint=point?.rows===rows?point:null;
  const units=fit?unitsForFit(fit.type):{};
  const update=(key,value)=>setSettings(previous=>({...previous,[key]:value}));
  const onRange=useCallback(range=>setSettings(previous=>range?{...previous,axisMode:'manual',
    xMin:String(range.x[0]),xMax:String(range.x[1]),yMin:String(range.y[0]),yMax:String(range.y[1])}:{...previous,axisMode:'auto'}),[]);
  function changeRanges(mode){
    if(mode==='auto'){onRange(null);return;}
    if(!rows.length)return;
    const xs=rows.map(row=>row.x),ys=rows.map(row=>row.y),lo=Math.min(...ys),hi=Math.max(...ys),pad=(hi-lo||1)*.1;
    const left=Math.min(...xs),right=Math.max(...xs);
    onRange({x:left===right?[left-.5,right+.5]:[left,right],y:[lo-pad,hi+pad]});
  }
  function moveTab(event){
    let next=tabs.indexOf(tab);
    if(event.key==='ArrowRight')next=(next+1)%tabs.length;
    else if(event.key==='ArrowLeft')next=(next+tabs.length-1)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();setTab(tabs[next]);document.getElementById(`trial-tab-${tabs[next]}`)?.focus();
  }
  const actions=['svg','png','pdf'].map(format=>({label:t[format],icon:<Download size={16}/>,create:async()=>{
    if(!figure)throw Error('Invalid figure');
    setExporting(true);onBusy(true);
    try{
      const output=await exportFigure(figure,format,`phystracker-${sample}`);
      setExportMs({format,time:output.elapsed,bytes:output.blob.size});return output;
    }finally{setExporting(false);onBusy(false);}
  }}));

  return <fieldset className={`trial-workspace ${layout==='workbench'?'design-workbench':layout==='A'?'design-a':'design-f'} ${toolsPosition==='top'?'tools-top':''} ${exporting?'trial-busy':''}`} disabled={exporting}>
    <legend className="trial-sr-only">{t.controls}</legend>
    {axisControls&&<section className="workbench-axes" aria-label={language==='es'?'Columnas del gráfico':'Graph columns'}>{axisControls}</section>}
    <aside className="trial-controls workspace-tools">
      <div className="trial-tabs" role="tablist" aria-label={t.controls} onKeyDown={moveTab}>
        {tabs.map(key=><button type="button" key={key} id={`trial-tab-${key}`} role="tab" aria-selected={tab===key} tabIndex={tab===key||(!tab&&key==='fit')?0:-1} aria-controls="trial-tab-panel" onClick={()=>setTab(key)}>{t[key]}</button>)}
      </div>
      {tab&&<div id="trial-tab-panel" role="tabpanel" aria-labelledby={`trial-tab-${tab}`} className="trial-panel">
        {toolsPosition==='top'&&<button type="button" className="trial-reset tools-close" onClick={()=>setTab(null)}>{language==='es'?'Cerrar ajustes':'Close settings'} ×</button>}
        {tab==='data'&&<>
          <div className="trial-panel-title"><FlaskConical size={20}/><h3>{title}</h3></div>
          <p>{description}</p><p className="trial-notice">{notice}</p>
          {extraDataControls}
          <p>{t.dataHint}</p>

        </>}
        {tab==='fit'&&<>
          <div className="trial-panel-title"><ChartNoAxesCombined size={21}/><h3>{t.model}</h3></div>
          <p>{description}</p>
          {layout==='workbench'?<div className="workbench-models">{['none','linear','quadratic','sinusoidal'].map(key=><button type="button" key={key} aria-pressed={model===key} onClick={()=>{setModel(key);onModelChange?.(key);}}><span>{t[key]}</span><strong>{MODEL_EQUATIONS[key]}</strong></button>)}</div>:<label className="trial-field">{t.model}<select value={model} disabled={sample==='spectrum'} onChange={e=>{setModel(e.target.value);onModelChange?.(e.target.value);}}>
            {['none','linear','quadratic','sinusoidal'].map(key=><option key={key} value={key}>{t[key]} · {MODEL_EQUATIONS[key]}</option>)}</select></label>}
          {layout!=='workbench'&&<div className="f-standard-equation">{MODEL_EQUATIONS[model]}</div>}
          {fit?<FitResult {...(layout==='workbench'?{className:'workbench-fit-details'}:{})}>{layout==='workbench'&&<summary>{t.parameters} · {t.rSquared} / {t.rmse}</summary>}
            <div className="trial-equation"><span>{t.equation}</span><strong>{fit.text}</strong></div>
            {fit.warning&&<p className="trial-notice">{t.uncertain}</p>}
            <h4>{t.parameters}</h4><dl className="trial-parameters">{Object.entries(fit.params).map(([key,value])=><div key={key}><dt>{parameterSymbol(fit.type,key)}</dt><dd>{number(value)} <small>{units[key]}</small></dd></div>)}</dl>
            <div className="trial-stat-row"><div><span>{t.rSquared}</span><strong>{number(fit.r2)}</strong></div><div><span>{t.rmse}</span><strong>{number(fit.rmse)}</strong></div></div>
          </FitResult>:<p>{sample==='spectrum'?t.noFit:model==='none'?t.none:t.failedFit}</p>}
          {sample!=='spectrum'&&model==='linear'&&<section className="worst-fit-controls">
            <h4>{wt.heading}</h4><Toggle label={wt.show} checked={showWorst} onChange={setShowWorst}/>
            {showWorst&&<>
              <p>{wt.hint}</p><label className="trial-field">{wt.dx}<input type="number" min="0" step="any" value={dx} onChange={e=>setDX(e.target.value)}/></label>
              <label className="trial-field">{wt.dy}<input type="number" min="0" step="any" value={dy} onChange={e=>setDY(e.target.value)}/></label>
              <p>{wt.source}</p>
              {bounds?.status==='ok'?<>
                <dl className="trial-parameters">{['min','max'].map(key=><div key={key}><dt>{wt[key]}{bounds.worst===key?' *':''}</dt><dd>{number(bounds[key].m)} {units.m}</dd></div>)}</dl>
                <p>{wt.worst}: {wt[bounds.worst]} *</p>
                <div className="trial-equation"><span>{wt.delta}</span><strong>Δm = {number(bounds.delta)} {units.m}{bounds.percent!==null?` (${number(bounds.percent)}%)`:''}</strong></div>
                <p>{wt.formula}</p><p>m = {formatMeasurement(fit.params.m,bounds.delta)} {units.m}</p><p>b = {formatMeasurement(fit.params.b,bounds.intercept.delta)} {units.b}</p><p>{language==='es'?'Límites de intercepto':'Intercept bounds'}: {number(bounds.intercept.min)} … {number(bounds.intercept.max)}</p>{!bounds.bestAcceptable&&<p role="status" className="trial-notice">{wt.misses}</p>}
              </>:<p role="status" className="trial-notice">{wt[bounds?.status||'missing']}</p>}
            </>}
          </section>}
          <p className="trial-notice">{t.fitHint}</p>
        </>}
        {tab==='appearance'&&<>
          <h3>{t.appearance}</h3>
          <label className="trial-field">{t.title}<input maxLength={100} value={resolved.title} onChange={e=>update('title',e.target.value)}/></label>
          <label className="trial-field">{t.xLabel}<input maxLength={80} value={resolved.xLabel} onChange={e=>update('xLabel',e.target.value)}/></label>
          <label className="trial-field">{t.yLabel}<input maxLength={80} value={resolved.yLabel} onChange={e=>update('yLabel',e.target.value)}/></label>
          <div className="trial-pair"><label className="trial-field">{t.colour}<select value={settings.color} onChange={e=>update('color',e.target.value)}>
            {initialColor && !['#215f96','#167b85','#1d4ed8','#172433','#7c3aed'].includes(initialColor)&&<option value={initialColor}>{language==='es'?'Color del objeto':'Object colour'}</option>}<option value="#215f96">● {language==='es'?'Azul clásico':'Classic blue'}</option><option value="#167b85">● {language==='es'?'Verde azulado':'Teal'}</option><option value="#1d4ed8">● {language==='es'?'Azul':'Blue'}</option><option value="#172433">● {language==='es'?'Negro':'Black'}</option><option value="#7c3aed">● {language==='es'?'Violeta':'Violet'}</option>
          </select></label><label className="trial-field">{t.marker}<select value={settings.marker} onChange={e=>update('marker',e.target.value)}>{['circle','square','diamond','cross'].map(key=><option key={key} value={key}>{t[key]}</option>)}</select></label></div>
          <label className="trial-field">{t.fontSize}: {settings.fontSize}<input type="range" min="12" max="20" value={settings.fontSize} onChange={e=>update('fontSize',Number(e.target.value))}/></label>
          <label className="trial-field">{t.markerSize}: {settings.markerSize}<input type="range" min="3" max="10" value={settings.markerSize} onChange={e=>update('markerSize',Number(e.target.value))}/></label>
          {[['grid',t.grid],['legend',t.legend],['errorBars',t.errors],['note',t.annotation]].map(([key,label])=><Toggle key={key} label={label} checked={settings[key]} onChange={value=>update(key,value)}/>)}
          {worstEnabled&&<p>{wt.forced}</p>}
          <label className="trial-field">{t.ranges}<select value={settings.axisMode} onChange={e=>changeRanges(e.target.value)}><option value="auto">{t.automatic}</option><option value="manual">{t.manual}</option></select></label>
          {settings.axisMode==='manual'&&<>{['x','y'].map(axis=><div key={axis} className="trial-pair">{['Min','Max'].map(bound=><label key={bound} className="trial-field">{axis} · {bound==='Min'?t.minimum:t.maximum}<input type="number" step="any" value={settings[axis+bound]} onChange={e=>update(axis+bound,e.target.value)}/></label>)}</div>)}</>}
        </>}
        {tab==='export'&&<>
          <h3>{t.export}</h3><p>{t.exportHint}</p>
          <h4>{t.dimensions}</h4><div className="trial-pair">
            <label className="trial-field">{t.width}<select value={settings.widthCm} onChange={e=>update('widthCm',Number(e.target.value))}>{[12,16,20,24].map(n=><option key={n}>{n}</option>)}</select></label>
            <label className="trial-field">{t.height}<select value={settings.heightCm} onChange={e=>update('heightCm',Number(e.target.value))}>{[8,10,13,16,18].map(n=><option key={n}>{n}</option>)}</select></label>
          </div>
          <label className="trial-field">{t.resolution}<select value={settings.dpi} onChange={e=>update('dpi',Number(e.target.value))}>{[150,300,600].map(n=><option key={n} value={n}>{n} dpi</option>)}</select></label>
          {figure&&<div className="trial-pixels">PNG · ≈ {figure.size.pngWidth} × {figure.size.pngHeight} px</div>}
          <p>{t.dimensionHint}</p>
          <fieldset disabled={!figure||!rows.length} className="trial-export"><ExportActions language={language} actions={exportData?[...actions,{label:t.csv,icon:<Download size={16}/>,create:()=>exportData(uncertainRows||rows)}]:actions} buttonClass="trial-export-button"/></fieldset>
          <p className="trial-notice">{t.pdfHint}</p>
        </>}
      </div>}
    </aside>
    <section className="trial-graph-section" aria-label={t.preview}>
      <div className="trial-graph-heading"><div><span className="trial-kicker">{t.preview}</span><h2>{title}</h2></div>
        <span className="trial-count">{rows.length.toLocaleString(language)} {t.points}</span></div>
      {layout==='workbench'&&<div className="workbench-quick-tools">{['appearance','export'].map(key=><button type="button" key={key} onClick={()=>{setTab(key);requestAnimationFrame(()=>document.getElementById(`trial-tab-${key}`)?.scrollIntoView({block:'nearest'}));}}>{t[key]}</button>)}</div>}
      <div className="trial-toolbar">
        <div className="trial-segmented">
          <button type="button" aria-pressed={settings.dragMode==='zoom'} onClick={()=>update('dragMode','zoom')}><ZoomIn size={16}/>{t.zoom}</button>
          <button type="button" aria-pressed={settings.dragMode==='pan'} onClick={()=>update('dragMode','pan')}><Move size={16}/>{t.pan}</button>
        </div>
        <button type="button" className="trial-reset" onClick={()=>onRange(null)}><RotateCcw size={15}/>{t.reset}</button>
      </div>
      {rows.length>0&&figure?<PlotPreview theme={theme} figure={figure} text={t} onMeasured={setRenderMs} onPoint={selectPoint} onRange={onRange} selectedIndex={selectedPoint?.index}/>:<p className="trial-error" role="status">{rows.length?t.badRange:language==='es'?'Introduce al menos un par X/Y válido en la tabla.':'Enter at least one valid X/Y pair in the table.'}</p>}
      <div className="trial-caption"><span>{t.previewHint}</span><span>{settings.widthCm} × {settings.heightCm} cm</span></div>
      <div className="trial-point"><span className="trial-kicker">{t.selected}</span>
        {selectedPoint?<strong>{resolved.xLabel}: {number(selectedPoint.x)} · {resolved.yLabel}: {number(selectedPoint.y)}</strong>:<span>{t.inspect}</span>}
      </div>
      {showDiagnostics&&<details className="trial-metrics"><summary>{t.measurements}</summary>
        <dl><dt>{t.renderTime}</dt><dd>{renderMs===null?t.waiting:`${Math.round(renderMs)} ms`}</dd>
          <dt>{t.exportTime}</dt><dd>{exportMs?`${exportMs.format.toUpperCase()} · ${Math.round(exportMs.time)} ms · ${Math.round(exportMs.bytes/1024)} KB`:t.waiting}</dd></dl>
        <p>{t.timingHint}</p>
        <details><summary>{t.settings}</summary><pre>{JSON.stringify({sample,points:rows.length,model,...resolved},null,2)}</pre></details>
      </details>}
    </section>
    <section className="f-worksheet trial-controls" aria-label={t.data}>
      <div className="trial-graph-heading"><div><span className="trial-kicker">02 / {t.data}</span><h2>{layout==='workbench'?t.data:title}</h2></div></div>
      {worksheetControls}
      {renderWorksheet?renderWorksheet({selectedIndex:selectedPoint?.index,onSelect:index=>{const row=rows[index];if(row)selectPoint({x:row.x,y:row.y,index});}}):
        <Worksheet rows={uncertainRows||rows} labels={labels} language={language} selectedIndex={selectedPoint?.index} onSelect={index=>{const row=rows[index];selectPoint({x:row.x,y:row.y,index});}}/>}
      <p className="f-data-note">{notice}</p>
      {worstEnabled&&(dx!==''||dy!=='')&&<p className="f-data-note">{language==='es'?'El gráfico usa las incertidumbres uniformes indicadas en Ajuste; los valores originales de la tabla se conservan.':'The graph uses the uniform uncertainties entered in Fit; original table values are preserved.'}</p>}
    </section>
    <section className="f-result-band" aria-label={t.fit}>
      <div><span>{t.equation}</span><strong>{fit?.text||'—'}</strong></div>
      <div><span>R² / {t.rmse}</span><strong>{fit?`${number(fit.r2)} / ${number(fit.rmse)}`:'—'}</strong></div>
      <div><span>{bounds?.status==='ok'?wt.delta:t.dimensions}</span><strong>{bounds?.status==='ok'?`Δm = ${number(bounds.delta)} ${units.m}`:`${settings.widthCm} × ${settings.heightCm} cm`}</strong></div>
    </section>

  </fieldset>;
}
