import {useState} from 'react';
import {TRANSFORMS,repeatedMeasurement} from './studentAnalysis.js';
export default function StudentTools({language,operations,onOperations,onRepeat}){
 const es=language==='es';
 const [values,setValues]=useState(''),[x,setX]=useState(''),[dx,setDX]=useState(''),[floor,setFloor]=useState(''),[error,setError]=useState(false);
 const names=es?['Original','Cuadrado','Recíproco','Raíz cuadrada','Logaritmo natural']:['Original','Square','Reciprocal','Square root','Natural logarithm'];
 function add(){try{
  const tokens=values.trim().split(/[\s,;]+/);
  if(!x.trim()||!Number.isFinite(Number(x))||!floor.trim()||(dx!==''&&(!Number.isFinite(Number(dx))||Number(dx)<0))||!values.trim()||tokens.length>100)throw Error();
  const result=repeatedMeasurement(tokens.map(Number),Number(floor));
  onRepeat({x:String(Number(x)),y:String(result.mean),xError:dx,error:String(result.error),note:JSON.stringify({repeatY:result.values,instrument:result.instrument,halfRange:result.halfRange})});setError(false);setValues('');
 }catch{setError(true);}}
 return <details className="standalone-paste"><summary>{es?'Transformaciones y mediciones repetidas':'Transformations & repeated measurements'}</summary>
 <p>{es?'La tabla conserva los datos originales. El gráfico y su CSV usan las transformaciones. Vuelve a Original para deshacer. Para ln, introduce valores adimensionales; revisa las unidades tras transformar.':'The table keeps original data. The graph and its CSV use the transformations. Choose Original to undo. For ln, enter dimensionless values; review units after transforming.'}</p>
 <div className="trial-pair">{['x','y'].map(axis=><label className="trial-field" key={axis}>{axis.toUpperCase()}<select value={operations[axis]} onChange={e=>onOperations({...operations,[axis]:e.target.value})}>{TRANSFORMS.map((key,i)=><option key={key} value={key}>{names[i]}</option>)}</select></label>)}</div>
 <p>{es?'Las barras transformadas son límites simétricos conservadores calculados con los extremos del intervalo.':'Transformed bars are conservative symmetric bounds calculated from interval endpoints.'}</p>
 <h4>{es?'Resumen de Y repetidas':'Repeated Y summary'}</h4>
 <p>{es?'Añade una fila con la media y ΔY = máx(semirango, incertidumbre instrumental). Los valores originales se guardan en la nota de la fila.':'Add a row with the mean and ΔY = max(half-range, instrument uncertainty). Original repeats are saved in the row note.'}</p>
 <div className="trial-pair">{[[es?'Valor X':'X value',x,setX],['±ΔX',dx,setDX],[es?'Incertidumbre instrumental Y':'Y instrument uncertainty',floor,setFloor]].map(([label,value,set])=><label key={label} className="trial-field">{label}<input type="number" step="any" value={value} onChange={e=>set(e.target.value)}/></label>)}</div>
 <label className="trial-field">{es?'Valores Y (2–100, separados por espacio o coma)':'Y values (2–100, separated by spaces or commas)'}<textarea value={values} maxLength={1800} onChange={e=>setValues(e.target.value)}/></label>
 <button type="button" onClick={add}>{es?'Añadir media e incertidumbre':'Add mean and uncertainty'}</button>
 {error&&<p role="alert">{es?'Introduce X, al menos dos Y finitas e incertidumbres no negativas.':'Enter X, at least two finite Y values and nonnegative uncertainties.'}</p>}
 </details>;
}
