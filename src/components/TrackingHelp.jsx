import {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Info} from 'lucide-react';
import {trackingHelpController as controller} from '../utils/trackingHelpController';

export default function TrackingHelp({label, help, inputId}) {
  const [position,setPosition]=useState(null);
  const anchor=useRef(null), popup=useRef(null), mode=useRef(null), pointerType=useRef('mouse');
  const id=useId();
  function show() {
    const rect=anchor.current.getBoundingClientRect();
    setPosition({left:Math.max(8,Math.min(rect.left,window.innerWidth-296)),top:rect.bottom+6});
  }
  function hide() {mode.current=null;setPosition(null);}
  function open(nextMode,delay=0) {
    controller.enter(id,()=>{mode.current=nextMode;show();},hide,delay);
    mode.current=nextMode;
  }
  function leave() {
    if(mode.current!=='touch' && mode.current!=='keyboard')controller.leave(id);
  }
  // Measure real translated content rather than assuming a fixed popup height.
  useLayoutEffect(()=>{
    if(!position || !popup.current)return;
    const rect=anchor.current.getBoundingClientRect();
    const box=popup.current.getBoundingClientRect();
    const left=rect.left>=box.width+16 ? rect.left-box.width-8 : Math.max(8,Math.min(rect.left,window.innerWidth-box.width-8));
    const preferred=rect.left>=box.width+16 ? rect.top : rect.top-box.height-8;
    const top=Math.max(8,Math.min(preferred>=8?preferred:rect.bottom+8,window.innerHeight-box.height-8));
    if(left!==position.left || top!==position.top)setPosition({left,top});
  },[position]);
  useEffect(()=>{
    function dismiss(event) {
      if(event.type==='keydown') {
        if(event.key==='Escape')controller.dismiss(id);
        return;
      }
      if(event.type==='pointerdown' || event.type==='focusin') {
        if(anchor.current?.contains(event.target) || popup.current?.contains(event.target))return;
      }
      controller.dismiss(id);
    }
    // Listen even while pending, so slider clicks/scrolling cancel delayed openings.
    document.addEventListener('keydown',dismiss);
    document.addEventListener('pointerdown',dismiss);
    document.addEventListener('focusin',dismiss);
    window.addEventListener('resize',dismiss);
    window.addEventListener('scroll',dismiss,true);
    return ()=>{
      controller.dismiss(id);
      document.removeEventListener('keydown',dismiss);document.removeEventListener('pointerdown',dismiss);
      document.removeEventListener('focusin',dismiss);
      window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss,true);
    };
  },[id]);
  return <>
    <span ref={anchor} className="inline-flex items-center gap-1 min-w-0"
      onPointerEnter={event=>{if(event.pointerType==='mouse')open('mouse',400);}}
      onPointerLeave={leave}>
      <label htmlFor={inputId} className="cursor-pointer">{label}</label>
      <button type="button" aria-label={label} aria-expanded={!!position} aria-describedby={position?id:undefined}
        onPointerDown={event=>{pointerType.current=event.pointerType;}}
        onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))open('keyboard');}}
        onBlur={()=>controller.dismiss(id)}
        onClick={event=>{
          if(event.detail===0)open('keyboard');
          else if(pointerType.current==='touch' || pointerType.current==='pen') {
            if(mode.current==='touch')controller.dismiss(id);else open('touch');
          } else open('mouse');
        }}
        className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded text-cyan-600 hover:bg-cyan-500/10">
        <Info size={14} aria-hidden="true"/>
      </button>
    </span>
    {position && createPortal(<div id={id} ref={popup} role="tooltip" style={{position:'fixed',...position,width:'min(288px, calc(100vw - 16px))',maxHeight:'calc(100dvh - 16px)',overflowY:'auto'}}
      onPointerEnter={()=>controller.hold(id)} onPointerLeave={leave}
      className="tracking-help-popup z-[200] rounded-xl border border-slate-500 bg-slate-900 text-slate-100 p-3 shadow-xl text-xs leading-relaxed">
      {help}
    </div>,document.body)}
  </>;
}
