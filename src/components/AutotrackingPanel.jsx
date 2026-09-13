import {useEffect, useRef} from 'react';
import {useStore} from '../store/useStore';
import {TRANSLATIONS} from '../utils/translations';

export default function AutotrackingPanel({tracking}) {
  const panel=useRef(null);
  useEffect(()=>{panel.current?.scrollIntoView({block:'nearest'});},[]);
  const language=useStore(s=>s.language);
  const t=(TRANSLATIONS[language] || TRANSLATIONS.en).auto;
  const {status,options,preview,failure,confidence}=tracking;
  const running=status==='running';
  const busy=running || status==='pausing';
  return <section ref={panel} aria-label={t.title} className="border-y border-cyan-500/30 py-3 text-sm">
    <h3 className="font-semibold mb-2">{t.title}</h3>
    <p role="status" className="mb-3 text-xs leading-relaxed">{t[status]}</p>
    {failure && <p role="status" className="mb-2 text-xs">{t[`failure_${failure}`]}</p>}
    {Number.isFinite(confidence) && <p className="mb-2 text-xs">{t.matchQuality}: {confidence.toFixed(1)}%</p>}
    <div className="flex flex-wrap gap-2">
      <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={status!=='ready'} onClick={tracking.step}>{t.step}</button>
      <button className="rounded bg-cyan-700 text-white px-3 py-1 disabled:opacity-40" disabled={status!=='ready' && !running} onClick={running?tracking.pause:tracking.run}>{busy?t.pause:t.run}</button>
    </div>
    <div className="flex flex-wrap gap-2 mt-2 text-xs">
      <button type="button" disabled={busy} onClick={tracking.reselect} className="rounded border px-2 py-1 disabled:opacity-40">{t.reselect}</button>
      <button type="button" disabled={busy} onClick={tracking.restoreDefaults} className="rounded border px-2 py-1 disabled:opacity-40">{t.restoreDefaults}</button>
    </div>
    <div className="mt-3 text-xs">
      <h4 className="font-medium">{t.settings}</h4>
      <div className="flex flex-col gap-3 py-3">
        {[
          ['size',t.size,11,61,2,1],['radius',t.radius,10,100,5,1],
          ['evolution',t.evolution,0,50,5,100],['tether',t.tether,0,25,5,100],['threshold',t.threshold,50,98,1,1]
        ].map(([key,label,min,max,step,divisor])=><label key={key} className="flex flex-col gap-1">
          {label}: {Math.round(options[key]*divisor)}
          <input type="range" min={min} max={max} step={step} value={options[key]*divisor} disabled={busy}
            onChange={e=>tracking.changeOption(key,Number(e.target.value)/divisor)} />
        </label>)}
        <label className="flex items-center gap-2"><input type="checkbox" checked={options.predict} disabled={busy} onChange={e=>tracking.changeOption('predict',e.target.checked)} /> {t.predict}</label>
        {preview && <img src={preview} alt={t.preview} width="64" height="64" style={{imageRendering:'pixelated',borderRadius:'50%'}} className="border border-cyan-500" />}
      </div>
      <p className="leading-relaxed opacity-80">{t.help}</p>
    </div>
  </section>;
}
