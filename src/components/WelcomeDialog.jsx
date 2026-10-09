import {useEffect, useRef, useState} from 'react';
import {Upload, FolderOpen} from 'lucide-react';

const WELCOME_TEXT = {
  en: {title:'Start or continue an experiment', description:'Track motion in a video, or explore spectroscopy and measurements in an image. You can also continue from a saved PhysTracker project.', media:'Open video or image', project:'Open saved project', restored:'Your project is loaded', restoreHelp:'Choose the original video or image to continue. Project files contain your measurements and settings, but don’t include the media.', locate:'Locate original media', restart:'Start a new experiment', warning:'Starting a new experiment replaces the restored work. Download a copy before continuing if you need to keep it.', save:'Download project', proceed:'Start new experiment', back:'Keep restored project'},
  es: {title:'Inicia o continúa un experimento', description:'Estudia el movimiento en un video o explora la espectroscopía y las mediciones en una imagen. También puedes continuar desde un proyecto guardado de PhysTracker.', media:'Abrir video o imagen', project:'Abrir proyecto guardado', restored:'Tu proyecto está cargado', restoreHelp:'Selecciona el video o la imagen original para continuar. Los proyectos contienen las mediciones y los ajustes, pero no incluyen los archivos multimedia.', locate:'Buscar video o imagen original', restart:'Iniciar un nuevo experimento', warning:'Iniciar un nuevo experimento reemplaza el trabajo restaurado. Descarga una copia antes de continuar si necesitas conservarlo.', save:'Descargar proyecto', proceed:'Iniciar nuevo experimento', back:'Conservar proyecto restaurado'},
};

export default function WelcomeDialog({language, dark, restored, error, loading, onMedia, onProject, onSave, onStartNew}) {
  const t=WELCOME_TEXT[language] || WELCOME_TEXT.en;
  const dialog=useRef(null), media=useRef(null), project=useRef(null);
  const [confirmNew,setConfirmNew]=useState(false);
  useEffect(()=>{
    const previous=document.activeElement;
    dialog.current?.focus();
    return ()=>{if(previous?.isConnected && !previous.closest('[inert]'))previous.focus();};
  },[]);
  useEffect(()=>{dialog.current?.focus();},[restored,confirmNew]);
  const secondary=`min-h-11 rounded-xl border px-5 py-3 font-medium ${dark?'border-slate-500 text-slate-100 hover:bg-slate-700':'border-slate-400 text-slate-800 hover:bg-slate-100'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600`;
  const primary='min-h-11 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600';
  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-4">
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="welcome-title" aria-describedby="welcome-description" tabIndex={-1}
      className={`w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-auto rounded-2xl border p-6 sm:p-8 shadow-2xl outline-none ${dark?'bg-slate-800 border-slate-600 text-slate-100':'bg-white border-slate-200 text-slate-900'}`}
      onKeyDown={e=>{
        if(e.key==='Escape'){e.preventDefault();if(confirmNew)setConfirmNew(false);}
        if(e.key!=='Tab')return;
        const buttons=[...dialog.current.querySelectorAll('button:not(:disabled)')];
        const first=buttons[0], last=buttons.at(-1);
        if(e.shiftKey && (document.activeElement===first || document.activeElement===dialog.current)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }}>
      <h1 id="welcome-title" className="text-2xl font-semibold tracking-tight">{confirmNew?t.restart:restored?t.restored:t.title}</h1>
      <p id="welcome-description" className={`mt-4 leading-relaxed ${dark?'text-slate-300':'text-slate-600'}`}>{confirmNew?t.warning:restored?t.restoreHelp:t.description}</p>
      {error && <p role="alert" className={`mt-4 ${dark?'text-red-300':'text-red-700'}`}>{error}</p>}
      {loading && <p role="status" className="mt-4">{language==='es'?'Cargando el video o la imagen…':'Loading your video or image…'}</p>}
      <div className="mt-6 flex flex-col gap-3">
        {confirmNew?<>
          <button className={secondary} onClick={onSave}>{t.save}</button>
          <button className={primary} onClick={()=>{onStartNew();setConfirmNew(false);}}>{t.proceed}</button>
          <button className={secondary} onClick={()=>setConfirmNew(false)}>{t.back}</button>
        </>:<>
          <button className={`${primary} flex items-center justify-center gap-2`} onClick={()=>media.current.click()}><Upload size={20} aria-hidden="true"/>{restored?t.locate:t.media}</button>
          <button className={`${secondary} flex items-center justify-center gap-2`} onClick={()=>project.current.click()}><FolderOpen size={20} aria-hidden="true"/>{t.project}</button>
          {restored && <button className={`min-h-11 underline ${dark?'text-slate-300':'text-slate-600'}`} onClick={()=>setConfirmNew(true)}>{t.restart}</button>}
        </>}
      </div>
      <input ref={media} type="file" accept="video/*,image/*" className="hidden" onChange={e=>{onMedia(e);e.target.value='';}}/>
      <input ref={project} type="file" accept=".json" className="hidden" onChange={onProject}/>
    </section>
  </div>;
}
