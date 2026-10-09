import {useEffect, useId, useRef, useState} from 'react';
import {Check, ChevronDown, Target} from 'lucide-react';
import {useStore} from '../store/useStore';
import {TRANSLATIONS} from '../utils/translations';

export default function TrackingModeMenu({tracking, renderTrigger}) {
  const language=useStore(s=>s.language);
  const theme=useStore(s=>s.theme);
  const activeObjId=useStore(s=>s.activeObjId);
  const videoSrc=useStore(s=>s.videoSrc);
  const fpsConfirmed=useStore(s=>s.fpsConfirmed);
  const isTracking=useStore(s=>s.isTracking);
  const [open,setOpen]=useState(false);
  const container=useRef(null);
  const trigger=useRef(null);
  const menu=useRef(null);
  const pointerInteraction=useRef(false);
  const menuId=useId();
  const t=(TRANSLATIONS[language] || TRANSLATIONS.en).auto;
  const mode=tracking.enabled?'automatic':isTracking?'manual':'off';
  const imageSrc=useStore(s=>s.imageSrc);
  const disabled=activeObjId==='COM' || (!videoSrc && !imageSrc) || (!!videoSrc && !fpsConfirmed);
  const isDark=theme==='dark';
  const label=`${t.chooseMode}: ${t[mode]}`;

  useEffect(()=>{
    if(!open)return;
    pointerInteraction.current=false;
    const outside=event=>{
      if(!container.current?.contains(event.target))setOpen(false);
    };
    document.addEventListener('pointerdown',outside);
    const keyboard=event=>{
      pointerInteraction.current=false;
      if(event.key==='Escape') {
        event.preventDefault();setOpen(false);
        (trigger.current ?? container.current?.querySelector('button'))?.focus();
      } else if(event.key==='Tab' && !container.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown',keyboard,true);
    const selected=menu.current?.querySelector('button[aria-checked="true"]:not(:disabled)');
    (selected ?? menu.current?.querySelector('button:not(:disabled)'))?.focus();
    return ()=>{
      document.removeEventListener('pointerdown',outside);
      document.removeEventListener('keydown',keyboard,true);
    };
  },[open]);

  function choose(next) {
    const store=useStore.getState();
    if(store.activeObjId==='COM')return;
    if(next!=='off' && store.videoSrc && !store.fpsConfirmed)return;
    if(next==='automatic') {
      if(!store.videoSrc)return;
      if(!tracking.enabled)tracking.toggle();
      store.navigateSidebar('controls','automatic');
    } else {
      if(tracking.enabled)tracking.toggle();
      store.setIsTracking(next==='manual');
      store.navigateSidebar('controls','root');
      if(next==='manual'){
        store.setIsSettingOrigin(false);
        store.setIsCalibrating(false);
        store.setShowInputModal(false);
        store.setActiveClickTarget(null);
      }
    }
    if(next==='manual' || next==='automatic')store.navigateSidebar('data','root');
    setOpen(false);
    (trigger.current ?? container.current?.querySelector('button'))?.focus();
  }

  function handleKeys(event) {
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();
    const buttons=Array.from(menu.current.querySelectorAll('button:not(:disabled)'));
    const index=buttons.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
      (index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
    buttons[next]?.focus();
  }

  function focusPointerItem(event) {
    const item=event.target.closest('button');
    if(item && !item.disabled && document.activeElement!==item)item.focus({preventScroll:true});
  }

  const itemClass='flex w-full items-center justify-between gap-4 rounded px-3 py-2 text-left text-sm outline-none focus:bg-cyan-700 focus:text-white disabled:opacity-40 disabled:cursor-not-allowed';
  return <div ref={container} className="relative"
    onPointerDownCapture={()=>{pointerInteraction.current=true;}}
    onBlur={event=>{
    // Safari can drop focus during an internal press before delivering click.
    // Keep its target mounted; outside presses and keyboard departure dismiss.
    if(!pointerInteraction.current && !event.currentTarget.contains(event.relatedTarget))setOpen(false);
  }}>
    {renderTrigger ? renderTrigger({label, disabled, open, toggle:()=>setOpen(value=>!value), mode}) : (
<button id="tracking-mode-trigger" ref={trigger} type="button" disabled={disabled} title={label} aria-label={label}
      aria-haspopup="menu" aria-expanded={open && !disabled} aria-controls={open && !disabled?menuId:undefined}
      onClick={()=>setOpen(value=>!value)}
      onKeyDown={event=>{if(event.key==='ArrowDown' || event.key==='ArrowUp'){event.preventDefault();setOpen(true);}}}
      className={`flex items-center gap-1 rounded px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${mode==='automatic'?'bg-cyan-700 text-white':mode==='manual'?'bg-red-600 text-white':isDark?'bg-slate-700 text-white':'bg-slate-100 text-slate-900'}`}>
      <Target size={20} aria-hidden="true" /><ChevronDown size={12} aria-hidden="true" />
    </button>
    )}
    {open && !disabled && <div ref={menu} id={menuId} role="menu" aria-label={t.chooseMode}
      onKeyDown={handleKeys} onPointerMove={focusPointerItem}
      className={`absolute right-0 top-full mt-2 w-64 rounded-xl border p-1 shadow-xl z-[110] bg-slate-900 border-slate-500 text-slate-100`}>
      <button type="button" role="menuitemradio" aria-checked={mode==='manual'} className={itemClass} onClick={()=>choose('manual')}>
        {t.manual}{mode==='manual' && <Check size={16} aria-hidden="true" />}
      </button>
      <button type="button" role="menuitemradio" aria-checked={mode==='automatic'} disabled={!videoSrc} className={itemClass} onClick={()=>choose('automatic')}>
        {t.automatic}{mode==='automatic' && <Check size={16} aria-hidden="true" />}
      </button>
      {!videoSrc && <p className="px-3 py-1 text-xs opacity-70">{t.requiresVideo}</p>}
      {mode!=='off' && <>
        <div role="separator" className="my-1 border-t border-slate-500/30" />
        <button type="button" role="menuitem" className={itemClass} onClick={()=>choose('off')}>{t.stop}</button>
      </>}
    </div>}
  </div>;
}
