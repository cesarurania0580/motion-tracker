import RangeControl from './RangeControl';
import {fpsChoice} from '../utils/videoTiming';
import {IMAGE_TEXT} from '../utils/imageWorkspace';
import SpectroscopyPanel from './SpectroscopyPanel';
import AutotrackingPanel from './AutotrackingPanel';
import React, {useRef} from 'react';
import {SIDEBAR_TEXT} from '../utils/sidebarText';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import {
  Trash2, Clock, CircleDashed, Ruler, Table,
  Activity, Download, SlidersHorizontal, ChevronRight, ArrowLeft, Wrench, Pause
} from 'lucide-react';

function ToolAccordion({id, title, icon, open, onToggle, buttonClass, children}) {
  return <section>
    <h2><button type="button" id={`${id}-trigger`} aria-expanded={open} aria-controls={`${id}-content`}
      onClick={onToggle} className={`w-full min-h-11 rounded-lg border p-3 flex items-center gap-3 text-left text-sm ${buttonClass}`}>
      {icon}<span className="flex-1">{title}</span>
      <ChevronRight size={16} aria-hidden="true" className={`tool-chevron ${open?'rotate-90':''}`}/>
    </button></h2>
    <div id={`${id}-content`} role="region" aria-labelledby={`${id}-trigger`} aria-hidden={!open} inert={!open}
      className={`tool-accordion ${open?'is-open':''}`}>
      <div className="min-h-0 overflow-hidden"><div className="flex flex-col gap-3 px-1 pt-4 pb-2">{children}</div></div>
    </div>
  </section>;
}

