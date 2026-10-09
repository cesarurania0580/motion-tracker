import {IMAGE_TEXT} from '../utils/imageWorkspace';
import {useEffect, useRef, useState} from 'react';
import {useShallow} from 'zustand/react/shallow';
import {Upload, Save, FolderOpen, RefreshCw, Sun, Moon, Languages, Info, Move, Ruler,
  Menu, Users, Activity, Target, Check, CircleHelp, ChartNoAxesCombined} from 'lucide-react';
import TrackingModeMenu from './TrackingModeMenu';
import ToolbarButton from './ToolbarButton';
import {useStore} from '../store/useStore';
import {TRANSLATIONS} from '../utils/translations';
import {GUIDE_TEXT} from '../utils/guideText';
import {workflowReadiness, nextToolbarStep} from '../utils/workflow';

export default function Header({autotracking, handleObjectSwitch, handleOriginButtonClick,
  handleScaleButtonClick, handleFileUpload, saveProject, loadProject, clearProject}) {
  const s=useStore(useShallow(state=>Object.fromEntries([
    'theme','language','viewMode','activeObjId','isSettingOrigin','isCalibrating','origin',
    'pixelsPerMeter','isScaleVisible','hasRestoredData','videoSrc','imageSrc','logoError',
    'fps','fpsConfirmed','saveStatus','videoDims','imageObj','duration','error','lineProfile',
    'spectralData','objects','isTracking','axesConfirmed','wavelengthCalibration',
  ].map(key=>[key,state[key]]))));
  const store=useStore.getState();
  const t=TRANSLATIONS[s.language] || TRANSLATIONS.en;
  const g=GUIDE_TEXT[s.language] || GUIDE_TEXT.en;
  const flow=workflowReadiness(s);
  const hasMedia=!!(s.videoSrc || s.imageSrc);
  const dark=s.theme==='dark';
  const [menu,setMenu]=useState(null), [help,setHelp]=useState(false);
  const container=useRef(null), popup=useRef(null), menuTrigger=useRef(null);
  const mediaInput=useRef(null), projectInput=useRef(null);
  const panel=dark?'bg-slate-800 border-slate-700 text-slate-100':'bg-white border-slate-200 text-slate-900';
  const item='flex items-center gap-3 w-full rounded-lg px-3 py-2 min-h-11 text-left hover:bg-cyan-500/10';
  function openMenu(name,event) {menuTrigger.current=event?.currentTarget;setMenu(value=>value===name?null:name);}
  function closeMenu() {setMenu(null);menuTrigger.current?.focus();}
  function analyze() {store.setAnalysisChartMode(flow.light?'spectroscopy':'kinematics');store.setViewMode('analysis');setMenu(null);}
  useEffect(()=>{
    if(!menu)return;
    popup.current?.querySelector('button,select')?.focus();
    const outside=e=>{if(!popup.current?.contains(e.target) && !menuTrigger.current?.contains(e.target))setMenu(null);};
    document.addEventListener('pointerdown',outside);
    return ()=>document.removeEventListener('pointerdown',outside);
  },[menu]);
  const suggested=nextToolbarStep(s,autotracking.enabled);
  const defaults={helpMode:help,dark,closeLabel:t.close || g.close,badgeLabel:g.complete,nextLabel:g.next};
  const button=(key,Icon,label,description,action,extra={})=><ToolbarButton key={key} {...defaults}
    icon={Icon} label={label} description={description} suggested={suggested===key}
    onClick={e=>{setMenu(null);action(e);}} {...extra}/>;
  const accessibleMenuProps=name=>({'aria-expanded':menu===name,'aria-controls':menu===name?'toolbar-options':undefined});

  return <header ref={container} className={`compact-header relative shrink-0 border-b ${panel}`}
    onKeyDown={e=>{if(e.key==='Escape' && menu){e.preventDefault();closeMenu();}}}>
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        {!s.logoError?<img src={dark?'/logo-dark.png':'/logo-light.png'} alt="PhysTracker" className="h-auto w-40 shrink-0" onError={()=>store.setLogoError(true)}/>:<strong className="text-cyan-500">PhysTracker</strong>}
        <div className={`flex rounded-lg border p-1 ${dark?'bg-slate-900 border-slate-700':'bg-slate-100 border-slate-300'}`}>
          {['tracker','analysis'].map(view=><button key={view} aria-pressed={s.viewMode===view} onClick={()=>{if(view==='analysis' && s.lineProfile)analyze();else store.setViewMode(view);}}
            className={`px-3 min-h-9 rounded text-sm ${s.viewMode===view?(dark?'bg-cyan-500/15 text-cyan-300':'bg-cyan-50 text-cyan-800 shadow-sm'):'opacity-80'}`}>
            {view==='tracker'?(s.imageSrc?(IMAGE_TEXT[s.language] || IMAGE_TEXT.en).workspace:t.trackerMode):t.analysisMode}
          </button>)}
        </div>
        {!s.imageSrc && <div className={`flex rounded-lg border p-1 ${dark?'bg-slate-900 border-slate-700':'bg-slate-100 border-slate-300'}`}>
          {['A','B','COM'].map(id=><button key={id} aria-pressed={s.activeObjId===id} onClick={()=>handleObjectSwitch(id)}
            className={`flex items-center gap-1 px-3 min-h-9 rounded text-sm ${s.activeObjId===id?(id==='A'?'bg-red-500 text-white':id==='B'?'bg-blue-500 text-white':'bg-purple-500 text-white'):'opacity-80'}`}>
            {id==='COM'?<Activity size={14}/>:<Users size={14}/>} {id==='A'?t.objectA:id==='B'?t.objectB:t.comShort}
          </button>)}
        </div>}
      </div>
      <div aria-label={g.title} className="flex flex-wrap items-center gap-1">
        {button('media',Upload,g.media,s.hasRestoredData?g.restore:g.mediaHelp,()=>mediaInput.current.click())}
        {button('scale',Ruler,s.isCalibrating?g.doneDistance:s.pixelsPerMeter?(s.isScaleVisible?t.hideScale:t.showScale):g.scale,g.scaleHelp,()=>{store.setViewMode('tracker');handleScaleButtonClick();},{active:s.isCalibrating,blocked:!flow.ready,reason:g.needMedia})}
        {button('axes',Move,g.axes,g.axesHelp,()=>{store.setViewMode('tracker');handleOriginButtonClick();},{active:s.isSettingOrigin,blocked:!flow.ready,reason:g.needMedia})}
        {!s.imageSrc && <TrackingModeMenu tracking={autotracking} renderTrigger={({label,disabled,open,toggle,mode})=>
          <ToolbarButton {...defaults} id="tracking-mode-trigger" icon={Target} label={label}
            description={g.measureHelp} onClick={()=>{setMenu(null);store.setViewMode('tracker');toggle();}}
            blocked={disabled || !flow.ready} reason={s.activeObjId==='COM'?g.com:g.needMedia}
            suggested={suggested==='track'} active={mode!=='off'}
            aria-haspopup="menu" aria-expanded={open}/>} />}
        {button('options',Menu,t.moreOptions,g.optionsHelp,e=>openMenu('options',e),{...accessibleMenuProps('options'),helpMode:false,active:help})}
      </div>
    </div>
    <input ref={mediaInput} type="file" accept="video/*,image/*" className="hidden" aria-label={g.media} onChange={e=>{handleFileUpload(e);e.target.value='';setMenu(null);}}/>
    <input ref={projectInput} type="file" accept=".json" className="hidden" aria-label={g.project} onChange={e=>{loadProject(e);setMenu(null);}}/>
    {menu && <div ref={popup} id="toolbar-options" role="region" aria-label={menu==='fps'?g.fps:menu==='save'?g.save:menu==='media'?g.media:menu==='object'?g.objectHelp:t.moreOptions}
      className={`absolute right-2 top-full mt-1 z-[130] w-80 max-w-[calc(100vw-16px)] max-h-[70vh] overflow-auto rounded-xl border p-3 shadow-xl bg-slate-900 border-slate-500 text-slate-100`}>
      {menu==='options' && <>
        <p role="status" className="text-xs px-3 pb-2">{g[s.saveStatus] || g.idle}</p>
        <button className={item} onClick={()=>{saveProject();closeMenu();}}><Save size={18} className="text-blue-400 shrink-0"/>{g.saveProject}</button>
        <button className={item} onClick={()=>projectInput.current.click()}><FolderOpen size={18} className="text-green-400 shrink-0"/>{g.project}</button>
        <button className={`${item} disabled:opacity-50`} disabled={!hasMedia || !flow.measured} onClick={analyze}><ChartNoAxesCombined size={18} className="text-blue-400 shrink-0"/>{g.export}</button>
        <button className={item} aria-pressed={help} onClick={()=>{setHelp(!help);closeMenu();}}><CircleHelp size={18} className="text-cyan-400 shrink-0"/>{g.explain}{help && <Check size={16}/>}</button>
        {help && <p className="text-xs px-3 py-2">{g.explainHelp}</p>}
        <button className={item} onClick={()=>{store.setTheme(dark?'light':'dark');closeMenu();}}>{dark?<Sun size={18} className="text-yellow-400 shrink-0"/>:<Moon size={18} className="text-indigo-400 shrink-0"/>} {t.switchTheme}</button>
        <button className={item} onClick={()=>{store.setLanguage(s.language==='en'?'es':'en');closeMenu();}}><Languages size={18} className="text-purple-400 shrink-0"/>{s.language==='en'?'Español':'English'}</button>
        <button className={item} onClick={()=>{store.setShowAboutModal(true);closeMenu();}}><Info size={18} className="text-cyan-400 shrink-0"/>{t.about}</button>
        <button className={`${item} text-red-500`} onClick={()=>{setMenu(null);clearProject();}}><RefreshCw size={18} className="text-red-400 shrink-0"/>{t.resetData}</button>
      </>}
    </div>}
  </header>;
}
