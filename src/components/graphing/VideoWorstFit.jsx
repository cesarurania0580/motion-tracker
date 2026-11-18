import {WORST_FIT_TEXT} from './worstFitText.js';
import {formatMeasurement} from '../../utils/measurementUncertainty.js';
export default function VideoWorstFit({language,enabled,onEnabled,dx,dy,onDX,onDY,bounds,fit,units}){
 const t=WORST_FIT_TEXT[language]||WORST_FIT_TEXT.en;
 return <section className="text-sm space-y-3 border-t pt-4"><h4 className="font-semibold">{t.heading}</h4>
 <label className="flex gap-2 min-h-11 items-center"><input type="checkbox" checked={enabled} onChange={e=>onEnabled(e.target.checked)}/>{t.show}</label>
 {enabled&&<><p>{t.hint}</p>{[[t.dx,dx,onDX],[t.dy,dy,onDY]].map(([label,value,set])=><label key={label} className="block">{label}<input type="number" step="any" min="0" value={value} onChange={e=>set(e.target.value)} className="w-full border rounded p-2 min-h-11"/></label>)}
 <p>{t.source}</p>{bounds?.status==='ok'?<><p>{t.min}: {bounds.min.m.toPrecision(5)}</p><p>{t.max}: {bounds.max.m.toPrecision(5)}</p>
 <p>m = {formatMeasurement(fit.params.m,bounds.delta)} {units.m}</p><p>b = {formatMeasurement(fit.params.b,bounds.intercept.delta)} {units.b}</p><p>{t.formula}</p>
 {!bounds.bestAcceptable&&<p role="status">{t.misses}</p>}</>:<p role="status">{t[bounds?.status||'missing']}</p>}</>}
 </section>;
}
