import {useMemo,useState} from 'react';
import {axisUnit,parameterUnits} from '../../utils/analysisPresentation.js';
import {spectralRows,validCalibration} from '../../utils/spectroscopy.js';
import GraphWorkspace from './GraphWorkspace.jsx';
import {motionRows,spectrumRows,plottedCSV} from './liveData.js';
import {REFERENCE_EMISSION_LINES} from './spectralReferences.js';
import {LIVE_TEXT} from './liveText.js';
import './trial.css';

export default function NewGraphing({language,positionData,velocityData,activeObject,color,pixelsPerMeter,spectralData,lineProfile,calibration,initial}) {
  const t=LIVE_TEXT[language]||LIVE_TEXT.en;
  const [model,setModel]=useState(initial.model);
  const [mode,setMode]=useState(initial.mode==='spectroscopy'?'spectrum':'motion');
  const [x,setX]=useState(initial.x),[y,setY]=useState(initial.y);
  const [start,setStart]=useState(initial.start),[end,setEnd]=useState(initial.end);
  const [spectralMode,setSpectralMode]=useState(initial.spectralMode);
  const [channel,setChannel]=useState(lineProfile?.channel||'luma'),[rgb,setRGB]=useState(false);
  const [references,setReferences]=useState({h2:false,he:false,hg:false}),[busy,setBusy]=useState(false);
  const spectrum=useMemo(()=>spectralRows(spectralData,lineProfile,calibration,spectralMode,pixelsPerMeter),[spectralData,lineProfile,calibration,spectralMode,pixelsPerMeter]);
  const rows=useMemo(()=>mode==='spectrum'?spectrumRows(spectrum.rows,channel):motionRows(positionData,velocityData,x,y,start,end),[mode,spectrum,channel,positionData,velocityData,x,y,start,end]);
  const axisLabel=key=>`${t[key]} (${axisUnit(key,!!pixelsPerMeter)})`;
  const labels=mode==='spectrum'?{x:t[spectrum.mode],y:t.intensity}:{x:axisLabel(x),y:axisLabel(y)};
  const title=mode==='spectrum'?`${t.spectrum} · ${t[channel]}`:`${t.object} ${activeObject} · ${t[y]} / ${t[x]}`;
  const extras=useMemo(()=>{
    if(mode!=='spectrum')return {dataName:`${t.object} ${activeObject}`,note:t.sampleNote};
    const traces=rgb?['red','green','blue'].map((component,i)=>{
      const values=spectrumRows(spectrum.rows,component);
      return {type:'scatter',mode:'lines',name:t[component],x:values.map(row=>row.x),y:values.map(row=>row.y),
        line:{color:['#dc2626','#15803d','#2563eb'][i],width:1},cliponaxis:true,hoverinfo:'skip'};
    }):[];
    const selected=spectrum.mode==='wavelength'?REFERENCE_EMISSION_LINES.filter(line=>references[line.element]):[];
    const min=rows.length?Math.min(...rows.map(row=>row.x)):0,max=rows.length?Math.max(...rows.map(row=>row.x)):0;
    return {dataName:t[channel],note:t.spectrumNote,traces,
      shapes:selected.filter(line=>line.wl>=min&&line.wl<=max).map(line=>({type:'line',xref:'x',yref:'paper',x0:line.wl,x1:line.wl,y0:0,y1:1,line:{color:line.color,width:1,dash:'dot'}})),
      annotations:selected.filter(line=>line.wl>=min&&line.wl<=max).map(line=>({text:line.label,x:line.wl,y:1,xref:'x',yref:'paper',showarrow:false,textangle:-90,xanchor:'right',yanchor:'top',font:{size:10,color:line.color}}))};
  },[mode,t,activeObject,rgb,spectrum,channel,references,rows]);
  const keys=['time','x','y','vx','vy','ax','ay'];
  const axisSelect=(key,value,change)=><label className="trial-field">{t[key]}<select value={value} onChange={event=>change(event.target.value)}>{keys.map(axis=><option key={axis} value={axis}>{axisLabel(axis)}</option>)}</select></label>;
  return <div className="graphing-trial live-graphing" lang={language}>
    <fieldset disabled={busy} className="live-source">
      <legend className="trial-sr-only">{t.source}</legend>
      <label className="trial-field">{t.source}<select value={mode} onChange={event=>setMode(event.target.value)}><option value="motion">{t.motion} · {activeObject}</option><option value="spectrum">{t.spectrum}</option></select></label>
      {mode==='motion'?<>
        {axisSelect('horizontal',x,setX)}{axisSelect('vertical',y,setY)}
        <label className="trial-field">{t.start}<input type="number" step="any" value={start} onChange={event=>setStart(event.target.value)}/></label>
        <label className="trial-field">{t.end}<input type="number" step="any" value={end} onChange={event=>setEnd(event.target.value)}/></label>
        <button type="button" className="trial-reset" onClick={()=>{setStart('');setEnd('');}}>{t.all}</button>
      </>:<>
        <label className="trial-field">{t.spectralAxis}<select value={spectrum.mode} onChange={event=>setSpectralMode(event.target.value)}>
          <option value="pixels">{t.pixels}</option><option value="distance" disabled={!pixelsPerMeter}>{t.distance}</option><option value="wavelength" disabled={!validCalibration(calibration,lineProfile)}>{t.wavelength}</option>
        </select></label>
        <label className="trial-field">{t.channel}<select value={channel} onChange={event=>setChannel(event.target.value)}>{['luma','red','green','blue'].map(key=><option key={key} value={key}>{t[key]}</option>)}</select></label>
        <label className="trial-toggle">{t.rgb}<input type="checkbox" checked={rgb} onChange={event=>setRGB(event.target.checked)}/></label>
        <fieldset className="live-references" disabled={spectrum.mode!=='wavelength'}><legend>{t.references}</legend>{['h2','he','hg'].map(key=><label className="trial-toggle" key={key}>{t[key]}<input type="checkbox" checked={references[key]} onChange={event=>setReferences({...references,[key]:event.target.checked})}/></label>)}</fieldset>
      </>}
    </fieldset>
    {rows.length>0?<GraphWorkspace key={`${mode}:${x}:${y}:${start}:${end}:${channel}:${spectrum.mode}:${!!pixelsPerMeter}`}
      sample={mode} language={language} onBusy={setBusy} rows={rows} initialModel={mode==='spectrum'?'none':model} onModelChange={setModel}
      labels={labels} title={title} description={mode==='spectrum'?t.spectrumHelp:[x,y].some(axis=>axis==='ax'||axis==='ay')?t.accelerationHelp:t.motionHelp}
      notice={t.sourceNotice} textOverrides={t} unitsForFit={model=>parameterUnits(model,x,y,!!pixelsPerMeter)} initialColor={color}
      figureExtras={extras} exportData={exportRows=>({blob:new Blob([plottedCSV(exportRows,labels)],{type:'text/csv;charset=utf-8'}),fileName:`phystracker-${mode}-${activeObject}.csv`})}/>
      :<p role="status" className="live-empty">{mode==='spectrum'?t.emptySpectrum:t.empty}</p>}
  </div>;
}
