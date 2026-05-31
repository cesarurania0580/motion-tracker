import React from 'react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Trash2, RotateCcw, Clock, CircleDashed, Ruler, Table, 
  Activity, Download 
} from 'lucide-react';

export default function Sidebar({
  positionData,
  uncertaintyMeters,
  resetScale,
  downloadCSV,
  points,
}) {
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const activeObjId = useStore((state) => state.activeObjId);
  const fps = useStore((state) => state.fps);
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
  const wavelengthCalibration = useStore((state) => state.wavelengthCalibration);
  const spectralMode = useStore((state) => state.spectralMode);
  const activeClickTarget = useStore((state) => state.activeClickTarget);
  const showGuidelines = useStore((state) => state.showGuidelines);
  const videoDims = useStore((state) => state.videoDims);

  const setFps = useStore((state) => state.setFps);
  const setObjects = useStore((state) => state.setObjects);
  const setPoints = useStore((state) => state.setPoints);
  const setZeroTime = useStore((state) => state.setZeroTime);
  const setUncertaintyPx = useStore((state) => state.setUncertaintyPx);
  const setTapeMeasure = useStore((state) => state.setTapeMeasure);
  const setProtractor = useStore((state) => state.setProtractor);
  const setShowVelocityVectors = useStore((state) => state.setShowVelocityVectors);
  const setShowAccelerationVectors = useStore((state) => state.setShowAccelerationVectors);
  const setVectorScale = useStore((state) => state.setVectorScale);
  const setLineProfile = useStore((state) => state.setLineProfile);
  const setWavelengthCalibration = useStore((state) => state.setWavelengthCalibration);
  const setSpectralMode = useStore((state) => state.setSpectralMode);
  const setActiveClickTarget = useStore((state) => state.setActiveClickTarget);
  const setShowGuidelines = useStore((state) => state.setShowGuidelines);

  const isDark = theme === 'dark';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

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

  const toggleLineProfile = () => {
    if (lineProfile) {
      setLineProfile(null);
    } else {
      const w = videoDims.w || 600;
      const h = videoDims.h || 400;
      setLineProfile({
        p1: { x: w * 0.2, y: h * 0.5 },
        p2: { x: w * 0.8, y: h * 0.5 },
        spread: 5,
        channel: 'luma'
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

  return (
    <div className={`w-96 border-l flex flex-col transition-all z-20 shrink-0 ${styles.panel}`}>
      <div className={`p-4 border-b flex justify-between items-center ${styles.panelHeader} ${styles.panelBorder}`}> 
        <h2 className={`text-sm font-semibold flex items-center gap-2 ${styles.text}`}>
          <Table size={16} /> {t.dataTable} ({activeObjId === 'COM' ? t.comShort : activeObjId})
        </h2> 
      </div>
      
      <div className={`p-4 border-b flex flex-col gap-4 ${styles.panelBgOnly} ${styles.panelBorder} overflow-y-auto max-h-[60vh]`}> 
        {/* FPS SETTING */}
        <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${styles.textSecondary}`}>{t.fpsLabel}</span>
            <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className={`text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                <option value="30">30 fps</option>
                <option value="60">60 fps</option>
                <option value="120">120 fps</option>
                <option value="240">240 fps</option>
            </select>
        </div>

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

        <div className="flex flex-col gap-1 border-t pt-3 border-slate-700/20"> 
          <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}> 
            <span>{t.originLabel}: {origin ? `(${Math.round(origin.x)}, ${Math.round(origin.y)})` : t.notSet}</span> 
          </div> 
          <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}> 
            <span>{t.scaleLabel}: {pixelsPerMeter ? `${Math.round(pixelsPerMeter)} px/m` : t.notSet}</span> 
            {pixelsPerMeter && ( 
              <button onClick={resetScale} className="hover:text-red-400 transition" title="Reset Scale"> 
                <RotateCcw size={12} /> 
              </button> 
            )} 
          </div>
          <button onClick={() => setZeroTime(!zeroTime)} className={`text-xs flex items-center gap-2 px-2 py-1 rounded border transition ${zeroTime ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' : styles.buttonSecondary}`} title={zeroTime ? t.timeStart : t.videoTime}> 
            <Clock size={12} /> 
            <span>{zeroTime ? t.timeStart : t.videoTime}</span> 
          </button>
        </div> 

        <div className={`border-t pt-3 ${styles.panelBorder}`}>
          <div className={`flex items-center justify-between text-xs mb-1 ${styles.textSecondary}`}> 
            <span className="flex items-center gap-1"><CircleDashed size={12}/> {t.blurSize}</span> 
            <span>{uncertaintyPx}px</span> 
          </div>
          <input type="range" min="0" max="50" value={uncertaintyPx} onChange={(e) => setUncertaintyPx(Number(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>

        {/* ADVANCED OVERLAY TOOLS */}
        <div className={`border-t pt-3 ${styles.panelBorder} flex flex-col gap-2`}>
          <div className="flex items-center gap-2 mb-1">
             <Ruler size={14} className="text-blue-500" />
             <span className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>{t.overlayTools}</span>
          </div>
          
          {/* Row 1: Tape Measure & Protractor Checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input 
                type="checkbox" 
                checked={!!tapeMeasure} 
                onChange={toggleTapeMeasure} 
                className="rounded border-slate-600 text-blue-600 bg-slate-900 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.tapeMeasure}</span>
            </label>
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input 
                type="checkbox" 
                checked={!!protractor} 
                onChange={toggleProtractor} 
                className="rounded border-slate-600 text-blue-600 bg-slate-900 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
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
                className="rounded border-slate-600 text-blue-600 bg-slate-900 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.velocityVectors}</span>
            </label>
            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
              <input 
                type="checkbox" 
                checked={showAccelerationVectors} 
                onChange={(e) => setShowAccelerationVectors(e.target.checked)} 
                className="rounded border-slate-600 text-blue-600 bg-slate-900 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>{t.accelerationVectors}</span>
            </label>
          </div>

          {/* Vector Magnification Scale Slider */}
          {(showVelocityVectors || showAccelerationVectors) && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className={`flex items-center justify-between text-xs mb-1 ${styles.textSecondary}`}>
                <span>{t.vectorScale}</span>
                <span className="font-mono">{vectorScale.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="5.0" 
                step="0.1" 
                value={vectorScale} 
                onChange={(e) => setVectorScale(Number(e.target.value))} 
                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" 
              />
            </div>
          )}
        </div>

        {/* SPECTROSCOPY & LINE PROFILE TOOLS */}
        <div className={`border-t pt-3 ${styles.panelBorder} flex flex-col gap-2`}>
          <div className="flex items-center gap-2 mb-1">
             <Activity size={14} className="text-lime-500" />
             <span className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>{t.spectroscopyPanel}</span>
          </div>

          <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${styles.textSecondary} hover:${styles.text}`}>
            <input 
              type="checkbox" 
              checked={!!lineProfile} 
              onChange={toggleLineProfile} 
              className="rounded border-slate-600 text-blue-600 bg-slate-900 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>{t.lineProfileLabel}</span>
          </label>

          {lineProfile && (
            <div className="flex flex-col gap-2 mt-1 pl-2 border-l border-lime-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Spread width slider */}
              <div>
                <div className={`flex items-center justify-between text-xs mb-0.5 ${styles.textSecondary}`}>
                  <span>{t.spreadLabel}</span>
                  <span className="font-mono">{lineProfile.spread}px</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={lineProfile.spread} 
                  onChange={(e) => setLineProfile({ ...lineProfile, spread: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                />
              </div>

              {/* Color Channel dropdown */}
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${styles.textSecondary}`}>{t.channelLabel}</span>
                <select 
                  value={lineProfile.channel || 'luma'} 
                  onChange={(e) => setLineProfile({ ...lineProfile, channel: e.target.value })}
                  className={`text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                >
                  <option value="luma">{t.lumaChannel}</option>
                  <option value="red">{t.redChannel}</option>
                  <option value="green">{t.greenChannel}</option>
                  <option value="blue">{t.blueChannel}</option>
                </select>
              </div>

              {/* Optional Wavelength Calibration panel */}
              <div className="border-t border-slate-700/20 pt-2 mt-1">
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-xs font-bold ${styles.text}`}>{t.spectralCalibration}</div>
                  {wavelengthCalibration && (
                    <label className="flex items-center gap-1 text-[9px] cursor-pointer select-none text-sky-400">
                      <input 
                        type="checkbox"
                        checked={showGuidelines}
                        onChange={(e) => setShowGuidelines(e.target.checked)}
                        className="rounded border-slate-700 text-sky-500 bg-slate-900 focus:ring-sky-400 w-3 h-3"
                      />
                      <span>{t.showGuidelines}</span>
                    </label>
                  )}
                </div>
                <p className={`text-[10px] ${styles.textSecondary} leading-tight mb-2`}>{t.spectralCalibDesc}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Reference 1 */}
                  <div className={`rounded-lg p-2 border ${wavelengthCalibration?.p1_t > 0.02 && wavelengthCalibration?.p1_t < 0.98 ? 'border-cyan-500/20 bg-cyan-950/5' : 'border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className={`text-[10px] block font-semibold text-cyan-400`}>Ref 1 (nm)</label>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="400"
                      value={wavelengthCalibration?.p1_wl ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setWavelengthCalibration(prev => ({
                          p1_wl: isNaN(val) ? 0 : val,
                          p2_wl: prev?.p2_wl ?? 700,
                          p1_t: prev?.p1_t ?? 0.0,
                          p2_t: prev?.p2_t ?? 1.0
                        }));
                      }}
                      className={`w-full text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} mb-1.5`}
                    />
                    
                    <button
                      onClick={() => {
                        if (activeClickTarget === 'r1') {
                          setActiveClickTarget(null);
                        } else {
                          setActiveClickTarget('r1');
                          if (!wavelengthCalibration) {
                            setWavelengthCalibration({ p1_wl: 400, p2_wl: 700, p1_t: 0.0, p2_t: 1.0 });
                          }
                        }
                      }}
                      className={`w-full py-1 px-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${activeClickTarget === 'r1' ? 'bg-cyan-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
                    >
                      {t.clickToSnap}
                    </button>

                    {wavelengthCalibration && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>{t.positionOnLine}</span>
                          <span className="font-mono text-cyan-400">{Math.round((wavelengthCalibration.p1_t ?? 0.0) * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round((wavelengthCalibration.p1_t ?? 0.0) * 100)}
                          onChange={(e) => {
                            const val = Number(e.target.value) / 100;
                            setWavelengthCalibration(prev => ({
                              ...prev,
                              p1_t: val,
                              p1_wl: prev?.p1_wl ?? 400,
                              p2_t: prev?.p2_t ?? 1.0,
                              p2_wl: prev?.p2_wl ?? 700
                            }));
                          }}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Reference 2 */}
                  <div className={`rounded-lg p-2 border ${wavelengthCalibration?.p2_t > 0.02 && wavelengthCalibration?.p2_t < 0.98 ? 'border-red-500/20 bg-red-950/5' : 'border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className={`text-[10px] block font-semibold text-red-400`}>Ref 2 (nm)</label>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="700"
                      value={wavelengthCalibration?.p2_wl ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setWavelengthCalibration(prev => ({
                          p2_wl: isNaN(val) ? 0 : val,
                          p1_wl: prev?.p1_wl ?? 400,
                          p1_t: prev?.p1_t ?? 0.0,
                          p2_t: prev?.p2_t ?? 1.0
                        }));
                      }}
                      className={`w-full text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} mb-1.5`}
                    />
                    
                    <button
                      onClick={() => {
                        if (activeClickTarget === 'r2') {
                          setActiveClickTarget(null);
                        } else {
                          setActiveClickTarget('r2');
                          if (!wavelengthCalibration) {
                            setWavelengthCalibration({ p1_wl: 400, p2_wl: 700, p1_t: 0.0, p2_t: 1.0 });
                          }
                        }
                      }}
                      className={`w-full py-1 px-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${activeClickTarget === 'r2' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
                    >
                      {t.clickToSnap}
                    </button>

                    {wavelengthCalibration && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>{t.positionOnLine}</span>
                          <span className="font-mono text-red-400">{Math.round((wavelengthCalibration.p2_t ?? 1.0) * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round((wavelengthCalibration.p2_t ?? 1.0) * 100)}
                          onChange={(e) => {
                            const val = Number(e.target.value) / 100;
                            setWavelengthCalibration(prev => ({
                              ...prev,
                              p2_t: val,
                              p1_wl: prev?.p1_wl ?? 400,
                              p1_t: prev?.p1_t ?? 0.0,
                              p2_wl: prev?.p2_wl ?? 700
                            }));
                          }}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Wavelength x-axis unit selector */}
                {wavelengthCalibration && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/20">
                    <span className={`text-[10px] ${styles.textSecondary}`}>{t.spectralXAxisMode}</span>
                    <select 
                      value={spectralMode} 
                      onChange={(e) => setSpectralMode(e.target.value)}
                      className={`text-[10px] p-0.5 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                    >
                      <option value="pixels">{t.pixelUnit}</option>
                      {pixelsPerMeter && <option value="distance">{t.meterUnit}</option>}
                      <option value="wavelength">{t.wavelengthUnit}</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {points.length > 0 && activeObjId !== 'COM' && ( 
          <button onClick={() => setPoints([])} className="text-red-400 hover:text-red-300 flex items-center justify-center gap-2 text-sm mt-2"> 
            <Trash2 size={16} /> {t.clearData} 
          </button> 
        )} 
      </div>
      
      {/* COORDS DATA TABLE */}
      <div className={`flex-1 overflow-y-auto ${styles.bg}`}> 
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className={`sticky top-0 shadow-md ${styles.tableHeader}`}>
                  <tr> 
                    <th className="p-3">#</th> 
                    <th className="p-3">{t.time}</th> 
                    <th className="p-3">{t.xPos.split(' ')[0]} (m) <span className="font-normal text-xs opacity-70">±{uncertaintyMeters.toFixed(3)}</span> </th> 
                    <th className="p-3"> {t.yPos.split(' ')[0]} (m) <span className="font-normal text-xs opacity-70">±{uncertaintyMeters.toFixed(3)}</span> </th> 
                  </tr>
                </thead>
                <tbody className={`divide-y ${styles.tableDivider}`}>
                  {positionData.map((p, i) => (
                    <tr key={i} className={`transition ${styles.tableRow}`}> 
                      <td className={`p-3 ${styles.textSecondary}`}>{i + 1}</td> 
                      <td className="p-3 font-mono text-blue-500">{p.time.toFixed(3)}</td> 
                      <td className={`p-3 font-mono ${styles.tableCell}`}>{p.x.toFixed(3)}</td> 
                      <td className={`p-3 font-mono ${styles.tableCell}`}>{p.y.toFixed(3)}</td> 
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
                <button onClick={downloadCSV} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition"> 
                  <Download size={18} /> {t.downloadCSV} 
                </button> 
              </div> 
            )}
          </div>
      </div>
    </div>
  );
}
