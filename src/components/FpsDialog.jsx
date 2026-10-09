import {useEffect,useRef,useState} from 'react';
import {FPS_CHOICES,effectiveFps,fpsChoice,fpsMismatch,validFps} from '../utils/videoTiming';

const TEXT={
  en:{title:'Check your video’s frame rate',help:'Choose the recording frame rate, or continue with our suggestion.',normal:'Use an original, normal-speed video.',checking:'Reading video timing…',detected:'Suggested for this video:',unknown:'We couldn’t detect the frame rate. 30 FPS is selected as a default.',variable:'This video has a variable frame rate. Accurate analysis currently requires a constant-frame-rate video. Choose another video.',saved:'Saved project frame rate:',mismatch:'The detected frame rate differs from your saved project. Check that you selected the original video.',change:'I want to change the saved FPS. Existing measurement timestamps will remain unchanged; frame stepping will use the new value.',confirm:'Continue',choose:'Choose another video',invalid:'Enter a frame rate greater than 0 and no more than 1000 FPS.'},
  es:{title:'Revisa la frecuencia de tu video',help:'Elige la frecuencia de grabación o continúa con nuestra sugerencia.',normal:'Usa un video original a velocidad normal.',checking:'Leyendo la frecuencia del video…',detected:'Sugerencia para este video:',unknown:'No pudimos detectar la frecuencia. Se seleccionaron 30 FPS como valor predeterminado.',variable:'Este video tiene una frecuencia variable. El análisis preciso requiere actualmente un video con frecuencia constante. Selecciona otro video.',saved:'Frecuencia guardada en el proyecto:',mismatch:'La frecuencia detectada difiere de la del proyecto. Verifica que seleccionaste el video original.',change:'Quiero cambiar los FPS guardados. Los tiempos de las mediciones existentes se conservarán; el avance usará el nuevo valor.',confirm:'Continuar',choose:'Seleccionar otro video',invalid:'Introduce una frecuencia mayor que 0 y no superior a 1000 FPS.'},
};

export default function FpsDialog({language,dark,timing,savedFps,onConfirm,onChoose}) {
  const t=TEXT[language] || TEXT.en;
  const baseline=validFps(savedFps)?savedFps:validFps(timing.fps)?timing.fps:30;
  const [choice,setChoice]=useState(()=>fpsChoice(baseline));
  const [custom,setCustom]=useState(baseline);
  const value=effectiveFps(choice,baseline,custom);
  const [allowChange,setAllowChange]=useState(false);
  const ref=useRef(null),input=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  const changing=savedFps!=null && fpsMismatch(value,savedFps);
  const blocked=timing.status==='checking';
  const valid=validFps(value);
  return <div className="fixed inset-0 z-[200] bg-slate-950/55 flex items-center justify-center p-4">
    <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="fps-title" aria-describedby="fps-help"
      className={`max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-auto border rounded-2xl p-6 sm:p-8 shadow-2xl outline-none ${dark?'bg-slate-800 border-slate-600 text-slate-100':'bg-white border-slate-200 text-slate-900'}`}
      onKeyDown={e=>{
        if(e.key==='Escape')e.preventDefault();
        if(e.key!=='Tab')return;
        const controls=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="file"])')];
        const first=controls[0],last=controls.at(-1);
        if(e.shiftKey && (document.activeElement===first || document.activeElement===ref.current)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }}>
      <h1 id="fps-title" className="text-2xl font-semibold">{t.title}</h1>
      <p id="fps-help" className="mt-3">{t.help}</p>

      <p role="status" className="mt-5">{blocked?t.checking:savedFps!=null?(language==='es'?'Se usará la frecuencia guardada en tu proyecto.':'Using your saved project’s timing.'):validFps(timing.fps)?`${t.detected} ${fpsChoice(timing.fps)==='other'?Number(timing.fps.toFixed(3)):fpsChoice(timing.fps)} FPS`:t.unknown}</p>
      {savedFps!=null && validFps(timing.fps) && (fpsChoice(savedFps)!==fpsChoice(timing.fps) || (fpsChoice(savedFps)==='other' && fpsMismatch(savedFps,timing.fps))) && <p className={`mt-3 ${dark?'text-amber-200':'text-amber-800'}`}>{t.mismatch}</p>}
      {!blocked && <div role="group" aria-label="FPS" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        {FPS_CHOICES.map(rate=><button key={rate} type="button" aria-pressed={choice===rate} onClick={()=>{setChoice(rate);setAllowChange(false);}}
          className={`min-h-12 rounded-lg border px-2 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${choice===rate?'bg-cyan-400 border-cyan-400 text-slate-950':dark?'border-slate-500 hover:bg-slate-700':'border-slate-400 hover:bg-slate-100'}`}>{rate} FPS{choice===rate?' ✓':''}</button>)}
      </div>}
      {!blocked && <button type="button" aria-expanded={choice==='other'} onClick={()=>{setChoice('other');setAllowChange(false);}} className="min-h-11 mt-2 underline focus-visible:outline-cyan-600">{language==='es'?'Otra frecuencia':'Other frame rate'}</button>}
      {!blocked && choice==='other' && <label className="block mt-2">FPS
        <input type="number" min="0.001" max="1000" step="any" value={custom} onChange={e=>{setCustom(e.target.value);setAllowChange(false);}}
          aria-invalid={!valid} aria-describedby={!valid?'fps-invalid':undefined}
          className={`block mt-2 min-h-11 w-full rounded-lg border px-3 focus:outline-cyan-600 ${dark?'bg-slate-900 border-slate-500':'bg-white border-slate-400'}`}/>
      </label>}
      {!blocked && !valid && <p id="fps-invalid" className="mt-2 text-sm">{t.invalid}</p>}
      {changing && <label className="flex items-start gap-3 mt-4 text-sm"><input type="checkbox" checked={allowChange} onChange={e=>setAllowChange(e.target.checked)} className="mt-1 accent-cyan-600"/>{t.change}</label>}
      <div className="mt-6 flex flex-col gap-3">
        <button disabled={blocked || !valid || (changing && !allowChange)} onClick={()=>onConfirm(Number(value))} className="min-h-11 rounded-xl px-5 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">{t.confirm}</button>
        <button onClick={()=>input.current.click()} className="min-h-11 border border-slate-400 rounded-xl px-5 py-3 focus-visible:outline-cyan-600">{t.choose}</button>
      </div>
      <input ref={input} type="file" accept="video/*" className="hidden" onChange={e=>{onChoose(e);e.target.value='';}}/>
    </section>
  </div>;
}
