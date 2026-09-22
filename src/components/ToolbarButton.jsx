import {createElement, useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, X} from 'lucide-react';

// A normal tap acts immediately. Explanation mode requires a second, explicit action.
export default function ToolbarButton({label, description, icon, onClick, helpMode=false,
  done=false, suggested=false, active=false, blocked=false, reason='', dark=true,
  actionLabel, closeLabel, badgeLabel, nextLabel, ...props}) {
  const [tip,setTip]=useState(null);
  const timer=useRef(null), anchor=useRef(null), popup=useRef(null);
  const id=useId();
  const suppressFocus=useRef(false);
  function restoreFocus() {suppressFocus.current=true;anchor.current?.focus();suppressFocus.current=false;}
  const cancel=()=>clearTimeout(timer.current);
  function show(interactive=false) {
    cancel();
    const rect=anchor.current.getBoundingClientRect();
    setTip({interactive, mode:helpMode,left:Math.max(8,Math.min(rect.left,window.innerWidth-304)),
      top:Math.min(rect.bottom+8,window.innerHeight-180)});
  }
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{
    if(!tip)return;
    const dismiss=event=>{
      if(event.type==='keydown' && event.key!=='Escape')return;
      if(event.type==='pointerdown' && (anchor.current?.contains(event.target) || popup.current?.contains(event.target)))return;
      setTip(null);
      if(event.type==='keydown') {suppressFocus.current=true;anchor.current?.focus();suppressFocus.current=false;}
    };
    document.addEventListener('keydown',dismiss);
    document.addEventListener('pointerdown',dismiss);
    window.addEventListener('resize',dismiss);
    return ()=>{document.removeEventListener('keydown',dismiss);document.removeEventListener('pointerdown',dismiss);window.removeEventListener('resize',dismiss);};
  },[tip]);
  return <>
    <button {...props} ref={anchor} type="button"
      aria-label={`${label}${done && badgeLabel ? `. ${badgeLabel}` : ''}${suggested && nextLabel ? `. ${nextLabel}` : ''}`}
      aria-describedby={tip ? id : undefined} aria-disabled={blocked || undefined}
      onPointerEnter={e=>{if(e.pointerType==='mouse')timer.current=setTimeout(()=>show(),550);}}
      onPointerLeave={()=>{cancel();setTip(value=>value?.interactive?value:null);}}
      onFocus={e=>{if(!suppressFocus.current && e.currentTarget.matches(':focus-visible'))show();}}
      onBlur={e=>{cancel();if(!popup.current?.contains(e.relatedTarget))setTip(null);}}
      onClick={e=>{cancel();if(helpMode || blocked)show(true);else {setTip(null);onClick?.(e);}}}
      className={`toolbar-icon relative inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors ${suggested?'toolbar-next':''} ${tip?'toolbar-help-visible':''} ${active?'bg-cyan-700 text-white border-cyan-600':dark?'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700':'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'} ${blocked?'opacity-50':''}`}>
      {createElement(icon,{size:20,'aria-hidden':true})}
      {done && <Check aria-hidden="true" size={12} className="absolute -top-1 -right-1 rounded-full bg-emerald-700 text-white"/>}
    </button>
    {tip && tip.mode===helpMode && createPortal(<div ref={popup} id={id} role={tip.interactive?'dialog':'tooltip'} aria-label={tip.interactive?label:undefined}
      onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setTip(null);}}
      style={{position:'fixed',left:tip.left,top:Math.max(8,tip.top),width:'min(288px, calc(100vw - 16px))'}}
      className={`z-[200] rounded-xl border p-3 shadow-xl text-sm bg-slate-900 text-slate-100 border-slate-500`}>
      <div className="flex justify-between items-center gap-2"><strong>{label}</strong>{tip.interactive && <button aria-label={closeLabel} onClick={()=>{setTip(null);restoreFocus();}} className="min-h-11 min-w-11 flex items-center justify-center"><X size={16}/></button>}</div>
      <p className="leading-relaxed mt-1">{blocked ? reason : description}</p>
      {done && badgeLabel && <p className="text-xs mt-2">✓ {badgeLabel}</p>}
      {suggested && nextLabel && <p className="text-xs mt-2">{nextLabel}</p>}
      {tip.interactive && !blocked && <button className="mt-3 rounded-lg bg-cyan-700 text-white px-3 py-2 min-h-11" onClick={e=>{setTip(null);onClick?.({...e,currentTarget:anchor.current});}}>{actionLabel || label}</button>}
    </div>,document.body)}
  </>;
}
