import RangeControl from './RangeControl';
import {useShallow} from 'zustand/react/shallow';
import {ChevronRight, Check} from 'lucide-react';
import {useStore} from '../store/useStore';
import {SPECTRUM_TEXT} from '../utils/spectrumText';
import {calibrationFeedback,SPECTRUM_WORKFLOW_TEXT,SPECTRUM_PLACEMENT_TEXT} from '../utils/spectrumWorkflow';
import {dispersionAxis,anchorCalibration,referencePoints,validCalibration} from '../utils/spectroscopy';
import TrackingHelp from './TrackingHelp';

export default function SpectroscopyPanel() {
  const s=useStore(useShallow(state=>Object.fromEntries(['language','theme','lineProfile','wavelengthCalibration','activeClickTarget','videoDims','videoSrc','imageObj','spectralData','showGuidelines','spectralError','spectrumStep','spectrumUsePixels'].map(k=>[k,state[k]]))));
  const t=SPECTRUM_TEXT[s.language] || SPECTRUM_TEXT.en;
  const w=SPECTRUM_WORKFLOW_TEXT[s.language] || SPECTRUM_WORKFLOW_TEXT.en;
  const copy=SPECTRUM_PLACEMENT_TEXT[s.language] || SPECTRUM_PLACEMENT_TEXT.en;
  const store=useStore.getState(), c=s.wavelengthCalibration;
  const valid=validCalibration(c,s.lineProfile), refs=referencePoints(c,s.lineProfile);
  const ready=Boolean((s.imageObj || s.videoSrc) && s.videoDims.w>0);
  const dark=s.theme==='dark';
  const button='rounded-lg border border-slate-500/50 px-3 min-h-11 text-xs disabled:opacity-40 hover:bg-cyan-500/10';
  const primary='rounded-lg bg-cyan-400 text-slate-950 font-semibold px-3 min-h-11 text-xs disabled:opacity-40 hover:bg-cyan-300';
  const input=`w-full rounded-lg border p-2 ${dark?'bg-slate-900 border-slate-600 text-white':'bg-white border-slate-300 text-slate-900'}`;
  function cancel() {useStore.setState({activeClickTarget:null,spectralLineStart:null});}
  function select(target) {
    const value=c?.[`p${target.slice(1)}_wl`];
    if(!Number.isFinite(value) || value<=0)return;
    useStore.setState({isPlaying:false,isTracking:false,isCalibrating:false,isSettingOrigin:false,showInputModal:false,activeClickTarget:target,spectralLineStart:null,analysisChartMode:'spectroscopy'});
  }
  function updateWavelength(index,value) {
    store.setWavelengthCalibration(prev=>({...anchorCalibration(prev,s.lineProfile),coordinateMode:'image',
      [`p${index}_wl`]:value===''?null:Number(value)}));
  }
  const axis=dispersionAxis(c,s.lineProfile), rawAngle=Math.atan2(axis.y,axis.x)*180/Math.PI;
  const guideAngle=rawAngle>90?rawAngle-180:rawAngle< -90?rawAngle+180:rawAngle;
  function updateAngle(value) {
    store.setWavelengthCalibration(prev=>({...anchorCalibration(prev,s.lineProfile),coordinateMode:'image',guideAngleDeg:value}));
  }
  function explore(pixels) {
    useStore.setState({spectrumUsePixels:pixels});store.setSpectrumStep('sample');
  }
  const index=s.activeClickTarget==='r1'?1:s.activeClickTarget==='r2'?2:null;
  const prompt=index?copy.instruction.replace('{n}',index).replace('{value}',c?.[`p${index}_wl`]):null;
  const samplingReady=!!s.lineProfile && s.spectralData.length>=2 && !s.spectralError;
  const useWavelength=valid && !s.spectrumUsePixels;
  const recommended=valid && s.spectrumStep==='calibrate'?'sample':samplingReady && s.spectrumStep==='sample'?'explore':null;
  function step(key,number,done,children) {
    const open=s.spectrumStep===key;
    return <section key={key} className={`border rounded-xl ${dark?'border-slate-600':'border-slate-300'}`}>
      <h3><button type="button" id={`spectrum-${key}-trigger`} aria-expanded={open} aria-controls={`spectrum-${key}-body`} disabled={key==='sample' && !ready}
        onClick={()=>store.setSpectrumStep(key)} className={`w-full min-h-11 flex items-center gap-2 px-3 py-2 text-left rounded-xl ${recommended===key?'spectrum-next':''} ${open?'bg-cyan-500/10':''}`}>
        <span className="w-5 shrink-0">{done?<Check size={15} aria-label={w[key]}/>:number}</span><span className="flex-1 font-semibold">{key==='sample'?copy.adjust:w[key]}</span><ChevronRight size={14} aria-hidden="true" className={`tool-chevron ${open?'rotate-90':''}`}/>
      </button></h3>
      <div id={`spectrum-${key}-body`} role="region" aria-labelledby={`spectrum-${key}-trigger`} aria-hidden={!open} inert={!open} className={`tool-accordion ${open?'is-open':''}`}>
        <div className="min-h-0 overflow-hidden"><div className="p-3 space-y-3">{children}</div></div>
      </div>
    </section>;
  }
  return <section aria-label={t.title} className="text-xs space-y-3">
    {!ready && <p role="status">{t.load}</p>}
    {prompt && <div role="status" className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-3"><p>{prompt}</p><button type="button" className="min-h-11 underline" onClick={cancel}>{t.cancel}</button></div>}
    {s.spectralError && <p role="alert">{t.readError}</p>}
    {step('calibrate',1,valid,<>
      <p>{copy.purpose}</p>
      {[1,2].map(index=><div key={index} className={`rounded-lg border p-2 space-y-2 ${dark?'border-slate-600':'border-slate-300'}`}>
        <label className={`flex items-center gap-2 ${index===1?(dark?'text-cyan-300':'text-cyan-800'):(dark?'text-red-300':'text-red-800')}`}>{t.reference} {index}
          <input aria-label={`${t.reference} ${index} (nm)`} className={`${input} min-w-0 flex-1`} type="number" min="0" step="any" value={c?.[`p${index}_wl`] ?? ''} onChange={e=>{cancel();updateWavelength(index,e.target.value);}}/> nm
        </label>
        <div className="flex flex-wrap items-center gap-2"><button type="button" className={`${button} ${s.activeClickTarget===`r${index}`?(index===1?'bg-cyan-500/20 ring-2 ring-cyan-400':'bg-red-500/20 ring-2 ring-red-400'):''}`} disabled={!ready || !(Number.isFinite(c?.[`p${index}_wl`]) && c[`p${index}_wl`]>0)} aria-pressed={s.activeClickTarget===`r${index}`} onClick={()=>select(`r${index}`)}>{s.activeClickTarget===`r${index}`?copy.locating.replace('{n}',index):refs[index-1]?`${w.reposition} ${index}`:copy.locate.replace('{n}',index)}</button>
          {refs[index-1] && <span>✓ {copy.placed.replace('{n}',index)}</span>}
        </div>
        {!(Number.isFinite(c?.[`p${index}_wl`]) && c[`p${index}_wl`]>0) && <p className="opacity-75">{copy.missing}</p>}
      </div>)}
      <p role="status" className={valid?(dark?'text-cyan-300':'text-cyan-800'):''}>{valid?'✓ ':''}{w[calibrationFeedback(c,s.lineProfile)]}</p>
      <details><summary className="min-h-11 py-3 cursor-pointer font-medium">{w.alignment}</summary>
        <TrackingHelp label={t.tilt} help={t.tiltHelp} inputId="spectrum-tilt"/>
        <span className="float-right tabular-nums">{Math.round(guideAngle*10)/10}°</span>
        <RangeControl id="spectrum-tilt"  type="range" min="-90" max="90" step="0.5" value={guideAngle} onChange={e=>updateAngle(Number(e.target.value))}/>
        <button type="button" className={button} onClick={()=>updateAngle(0)}>{t.vertical}</button>
        <label className="flex gap-2 items-center min-h-11"><input type="checkbox" className="accent-cyan-500" checked={s.showGuidelines} onChange={e=>store.setShowGuidelines(e.target.checked)}/>{t.guides}</label>
      </details>
      {valid && <p role="status">{copy.nextSample}</p>}
      <button type="button" className={`${button} w-full`} onClick={()=>explore(true)}>{copy.skip}</button>
      {c && <button type="button" className="min-h-11 text-red-500 hover:underline" onClick={()=>{cancel();store.setWavelengthCalibration(null);store.setSpectralMode('pixels');}}>{t.reset}</button>}
    </>)}
    {step('sample',2,samplingReady,<>
      <p>{copy.drag}</p>
      {s.lineProfile && <>
        <div><TrackingHelp label={t.width} help={w.widthHelp} inputId="spectrum-width"/>
          <span className="float-right tabular-nums">{s.lineProfile.spread} px</span>
          <RangeControl id="spectrum-width"  type="range" min="1" max="50" value={s.lineProfile.spread} onChange={e=>store.setLineProfile({...s.lineProfile,spread:Number(e.target.value)})}/>
        </div>
        {samplingReady && <p role="status">{copy.nextExplore}</p>}
      </>}
    </>)}
    {step('explore',3,false,<>
      <p className="font-medium">{useWavelength?w.calibrated:valid?w.pixelChoice:w.pixels}</p>
      {!s.lineProfile && <p>{w.needLine}</p>}
      {s.lineProfile && !samplingReady && !s.spectralError && <p role="status">{w.waiting}</p>}
      {valid && s.spectrumUsePixels && <button type="button" className={button} onClick={()=>useStore.setState({spectrumUsePixels:false})}>{w.useWavelength}</button>}
      <button type="button" className={`${primary} w-full`} disabled={!samplingReady} onClick={()=>{
        cancel();store.setSpectralMode(useWavelength?'wavelength':'pixels');store.setAnalysisChartMode('spectroscopy');store.setViewMode('analysis');
      }}>{w.view}</button>
      <button type="button" className={button} onClick={()=>store.setSpectrumStep(s.lineProfile?'calibrate':'sample')}>{w.edit}</button>
    </>)}
  </section>;
}
