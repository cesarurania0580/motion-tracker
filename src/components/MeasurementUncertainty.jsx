import {useStore} from '../store/useStore.js';
import {scaleBudget} from '../utils/measurementUncertainty.js';
export default function MeasurementUncertainty(){
 const language=useStore(s=>s.language),budget=useStore(s=>s.measurementBudget),setBudget=useStore(s=>s.setMeasurementBudget);
 const ppm=useStore(s=>s.pixelsPerMeter),points=useStore(s=>s.calibrationPoints);
 const es=language==='es',scale=scaleBudget(ppm,points,budget);
 const fields=es?{length:'± Longitud de referencia (m)',endpoint:'± Cada extremo de escala (px)',time:'± Marca de tiempo (s)'}:{length:'± Reference length (m)',endpoint:'± Each scale endpoint (px)',time:'± Timestamp (s)'};
 return <details className="mt-3 text-xs"><summary className="min-h-11 cursor-pointer">{es?'Presupuesto de incertidumbre':'Uncertainty budget'}</summary>
 <p className="mb-3">{es?'Estima la localización seleccionando varias veces el centro en un fotograma; considera desenfoque y resolución. El valor inicial de 10 px no es una precisión medida.':'Estimate point location by selecting the centre repeatedly in one frame; consider blur and resolution. The initial 10 px is not measured accuracy.'}</p>
 {Object.entries(fields).map(([key,label])=><label key={key} className="block mb-3">{label}<input type="number" min="0" step="any" value={budget[key]} onChange={e=>setBudget({...budget,[key]:e.target.value})} className="block w-full min-h-11 rounded border p-2 bg-transparent"/></label>)}
 <p>{es?'Vacío = no estimado; 0 = supuesto exacto. La incertidumbre temporal no se deduce automáticamente de FPS.':'Blank = not estimated; 0 = assumed exact. Timing uncertainty is not automatically inferred from FPS.'}</p>
 {ppm>0&&<p className="my-2">{es?'Escala relativa':'Relative scale'}: ±{(100*scale.relative).toPrecision(3)}% · {scale.complete?(es?'estimada':'estimated'):(es?'estimación parcial':'partial estimate')}</p>}
 <p>{es?'Primer orden conservador: Δs/s = ΔL/L + 2Δp/D. Las barras de posición incluyen solo los términos introducidos. Origen y orientación se tratan como fijos; evalúa paralaje, distorsión, sesgo de seguimiento y masas del centro de masa por separado. Las barras de velocidad requieren escala y tiempo estimados.':'Conservative first order: Δs/s = ΔL/L + 2Δp/D. Position bars include only entered terms. Origin and orientation are treated as fixed; assess parallax, distortion, tracking bias and centre-of-mass masses separately. Velocity bars require estimated scale and timing.'}</p>
 </details>;
}