export default function Sidebar({
  autotracking,
  pointReview,
  positionData,
  uncertaintyMeters,
  downloadCSV,
  points,
}) {
  const imageSrc=useStore(s=>s.imageSrc);
  const imageTask=useStore(s=>s.imageTask);
  const imageText=IMAGE_TEXT[useStore(s=>s.language)] || IMAGE_TEXT.en;
  const isTracking = useStore(s=>s.isTracking);
  const tab = useStore(s=>s.sidebarTab);
  const views = useStore(s=>s.sidebarViews);
  const navigate = useStore(s=>s.navigateSidebar);
  const videoSrc = useStore(s=>s.videoSrc);
  const tabRefs = useRef({});
  const fpsConfirmed = useStore(s=>s.fpsConfirmed);
  const fps = useStore(state=>state.fps);
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const activeObjId = useStore((state) => state.activeObjId);
  const origin = useStore((state) => state.origin);
  const objects = useStore((state) => state.objects);
  const pixelsPerMeter = useStore((state) => state.pixelsPerMeter);
  const zeroTime = useStore((state) => state.zeroTime);
  const uncertaintyPx = useStore((state) => state.uncertaintyPx);
  const tapeMeasure = useStore((state) => state.tapeMeasure);
  const protractor = useStore((state) => state.protractor);
  const showVelocityVectors = useStore((state) => state.showVelocityVectors);
  const showAccelerationVectors = useStore((state) => state.showAccelerationVectors);
  const vectorScale = useStore((state) => state.vectorScale);
  const lineProfile = useStore((state) => state.lineProfile);
  const videoDims = useStore((state) => state.videoDims);
  const canUndoEdit = useStore(state=>(state.pointEditHistory[state.activeObjId]?.length || 0)>0);
  const mediaReady = useStore(state=>!!(state.imageObj || (state.videoSrc && state.duration>0)) && !state.error);

  const setObjects = useStore((state) => state.setObjects);
  const setPoints = useStore((state) => state.setPoints);
  const setZeroTime = useStore((state) => state.setZeroTime);
  const setUncertaintyPx = useStore((state) => state.setUncertaintyPx);
  const setTapeMeasure = useStore((state) => state.setTapeMeasure);
  const setProtractor = useStore((state) => state.setProtractor);
  const setShowVelocityVectors = useStore((state) => state.setShowVelocityVectors);
  const setShowAccelerationVectors = useStore((state) => state.setShowAccelerationVectors);
  const setVectorScale = useStore((state) => state.setVectorScale);

  const isDark = theme === 'dark';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const labels=SIDEBAR_TEXT[language] || SIDEBAR_TEXT.en;
  const view=views[tab] || 'root';
  const automaticView=tab==='controls' && view==='automatic' && autotracking.enabled;
  const activeTools=[tapeMeasure,protractor,showVelocityVectors,showAccelerationVectors,lineProfile].filter(Boolean).length;
  const go=(nextTab,nextView)=>navigate(nextTab,nextView);
  const entry=(label,nextView,Icon)=> <button type="button" onClick={()=>go(tab,nextView)} className={`w-full min-h-11 rounded-lg border p-3 flex items-center gap-3 text-left text-sm ${styles.buttonSecondary}`}>
    {React.createElement(Icon,{size:18,'aria-hidden':true})}<span className="flex-1">{label}</span><ChevronRight size={16} aria-hidden="true"/>
  </button>;
  const back=(label,nextView='root')=><button type="button" onClick={()=>go(tab,nextView)} className="flex items-center gap-2 min-h-11 text-sm text-cyan-600" aria-label={`${labels.back} ${label}`}><ArrowLeft size={15} aria-hidden="true"/>{label}</button>;

  const toggleTapeMeasure = () => {
    if (tapeMeasure) {
      setTapeMeasure(null);
    } else {
      const w = videoDims.w || 600;
      const h = videoDims.h || 400;
      setTapeMeasure({
        p1: { x: w * 0.4, y: h * 0.5 },
        p2: { x: w * 0.6, y: h * 0.5 }
      });
    }
  };

  const toggleProtractor = () => {
    if (protractor) {
      setProtractor(null);
    } else {
      const w = videoDims.w || 600;
      const h = videoDims.h || 400;
      setProtractor({
        v: { x: w * 0.5, y: h * 0.5 },
        a: { x: w * 0.45, y: h * 0.4 },
        b: { x: w * 0.55, y: h * 0.4 }
      });
    }
  };



  const styles = {
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    panelBgOnly: isDark ? 'bg-slate-800' : 'bg-white',
    panelBorder: isDark ? 'border-slate-700' : 'border-slate-200',
    panelHeader: isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-slate-50 border-slate-200',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    tableHeader: isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700',
    tableRow: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
    tableCell: isDark ? 'text-slate-200' : 'text-slate-800',
    tableDivider: isDark ? 'divide-slate-800' : 'divide-slate-200',
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50'
  };

  if(imageSrc)return <aside aria-label={imageText.workspace} className={`settings-sidebar w-80 xl:w-96 min-h-0 border-l flex flex-col z-20 shrink-0 ${styles.panel} ${styles.text}`}>
    <div className="p-4 overflow-auto space-y-4">
      {imageTask && <button type="button" className="min-h-11 text-sm underline" onClick={()=>{useStore.getState().selectImageTask(null);}}>{imageText.change}</button>}
      {!imageTask ? <>
        <h2 className="font-semibold">{imageText.choose}</h2>
        {!mediaReady && <p role="status">{imageText.loading}</p>}
        {['spectrum','measure'].map(task=><button key={task} type="button" disabled={!mediaReady} className={`w-full text-left rounded-xl border p-4 min-h-11 space-y-2 hover:border-cyan-500 disabled:opacity-40 ${styles.buttonSecondary}`} onClick={()=>{useStore.getState().selectImageTask(task);}}>
          <span className="block font-semibold">{imageText[task]}</span><span className="block text-sm">{imageText[`${task}Help`]}</span>
        </button>)}
      </> : imageTask==='spectrum' ? <SpectroscopyPanel/> : <>
        <h2 className="font-semibold">{imageText.measure}</h2>
        <button type="button" aria-pressed={!!tapeMeasure} className={`w-full min-h-11 rounded-lg border p-3 text-left ${tapeMeasure?'bg-cyan-500/15 border-cyan-500':styles.buttonSecondary}`} onClick={toggleTapeMeasure}>{t.tapeMeasure}</button>
        <p className="text-sm">{imageText.distanceHelp}</p>
        <button type="button" aria-pressed={!!protractor} className={`w-full min-h-11 rounded-lg border p-3 text-left ${protractor?'bg-cyan-500/15 border-cyan-500':styles.buttonSecondary}`} onClick={toggleProtractor}>{t.protractor}</button>
        <p className="text-sm">{imageText.angleHelp}</p>
        <details><summary className="min-h-11 py-3 cursor-pointer">{imageText.coordinates}</summary><p className="text-sm">{imageText.coordinatesHelp}</p></details>
      </>}
    </div>
  </aside>;

  return (
    <aside aria-label={labels.navigation} className={`settings-sidebar w-80 xl:w-96 min-h-0 border-l flex flex-col z-20 shrink-0 ${styles.panel} ${styles.text}`}>
      <div role="tablist" aria-label={labels.navigation} className={`grid grid-cols-3 shrink-0 border-b p-2 gap-1 ${styles.panelBorder}`}>
        {[['controls',SlidersHorizontal],['data',Table],['tools',Wrench]].map(([id,Icon],index,items)=><button key={id} ref={node=>{tabRefs.current[id]=node;}} type="button" role="tab" id={`sidebar-tab-${id}`} aria-controls={`sidebar-panel-${id}`} aria-selected={tab===id} tabIndex={tab===id?0:-1}
          onClick={()=>go(id)} onKeyDown={event=>{
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
            event.preventDefault();
            const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:-1)+3)%3;
            go(items[next][0]);tabRefs.current[items[next][0]]?.focus();
          }} className={`min-h-11 rounded-md flex flex-col items-center justify-center gap-1 text-xs font-semibold ${tab===id?(isDark?'bg-cyan-500/15 text-cyan-300':'bg-cyan-50 text-cyan-800'):'hover:bg-cyan-500/10'}`}>
          <span className="flex items-center gap-1">{React.createElement(Icon,{size:16,'aria-hidden':true})}{id==='tools' && activeTools>0 && <span title={labels.active} aria-label={`${labels.active}: ${activeTools}`} className="text-[10px]">● {activeTools}</span>}</span>{labels[id]}
        </button>)}
      </div>
      {!automaticView && ['running','pausing'].includes(autotracking.status) && <div className={`shrink-0 flex items-center justify-between gap-2 p-3 border-b text-xs ${styles.panelBorder}`} role="status">
        <span>{t.auto[autotracking.status]}</span><button type="button" onClick={autotracking.pause} disabled={autotracking.status==='pausing'} className="flex items-center gap-1 rounded bg-cyan-700 text-white px-3 min-h-11 disabled:opacity-50"><Pause size={14}/>{t.auto.pause}</button>
      </div>}
      <div role="tabpanel" id={`sidebar-panel-${tab}`} aria-labelledby={`sidebar-tab-${tab}`} tabIndex={0} className="sidebar-content min-h-0 flex-1 overflow-auto p-4">
      {tab==='controls' && <div className="flex flex-col gap-3">
        {view==='root' && <>
          {autotracking.enabled ? entry(t.auto.title,'automatic',Activity) : <p className={`text-xs ${styles.textSecondary}`}>{isTracking?labels.manualHelp:labels.empty}</p>}
          {entry(labels.measurement,'measurement',SlidersHorizontal)}
        </>}
        {view==='automatic' && <>
          {back(labels.controls)}
          {autotracking.enabled ? <AutotrackingPanel tracking={autotracking}/> : <p className="text-xs">{labels.empty}</p>}
          {view==='automatic' && entry(labels.measurement,'measurement',SlidersHorizontal)}
        </>}
        {view==='measurement' && <>
          {back(labels.controls)}
          <h2 className="font-semibold text-sm">{labels.measurement} ({activeObjId==='COM'?t.comShort:activeObjId})</h2>
        {videoSrc && <div className={`rounded-lg border p-3 space-y-3 ${fpsConfirmed?styles.panelBorder:isDark?'border-cyan-400/60 bg-cyan-400/10':'border-cyan-600/50 bg-cyan-50'}`}>
          {!fpsConfirmed && <div id="sidebar-fps-help" className="text-xs space-y-1">
            <p className="font-semibold">{labels.fpsFirst}</p><p>{labels.fpsWhy}</p>
          </div>}
          <div className="flex items-center justify-between gap-2 text-xs">
            {t.fpsLabel}
            <span>{fpsChoice(fps)==='other'?Number(fps.toFixed(3)):fpsChoice(fps)} FPS</span>
          </div>
          <button type="button" onClick={()=>useStore.setState({fpsConfirmed:false,isPlaying:false,isTracking:false})} className="min-h-11 rounded bg-cyan-700 text-white px-3 text-xs font-semibold">{language==='es'?'Revisar frecuencia':'Review frame rate'}</button>
          {!fpsConfirmed ? <p className="text-xs">{labels.confirmFps}</p>
            : <p role="status" className="text-xs">✓ {labels.fpsChecked}</p>}
        </div>}
        {/* MASS SETTING */}
        {activeObjId !== 'COM' && (
          <div className="flex items-center justify-between mt-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${styles.textSecondary}`}>{t.massLabel} (kg)</span>
              <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={objects.find(o => o.id === activeObjId)?.mass ?? 1}
                  onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setObjects(prev => prev.map(o => o.id === activeObjId ? { ...o, mass: isNaN(val) ? 0 : val } : o));
                  }}
                  className={`w-20 text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />
          </div>
        )}

        <div className={`border-t pt-3 ${styles.panelBorder}`}>
          <div className={`flex items-center justify-between text-xs mb-1 ${styles.textSecondary}`}>
            <span className="flex items-center gap-1"><CircleDashed size={12}/> {t.blurSize}</span>
            <span>{uncertaintyPx}px</span>
          </div>
          <RangeControl aria-label={t.blurSize} min="0" max="50" value={uncertaintyPx} onChange={(e) => setUncertaintyPx(Number(e.target.value))}  />
        </div>



        <div className="flex flex-col gap-1 border-t pt-3 border-slate-700/20">
          <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}>
            <span>{t.originLabel}: {origin ? `(${Math.round(origin.x)}, ${Math.round(origin.y)})` : t.notSet}</span>
          </div>
          <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}>
            <span>{t.scaleLabel}: {pixelsPerMeter ? `${Math.round(pixelsPerMeter)} px/m` : t.notSet}</span>
          </div>
          <button onClick={() => setZeroTime(!zeroTime)} className={`text-xs flex items-center gap-2 px-2 py-1 rounded border transition ${zeroTime ? 'bg-cyan-500/15 border-cyan-600 text-cyan-600' : styles.buttonSecondary}`} title={zeroTime ? t.timeStart : t.videoTime}>
            <Clock size={12} />
            <span>{zeroTime ? t.timeStart : t.videoTime}</span>
          </button>
        </div>

        </>}
      </div>}
      {tab==='tools' && <div className="flex flex-col gap-3">
        <ToolAccordion id="sidebar-overlays" title={t.overlayTools} icon={<Ruler size={18} aria-hidden="true"/>}
          open={view==='overlays'} onToggle={()=>go('tools',view==='overlays'?'root':'overlays')} buttonClass={styles.buttonSecondary}>
          {/* Row 1: Tape Measure & Protractor Checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input
                type="checkbox"
                checked={!!tapeMeasure}
                onChange={toggleTapeMeasure}
                className="rounded border-slate-600 accent-cyan-600 focus:ring-cyan-600 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.tapeMeasure}</span>
            </label>
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input
                type="checkbox"
                checked={!!protractor}
                onChange={toggleProtractor}
                className="rounded border-slate-600 accent-cyan-600 focus:ring-cyan-600 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.protractor}</span>
            </label>
          </div>

          {/* Row 2: Velocity & Acceleration Vector Checkboxes */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input
                type="checkbox"
                checked={showVelocityVectors}
                onChange={(e) => setShowVelocityVectors(e.target.checked)}
                className="rounded border-slate-600 accent-cyan-600 focus:ring-cyan-600 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.velocityVectors}</span>
            </label>
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input
                type="checkbox"
                checked={showAccelerationVectors}
                onChange={(e) => setShowAccelerationVectors(e.target.checked)}
                className="rounded border-slate-600 accent-cyan-600 focus:ring-cyan-600 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.accelerationVectors}</span>
            </label>
          </div>

          {/* Vector Magnification Scale Slider */}
          {(showVelocityVectors || showAccelerationVectors) && (
            <div className="mt-2">
              <div className={`flex items-center justify-between text-xs mb-1 ${styles.textSecondary}`}>
                <span>{t.vectorScale}</span>
                <span className="font-mono">{vectorScale.toFixed(1)}x</span>
              </div>
              <RangeControl
                aria-label={t.vectorScale}
                min="0.1"
                max="5.0"
                step="0.1"
                value={vectorScale}
                onChange={(e) => setVectorScale(Number(e.target.value))}
                
              />
            </div>
          )}
        </ToolAccordion>
        <ToolAccordion id="sidebar-spectroscopy" title={t.spectroscopyPanel} icon={<Activity size={18} aria-hidden="true"/>}
          open={view==='spectroscopy'} onToggle={()=>go('tools',view==='spectroscopy'?'root':'spectroscopy')} buttonClass={styles.buttonSecondary}>
          <SpectroscopyPanel />
        </ToolAccordion>
      </div>}
      {tab==='data' && <>
      {/* COORDS DATA TABLE */}
      <div className={`px-4 py-3 border-b shrink-0 flex flex-wrap justify-between items-center gap-2 ${styles.panelHeader} ${styles.panelBorder}`}>
        <h2 className={`text-sm font-semibold flex items-center gap-2 ${styles.text}`}>
          <Table size={16} /> {t.dataTable} ({activeObjId === 'COM' ? t.comShort : activeObjId})
        </h2>
        {activeObjId !== 'COM' && (
          <button type="button" disabled={points.length === 0} onClick={() => {
            // Abort before clearing so a pending seek cannot repopulate the table.
            if (autotracking?.enabled) autotracking.reselect();
            setPoints([]);
          }} className={`flex items-center gap-1 text-xs rounded px-2 min-h-11 disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-700 hover:text-red-800'}`}>
            <Trash2 size={14} aria-hidden="true" /> {t.clearObjectData.replace('{object}', activeObjId)}
          </button>
        )}
      </div>
      {activeObjId!=='COM' && (points.length>0 || canUndoEdit) && <div className={`px-4 py-2 border-b text-xs ${styles.panelBorder}`}>
        <p className="mb-2">{t.review.help}</p>
        {pointReview.selection && <>
          <p role="status" className="mb-2">{t.review[pointReview.status]}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button type="button" disabled={pointReview.status!=='ready'} onClick={pointReview.correct} className={`min-h-11 rounded border px-2 disabled:opacity-40 ${styles.buttonSecondary}`}>{t.review.correct}</button>
            <button type="button" disabled={pointReview.status!=='ready'} onClick={pointReview.remove} className="min-h-11 rounded border px-2 text-red-500 disabled:opacity-40">{t.review.remove}</button>
            <button type="button" onClick={pointReview.cancel} className={`min-h-11 rounded border px-2 ${styles.buttonSecondary}`}>{t.cancel}</button>
          </div>
        </>}
        {canUndoEdit && <button type="button" onClick={pointReview.undo} className={`min-h-11 rounded border px-2 disabled:opacity-40 ${styles.buttonSecondary}`}>{t.review.undo}</button>}
      </div>}
      <div className={`min-w-0 ${styles.bg}`}>
          <div className="flex flex-col">
            <div className="min-w-0">
              <table className="w-full text-sm text-left">
                <thead className={`sticky top-0 shadow-md ${styles.tableHeader}`}>
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">{t.time}</th>
                    <th className="p-2">{t.xPos.split(' ')[0]} ({pixelsPerMeter ? 'm' : 'px'}) <span className="font-normal text-xs opacity-70">±{(pixelsPerMeter?uncertaintyMeters:uncertaintyPx).toFixed(3)}</span> </th>
                    <th className="p-2"> {t.yPos.split(' ')[0]} ({pixelsPerMeter ? 'm' : 'px'}) <span className="font-normal text-xs opacity-70">±{(pixelsPerMeter?uncertaintyMeters:uncertaintyPx).toFixed(3)}</span> </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${styles.tableDivider}`}>
                  {positionData.map((p, i) => (
                    <tr key={i} className={`transition ${pointReview.selection?.index===p.sourceIndex?'bg-cyan-500/15':styles.tableRow}`}>
                      <td className={`p-2 ${styles.textSecondary}`}>
                        {activeObjId==='COM'?i+1:<button type="button" disabled={!mediaReady} onClick={()=>pointReview.select(p.sourceIndex)}
                          aria-label={t.review.select.replace('{number}',i+1)} aria-pressed={pointReview.selection?.index===p.sourceIndex}
                          className="min-h-11 min-w-11 rounded border border-cyan-500/40 underline disabled:opacity-40">{i+1}</button>}
                      </td>
                      <td className="p-2 font-mono text-blue-500">{p.time.toFixed(3)}</td>
                      <td className={`p-2 font-mono ${styles.tableCell}`}>{p.x.toFixed(3)}</td>
                      <td className={`p-2 font-mono ${styles.tableCell}`}>{p.y.toFixed(3)}</td>
                    </tr>
                  ))}
                  {points.length === 0 && (
                    <tr>
                      <td colSpan="4" className={`p-8 text-center ${styles.textSecondary}`}>
                        {activeObjId === 'COM' ? t.noDataCOM : `${t.noData} ${activeObjId}`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {points.length > 0 && (
              <div className={`p-4 border-t ${styles.panelBgOnly} ${styles.panelBorder}`}>
                <button onClick={downloadCSV} className="flex items-center gap-2 text-xs border border-cyan-500/40 hover:bg-cyan-500/10 min-h-11 py-2 px-3 rounded">
                  <Download size={18} /> {t.downloadCSV}
                </button>
              </div>
            )}
          </div>
      </div>
      </>}
      </div>
    </aside>
  );
}
