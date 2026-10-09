import RangeControl from './RangeControl';
import {useId} from 'react';
import {ChevronRight, Play, Pause, StepForward} from 'lucide-react';
import {useStore} from '../store/useStore';
import {TRANSLATIONS} from '../utils/translations';
import {DETAIL_OPTIONS} from '../utils/detailTracker';
import TrackingHelp from './TrackingHelp';

const TEXT={
  en:{size:'Template diameter',radius:'Search radius',start:'Start tracking',step:'One frame',sizeHelp:'Area used to recognize the object. Include distinctive edges with little background. Changing diameter captures a new template.'},
  es:{size:'Diámetro de plantilla',radius:'Radio de búsqueda',start:'Iniciar seguimiento',step:'Un fotograma',sizeHelp:'Área usada para reconocer el objeto. Incluye bordes distintivos y poco fondo. Cambiar el diámetro captura una plantilla nueva.'},
};

export default function AutotrackingPanel({tracking}) {
  const language=useStore(s=>s.language), dark=useStore(s=>s.theme==='dark');
  const fine=useStore(s=>s.autoFineOpen);
  const id=useId();
  const t=(TRANSLATIONS[language] || TRANSLATIONS.en).auto;
  const text=TEXT[language] || TEXT.en;
  const {status,options,preview,failure,confidence}=tracking;
  const running=status==='running', busy=running || status==='pausing';
  const modified=['evolution','tether','threshold','predict'].some(key=>options[key]!==DETAIL_OPTIONS[key]);
  const secondary=dark?'border-slate-600 text-slate-200 hover:bg-slate-700':'border-slate-300 text-slate-700 hover:bg-slate-100';
  function slider(key,label,help,min,max,step,divisor=1,unit='px') {
    const value=Math.round(options[key]*divisor);
    return <div key={key}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <TrackingHelp label={label} help={help} inputId={`${id}-${key}`}/>
        <output htmlFor={`${id}-${key}`} className="shrink-0 tabular-nums font-medium">{value} {unit}</output>
      </div>
      <RangeControl id={`${id}-${key}`} type="range" min={min} max={max} step={step} value={value} disabled={busy}
        aria-valuetext={`${value} ${unit}`}

        onChange={event=>tracking.changeOption(key,Number(event.target.value)/divisor)}/>
    </div>;
  }
  return <section aria-label={t.title} className="text-sm space-y-4">
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0"><h3 className="font-semibold">{t.title}</h3><p role="status" className="text-xs mt-1 opacity-80">{t[status]}</p></div>
      {preview && <img src={preview} alt={t.preview} width="40" height="40" style={{imageRendering:'pixelated'}} className="rounded-full border border-cyan-400/50 shrink-0"/>}
    </div>
    {failure && <p role="status" className={`rounded-lg border p-3 text-xs leading-relaxed ${dark?'border-amber-400/40 text-amber-200':'border-amber-600/40 text-amber-900'}`}>{t[`failure_${failure}`]}</p>}
    {slider('size',text.size,text.sizeHelp,11,61,2)}
    {slider('radius',text.radius,t.radiusHelp,10,100,5)}
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={status!=='ready' && !running} onClick={running?tracking.pause:tracking.run}
          className="min-h-11 rounded-lg px-3 flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold disabled:opacity-40">
          {busy?<Pause size={16} aria-hidden="true"/>:<Play size={16} aria-hidden="true"/>}{busy?t.pause:text.start}
        </button>
        <button type="button" disabled={status!=='ready'} onClick={tracking.step} className={`min-h-11 rounded-lg border px-3 text-xs flex items-center gap-2 disabled:opacity-40 ${secondary}`}>
          <StepForward size={15} aria-hidden="true"/>{text.step}
        </button>
      </div>
      <button type="button" disabled={busy} onClick={tracking.reselect} className={`min-h-11 mt-1 text-xs rounded px-1 disabled:opacity-40 ${dark?'text-cyan-300':'text-cyan-800'} hover:underline`}>{t.reselect}</button>
    </div>
    <div className={`border-t ${dark?'border-slate-600':'border-slate-300'}`}>
      <button type="button" onClick={()=>useStore.setState({autoFineOpen:!fine})} aria-expanded={fine} aria-controls={`${id}-fine`}
        className="min-h-11 w-full flex items-center gap-2 text-xs font-medium rounded">
        <ChevronRight size={14} aria-hidden="true" className={`tool-chevron ${fine?'rotate-90':''}`}/>{t.fineTuning}
        {modified && <span className="ml-auto rounded bg-cyan-500/10 px-2 py-1 text-xs">{t.modified}</span>}
      </button>
      <div id={`${id}-fine`} aria-hidden={!fine} inert={!fine} className={`tool-accordion ${fine?'is-open':''}`}>
        <div className="min-h-0 overflow-hidden"><div className="space-y-3 pb-2">
          {slider('evolution',t.evolution,t.evolutionHelp,0,50,5,100,'%')}
          {slider('tether',t.tether,t.tetherHelp,0,25,5,100,'%')}
          {slider('threshold',t.threshold,t.thresholdHelp,50,98,1,1,'%')}
          <div className="flex items-center gap-2 text-xs">
            <input id={`${id}-predict`} type="checkbox" className="accent-cyan-500" checked={options.predict} disabled={busy} onChange={e=>tracking.changeOption('predict',e.target.checked)}/>
            <TrackingHelp label={t.predict} help={t.predictHelp} inputId={`${id}-predict`}/>
          </div>
          {Number.isFinite(confidence) && <p className="text-xs opacity-80">{t.matchQuality}: {confidence.toFixed(1)}%</p>}
          <button id={`${id}-restore`} type="button" disabled={busy} onClick={tracking.restoreDefaults} className={`min-h-11 rounded-lg border px-3 text-xs disabled:opacity-40 ${secondary}`}>{t.restoreDefaults}</button>
          <p className="text-xs opacity-70">{t.restoreHelp}</p>
        </div></div>
      </div>
    </div>
  </section>;
}
