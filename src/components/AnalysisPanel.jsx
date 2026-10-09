import {spectralRows, spectrumCSV, validCalibration} from '../utils/spectroscopy';
import {SPECTRUM_WORKFLOW_TEXT} from '../utils/spectrumWorkflow';
import {SPECTRUM_TEXT} from '../utils/spectrumText';
import {ANALYSIS_TEXT} from '../utils/analysisText';
import {axisUnit,parameterUnits,interpretationKey} from '../utils/analysisPresentation';
import MotionChart from './MotionChart';
import React from 'react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Calculator, Info, LayoutTemplate, Camera, Download, Activity 
} from 'lucide-react';
import { 
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// --- HELPER: FORMAT TICKS DYNAMICALLY ---
const getTickFormatter = (step) => {
  if (!step || step === 0 || !isFinite(step)) return (val) => val;
  
  // Handle integers
  if (step >= 1 && step % 1 === 0) return (val) => Number(val).toFixed(0);

  // Handle decimals: clean potential float errors (e.g. 0.3000000004)
  const cleanStep = parseFloat(step.toFixed(10)); 
  const s = cleanStep.toString();
  const decimals = s.indexOf('.') > -1 ? s.split('.')[1].length : 0;
  
  return (val) => Number(val).toFixed(decimals);
};

// --- EMISSION SPECTRA PRESETS ---
const REFERENCE_EMISSION_LINES = [
  // Hydrogen
  { element: 'h2', wl: 410.2, color: '#a855f7', label: 'H-δ (410.2 nm)' },
  { element: 'h2', wl: 434.0, color: '#6366f1', label: 'H-γ (434.0 nm)' },
  { element: 'h2', wl: 486.1, color: '#06b6d4', label: 'H-β (486.1 nm)' },
  { element: 'h2', wl: 656.3, color: '#ef4444', label: 'H-α (656.3 nm)' },
  // Helium
  { element: 'he', wl: 447.1, color: '#3b82f6', label: 'He (447.1 nm)' },
  { element: 'he', wl: 501.6, color: '#10b981', label: 'He (501.6 nm)' },
  { element: 'he', wl: 587.6, color: '#eab308', label: 'He (587.6 nm)' },
  { element: 'he', wl: 667.8, color: '#f43f5e', label: 'He (667.8 nm)' },
  // Mercury
  { element: 'hg', wl: 404.7, color: '#c084fc', label: 'Hg (404.7 nm)' },
  { element: 'hg', wl: 435.8, color: '#2563eb', label: 'Hg (435.8 nm)' },
  { element: 'hg', wl: 546.1, color: '#22c55e', label: 'Hg (546.1 nm)' },
  { element: 'hg', wl: 579.0, color: '#d97706', label: 'Hg (579.0 nm)' }
];

export default function AnalysisPanel({
  chartData,
  xScale,
  yScale,
  fitEquation,
  activeObjectColor,
  downloadCSV,
  points,
}) {
  // Zustand Store Selectors
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const activeObjId = useStore((state) => state.activeObjId);
  const viewMode = useStore((state) => state.viewMode);
  const analysisChartMode = useStore((state) => state.analysisChartMode);
  const plotX = useStore((state) => state.plotX);
  const plotY = useStore((state) => state.plotY);
  const cropStart = useStore((state) => state.cropStart);
  const cropEnd = useStore((state) => state.cropEnd);
  const pixelsPerMeter = useStore((state) => state.pixelsPerMeter);
  const wavelengthCalibration = useStore((state) => state.wavelengthCalibration);
  const requestedSpectralMode = useStore((state) => state.spectralMode);
  const lineProfile = useStore((state) => state.lineProfile);
  const spectralData = useStore((state) => state.spectralData);
  const activeReferenceOverlays = useStore((state) => state.activeReferenceOverlays) || { h2: false, he: false, hg: false };
  const fitModel = useStore((state) => state.fitModel);
  const legendPosition = useStore((state) => state.legendPosition);

  const setAnalysisChartMode = useStore((state) => state.setAnalysisChartMode);
  const setPlotX = useStore((state) => state.setPlotX);
  const setPlotY = useStore((state) => state.setPlotY);
  const setCropStart = useStore((state) => state.setCropStart);
  const setCropEnd = useStore((state) => state.setCropEnd);
  const setSpectralMode = useStore((state) => state.setSpectralMode);
  const setLineProfile = useStore((state) => state.setLineProfile);
  const setActiveReferenceOverlays = useStore((state) => state.setActiveReferenceOverlays);
  const setFitModel = useStore((state) => state.setFitModel);
  const setLegendPosition = useStore((state) => state.setLegendPosition);

  const isDark = theme === 'dark';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const st = SPECTRUM_TEXT[language] || SPECTRUM_TEXT.en;
  const a = ANALYSIS_TEXT[language] || ANALYSIS_TEXT.en;
  const spectrum = spectralRows(spectralData,lineProfile,wavelengthCalibration,requestedSpectralMode,pixelsPerMeter);
  const spectralMode = spectrum.mode;
  const calibratedSpectrum = validCalibration(wavelengthCalibration,lineProfile);
  function downloadSpectrum() {
    const url=URL.createObjectURL(new Blob([spectrumCSV(spectrum.rows,spectrum.mode)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='spectrum.csv';
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  }


  const styles = {
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    panelBgOnly: isDark ? 'bg-slate-800' : 'bg-white',
    panelBorder: isDark ? 'border-slate-700' : 'border-slate-200',
    input: isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    chartGrid: isDark ? "#334155" : "#e2e8f0",
    chartAxis: isDark ? "#cbd5e1" : "#475569",
    chartTooltip: isDark ? { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }
  };

  const baseLabels = {
    'time': t.time, 
    'x': t.xPos, 
    'y': t.yPos, 
    'vx': t.xVel, 
    'vy': t.yVel 
  };
  const labels=Object.fromEntries(Object.entries(baseLabels).map(([key,label])=>
    [key,`${label.replace(/\s*\([^)]*\)\s*$/, '')} (${axisUnit(key,!!pixelsPerMeter)})`]));
  const fitUnits=fitEquation?parameterUnits(fitEquation.type,plotX,plotY,!!pixelsPerMeter):{};
  const parameters=fitEquation?.type==='Linear'?[['m',t.slope],['b',t.intercept]]:
    fitEquation?.type==='Quadratic'?[['A',t.aTerm],['B',t.bTerm],['C',t.cTerm]]:
    [['A',t.amplitude],['B',a.angularFrequency],['C',t.phase],['D',t.offset]];

  const exportScientificGraph = () => {
    const svgElement = document.querySelector("#motion-chart .recharts-surface");
    if (!svgElement) {
        alert("Could not find chart to export.");
        return;
    }

    const svgClone = svgElement.cloneNode(true);
    svgClone.querySelectorAll('[data-hover-only]').forEach(element=>element.remove());
    
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "white");
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    svgClone.style.fontFamily = "Arial, Helvetica, sans-serif";

    // --- 1. CALCULATE GRID BOUNDARIES FIRST ---
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    const gridLines = svgClone.querySelectorAll(".recharts-cartesian-grid line");
    gridLines.forEach(l => { 
      l.setAttribute("stroke", "#9ca3af"); 
      l.removeAttribute("stroke-dasharray"); 

      const x1 = parseFloat(l.getAttribute("x1"));
      const x2 = parseFloat(l.getAttribute("x2"));
      const y1 = parseFloat(l.getAttribute("y1"));
      const y2 = parseFloat(l.getAttribute("y2"));
      if (!isNaN(x1)) { minX = Math.min(minX, x1); maxX = Math.max(maxX, x1); }
      if (!isNaN(x2)) { minX = Math.min(minX, x2); maxX = Math.max(maxX, x2); }
      if (!isNaN(y1)) { minY = Math.min(minY, y1); maxY = Math.max(maxY, y1); }
      if (!isNaN(y2)) { minY = Math.min(minY, y2); maxY = Math.max(maxY, y2); }
    });

    if (minX === Infinity) { minX = 60; minY = 20; maxX = 740; maxY = 380; }

    const chartMidY = (minY + maxY) / 2;

    // --- 2. PROCESS TEXT ELEMENTS ---
    const texts = svgClone.querySelectorAll("text");
    texts.forEach(tk => { 
      tk.setAttribute("fill", "black"); 
      tk.style.fill = "black"; 
      tk.style.fontFamily = "Arial, Helvetica, sans-serif";

      if (tk.classList.contains("recharts-cartesian-axis-tick-value")) {
        tk.style.fontSize = "24px"; 
        tk.style.fontWeight = "bold";
      }

      if (tk.textContent === labels[plotX]) {
        tk.style.fontSize = "32px"; 
        tk.style.fontWeight = "bold";
        let currentDy = parseFloat(tk.getAttribute("dy")) || 0;
        tk.setAttribute("dy", currentDy + 30);
      }

      if (tk.textContent === labels[plotY]) {
        tk.style.fontSize = "32px"; 
        tk.style.fontWeight = "bold";
        const currentX = parseFloat(tk.getAttribute("x")) || 20; 
        tk.setAttribute("y", chartMidY);
        tk.setAttribute("transform", `rotate(-90, ${currentX}, ${chartMidY})`);
        tk.setAttribute("text-anchor", "middle");
        tk.setAttribute("dy", -40);
      }
    });

    const axesLines = svgClone.querySelectorAll(".recharts-xAxis line, .recharts-yAxis line");
    axesLines.forEach(l => l.setAttribute("stroke", "black"));
    
    const symbols = svgClone.querySelectorAll(".recharts-scatter-symbol path");
    symbols.forEach(s => { 
      s.setAttribute("fill", activeObjectColor); 
      s.style.fill = activeObjectColor; 
      s.setAttribute("stroke", activeObjectColor);
      s.setAttribute("stroke-width", "5"); 
    });

    const lines = svgClone.querySelectorAll(".recharts-line-curve");
    lines.forEach(l => {
        if (analysisChartMode === 'spectroscopy') return;
        l.setAttribute("stroke", "red"); 
        l.setAttribute("stroke-dasharray", "5,3"); 
        l.setAttribute("stroke-width", "2");
    });

    if (isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
        const borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        borderRect.setAttribute("x", minX);
        borderRect.setAttribute("y", minY);
        borderRect.setAttribute("width", maxX - minX);
        borderRect.setAttribute("height", maxY - minY);
        borderRect.setAttribute("fill", "none");
        borderRect.setAttribute("stroke", "black");
        borderRect.setAttribute("stroke-width", "1");
        svgClone.appendChild(borderRect);
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const topMargin = 100; 
        const leftMargin = 60; 
        const bottomMargin = 60; 
        const rightMargin = 20; 

        canvas.width = img.width + leftMargin + rightMargin;
        canvas.height = img.height + topMargin + bottomMargin;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isVelocity = ['vx', 'vy'].includes(plotY);
        const isPosition = ['x', 'y'].includes(plotY);
        const yVar = isVelocity ? 'v' : (plotY === 'x' ? 'x' : 'y');
        const xVar = plotX === 'time' ? 't' : 'x';
        const modelName = fitEquation?.type === 'Linear' ? "Linear Regression" : 
                          (fitEquation?.type === 'Quadratic' ? "Quadratic Fit" : 
                          (fitEquation?.type === 'Sinusoidal' ? "Sinusoidal Fit" : "Plot"));
        
        ctx.font = "bold 36px Arial"; 
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        const titleText = analysisChartMode === 'spectroscopy' ? st.title : `${modelName} of ${labels[plotY].split('(')[0].trim()} vs ${labels[plotX].split('(')[0].trim()}`;
        ctx.fillText(titleText, canvas.width / 2, 55);

        ctx.drawImage(img, leftMargin, topMargin);

        if (analysisChartMode !== 'spectroscopy' && fitEquation && legendPosition !== 'none') {
            const padding = 20;
            const boxW = 480; 
            const boxH = 150; 

            let boxX = leftMargin + minX + padding;
            let boxY = topMargin + minY + padding;

            switch(legendPosition) {
                case 'top-right':
                    boxX = leftMargin + maxX - boxW - padding;
                    boxY = topMargin + minY + padding;
                    break;
                case 'bottom-left':
                    boxX = leftMargin + minX + padding;
                    boxY = topMargin + maxY - boxH - padding;
                    break;
                case 'bottom-right':
                    boxX = leftMargin + maxX - boxW - padding;
                    boxY = topMargin + maxY - boxH - padding;
                    break;
                case 'top-left':
                default:
                    break;
            }

            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.textAlign = "left";
            ctx.font = "20px Arial"; 
            ctx.fillStyle = "black";

            ctx.beginPath();
            ctx.arc(boxX + 25, boxY + 30, 6, 0, 2 * Math.PI); 
            ctx.fillStyle = activeObjectColor;
            ctx.fill();
            ctx.fillStyle = "black";
            const dataLabel = isVelocity ? t.calcVel : (isPosition ? t.expPos : t.dataPoints);
            ctx.fillText(dataLabel, boxX + 50, boxY + 35);

            ctx.fillText(t.trendLine, boxX + 50, boxY + 65);

            ctx.beginPath();
            ctx.moveTo(boxX + 15, boxY + 95);
            ctx.lineTo(boxX + 35, boxY + 95);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]); 
            
            let equationText = fitEquation.text.replace('y', yVar).replace(/x/g, xVar);
            
            ctx.fillText(equationText, boxX + 50, boxY + 100);

            ctx.fillText(`R² = ${Number.isFinite(fitEquation.r2) ? fitEquation.r2.toFixed(4) : "N/A"}`, boxX + 50, boxY + 130);
        }

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `scientific_graph_${activeObjId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className={`analysis-workspace flex flex-1 min-w-0 overflow-hidden ${styles.bg} ${viewMode === 'analysis' ? '' : 'hidden'}`}>
        <div className="analysis-plot flex-1 min-w-0 p-3 lg:p-6 flex flex-col">
          <div id="motion-chart" className={`rounded-xl border flex-1 flex flex-col overflow-hidden shadow-2xl ${styles.panel}`}>
             <div className={`p-4 border-b flex flex-wrap gap-4 items-center ${styles.panelBgOnly} ${styles.panelBorder}`}>
                
                {/* CHART TYPE TOGGLE TAB */}
                <div className={`flex rounded p-0.5 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                  <button 
                    onClick={() => setAnalysisChartMode('kinematics')} 
                    className={`px-3 py-1 text-xs rounded transition font-semibold ${analysisChartMode === 'kinematics' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white shadow-sm text-slate-900') : styles.textSecondary + ' hover:' + styles.text}`}
                  >
                    {t.trackerMode === 'Rastreador' ? 'Gráficos Cinemáticos' : 'Kinematics Charts'}
                  </button>
                  {lineProfile && (
                    <button 
                      onClick={() => setAnalysisChartMode('spectroscopy')} 
                      className={`px-3 py-1 text-xs rounded transition font-semibold ${analysisChartMode === 'spectroscopy' ? (isDark ? 'bg-cyan-500/15 text-cyan-300 shadow-sm' : 'bg-cyan-50 shadow-sm text-cyan-800') : styles.textSecondary + ' hover:' + styles.text}`}
                    >
                      {t.trackerMode === 'Rastreador' ? 'Perfil Espectral' : 'Spectral Profile'}
                    </button>
                  )}
                </div>

                <div className={`w-px h-5 mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                {analysisChartMode === 'kinematics' ? (
                  <>
                    <fieldset className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-500/30 px-3 pb-2">
                    <legend className={`px-1 text-xs font-semibold ${styles.textSecondary}`}>{a.axes}</legend>
                    <div className="flex items-center gap-2">
                      <label htmlFor="analysis-y" className={`text-xs font-bold ${styles.textSecondary}`}>{t.yAxis}</label>
                      <select id="analysis-y" value={plotY} onChange={(e) => setPlotY(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-600 ${styles.input}`}>
                        <option value="x">{labels.x}</option> <option value="y">{labels.y}</option> <option value="vx">{labels.vx}</option> <option value="vy">{labels.vy}</option> <option value="time">{labels.time}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="analysis-x" className={`text-xs font-bold ${styles.textSecondary}`}>{t.xAxis}</label>
                      <select id="analysis-x" value={plotX} onChange={(e) => setPlotX(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-600 ${styles.input}`}>
                         <option value="time">{labels.time}</option> <option value="x">{labels.x}</option> <option value="y">{labels.y}</option> <option value="vx">{labels.vx}</option> <option value="vy">{labels.vy}</option>
                      </select>
                    </div>
                    </fieldset>
                    
                    <div className="flex-1"></div>
                    
                    {/* DATA RANGE CROPPER */}
                    <fieldset className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-500/30 px-3 pb-2">
                      <legend className={`px-1 text-xs font-semibold ${styles.textSecondary}`}>{a.range} (s)</legend>
                      <input 
                          aria-label={a.rangeStart}
                          type="number" 
                          step="0.1" 
                          value={cropStart} 
                          onChange={(e) => setCropStart(e.target.value)} 
                          placeholder={t.start} 
                          className={`w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-cyan-600 ${styles.input}`}
                      />
                      <span className={styles.textSecondary}>-</span>
                      <input 
                          aria-label={a.rangeEnd}
                          type="number" 
                          step="0.1" 
                          value={cropEnd} 
                          onChange={(e) => setCropEnd(e.target.value)} 
                          placeholder={t.end} 
                          className={`w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-cyan-600 ${styles.input}`}
                      />
                      <button 
                          onClick={() => { setCropStart(''); setCropEnd(''); }} 
                          className={`px-3 py-1.5 text-xs rounded transition font-semibold ${styles.buttonSecondary}`}
                      >
                          {a.showAll}
                      </button>
                    </fieldset>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.spectralXAxisMode}</span>
                      <select 
                        value={spectralMode} 
                        onChange={(e) => setSpectralMode(e.target.value)}
                        className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-600 ${styles.input}`}
                      >
                        <option value="pixels">{t.pixelUnit}</option>
                        {pixelsPerMeter && <option value="distance">{t.meterUnit}</option>}
                        {calibratedSpectrum && <option value="wavelength">{t.wavelengthUnit}</option>}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.channelLabel}</span>
                      <select 
                        disabled={!lineProfile}
                        value={lineProfile?.channel || 'luma'} 
                        onChange={(e) => {const channel=e.target.value;setLineProfile(current=>current?{...current,channel}:current);}}
                        className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-600 ${styles.input}`}
                      >
                        <option value="luma">{t.lumaChannel}</option>
                        <option value="red">{t.redChannel}</option>
                        <option value="green">{t.greenChannel}</option>
                        <option value="blue">{t.blueChannel}</option>
                      </select>
                    </div>
                    <div className="flex-1"></div>
                    {calibratedSpectrum && (
                      <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded border border-lime-500/20 bg-lime-500/10 text-lime-400 animate-in fade-in`}>
                        {wavelengthCalibration.p1_wl} nm ↔ {wavelengthCalibration.p2_wl} nm

                      </div>
                    )}
                  </>
                )}

             </div>

             <div className="flex-1 p-4 relative">
                {analysisChartMode === 'kinematics' ? (
                  <>
                    <MotionChart data={chartData} plotX={plotX} plotY={plotY} xScale={xScale} yScale={yScale}
                      labels={labels} styles={styles} formatTicks={getTickFormatter} fitEquation={fitEquation}
                      color={activeObjectColor} objectLabel={activeObjId==='COM'?t.comShort:`${a.object} ${activeObjId}`} dark={isDark} />
                    {points.length === 0 && ( <div className={`absolute inset-0 pointer-events-none flex items-center justify-center italic ${styles.textSecondary}`}> {a.empty} </div> )}
                  </>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={spectrum.rows}
                        margin={{ top: 20, right: 30, left: 50, bottom: 50 }}
                      >
                        <defs>
                          <linearGradient id="spectralGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#84cc16" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
                        <XAxis 
                          dataKey="xVal" 
                          type="number" 
                          stroke={styles.chartAxis} 
                          fontSize={14} 
                          domain={['auto', 'auto']}
                          label={{ 
                            value: spectralMode === 'distance' ? `${t.spectralDistance} (m)` : spectralMode === 'wavelength' ? `${t.wavelengthUnit} (nm)` : `${t.spectralDistance} (px)`, 
                            position: 'bottom', 
                            offset: 20, 
                            fill: styles.chartAxis, 
                            fontSize: 16 
                          }} 
                        />
                        <YAxis 
                          stroke={styles.chartAxis} 
                          fontSize={14} 
                          domain={[0, 255]}
                          ticks={[0, 50, 100, 150, 200, 255]}
                          label={{ value: st.intensity, angle: -90, position: 'insideLeft', offset: -40, fill: styles.chartAxis, fontSize: 16 }}
                        />
                        <Tooltip isAnimationActive={false}
                          contentStyle={styles.chartTooltip} 
                          formatter={(val, name) => {
                            if (name === 'intensity') return [val, t.channelLabel];
                            return [val, name.toUpperCase()];
                          }}
                          labelFormatter={(val) => `${spectralMode === 'distance' ? `${t.spectralDistance} (m)` : spectralMode === 'wavelength' ? `${t.wavelengthUnit} (nm)` : `${t.spectralDistance} (px)`}: ${val}`} 
                        />
                        <Line 
                          type="linear"
                          dataKey="intensity" 
                          stroke="#84cc16" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        {lineProfile?.channel === 'luma' && (
                          <>
                            <Line type="linear" dataKey="r" stroke="#ef4444" strokeWidth={1} dot={false} strokeOpacity={0.3} />
                            <Line type="linear" dataKey="g" stroke="#22c55e" strokeWidth={1} dot={false} strokeOpacity={0.3} />
                            <Line type="linear" dataKey="b" stroke="#3b82f6" strokeWidth={1} dot={false} strokeOpacity={0.3} />
                          </>
                        )}
                        {spectralMode === 'wavelength' && REFERENCE_EMISSION_LINES.map((line, idx) => {
                          if (!activeReferenceOverlays[line.element]) return null;
                          return (
                            <ReferenceLine
                              key={idx}
                              x={line.wl}
                              ifOverflow="discard"
                              stroke={line.color}
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              label={{
                                value: line.label,
                                position: 'insideTopRight',
                                angle: -90,
                                fill: line.color,
                                fontSize: 10,
                                fontWeight: 'bold',
                                dx: -10,
                                dy: 55
                              }}
                            />
                          );
                        })}
                      </ComposedChart>
                    </ResponsiveContainer>
                    {spectralData.length === 0 && ( <div className={`absolute inset-0 flex items-center justify-center italic ${styles.textSecondary}`}> {st.noData} </div> )}
                  </>
                )}
              </div>
          </div>
        </div>

        <div className={`analysis-tools w-80 xl:w-96 overflow-y-auto border-l flex flex-col p-4 gap-6 shrink-0 ${styles.panel}`}>
           {analysisChartMode === 'kinematics' ? (
             <>
               <div>
                 <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Calculator /> {a.fit} ({activeObjId === 'COM' ? t.comShort : activeObjId})</h3>
                 <div className="flex flex-col gap-2">
                    <label htmlFor="analysis-fit" className={`text-sm ${styles.textSecondary}`}>{t.modelType}</label>
                    <select id="analysis-fit" value={fitModel} onChange={(e) => setFitModel(e.target.value)} className={`border rounded px-3 py-2 focus:outline-none focus:border-cyan-600 ${styles.input}`}>
                      <option value="none">{t.none}</option>
                      <option value="linear">{t.linear}</option>
                      <option value="quadratic">{t.quadratic}</option>
                      <option value="sinusoidal">{t.sinusoidal}</option>
                    </select>
                 </div>
               </div>
               {fitModel!=='none' && fitModel!=='sinusoidal' && !fitEquation && <p role="status" className={`text-sm ${styles.textSecondary}`}>{a.unavailable}</p>}
               {fitModel === 'sinusoidal' && (!fitEquation || fitEquation.warning) && (
                 <p role="status" className={`text-sm ${styles.textSecondary}`}>
                   {fitEquation ? t[fitEquation.warning] : t.fitUnavailable}
                 </p>
               )}
               {fitEquation && (
                 <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                   <div className={`font-mono font-bold text-sm break-words mb-4 pb-2 border-b ${isDark ? 'text-cyan-300 border-slate-700' : 'text-cyan-800 border-slate-200'}`}> {fitEquation.text} </div>
                   <div className="space-y-3">
                      {parameters.map(([key,label])=><div key={key} className="flex justify-between items-baseline gap-3">
                        <span className={styles.textSecondary}>{label}</span>
                        <span className={`text-right font-mono tabular-nums ${styles.text}`}>
                          {Math.abs(fitEquation.params[key])>0 && Math.abs(fitEquation.params[key])<.0001?fitEquation.params[key].toExponential(3):fitEquation.params[key].toFixed(4)}
                          {fitUnits[key] && <span className="ml-1 text-xs">{fitUnits[key]}</span>}
                        </span>
                      </div>)}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                        <span className={styles.textSecondary}>R²</span> 
                        <span className={`font-mono text-lg ${styles.text}`}>{Number.isFinite(fitEquation.r2) ? fitEquation.r2.toFixed(4) : "N/A"}</span>
                      </div>
                   </div>
                 </div>
               )}
               {fitEquation && <section className={`border-t pt-4 text-sm leading-relaxed ${styles.panelBorder}`}>
                 <h4 className="font-semibold mb-2">{a.interpretation}</h4>
                 <p>{a[interpretationKey(fitEquation.type,plotX,plotY)]}</p>
                 <details className="mt-3">
                   <summary className="cursor-pointer py-2 font-medium">{a.moreHelp}</summary>
                   <p className={`mb-2 ${styles.textSecondary}`}>{a.fitHelp}</p>
                   <p className={styles.textSecondary}>{a.r2Help}</p>
                 </details>
               </section>}
             </>
           ) : (
             <>
               <button type="button" className={`min-h-11 rounded-lg border px-3 text-sm mb-4 ${styles.buttonSecondary}`} onClick={()=>{
                 const store=useStore.getState();
                 store.setSpectrumStep('calibrate');
                 if(store.imageSrc)store.selectImageTask('spectrum');
                 else store.navigateSidebar('tools','spectroscopy');
                 store.setViewMode('tracker');
               }}>{(SPECTRUM_WORKFLOW_TEXT[language] || SPECTRUM_WORKFLOW_TEXT.en).edit}</button>
               <div>
                 <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${styles.text}`}><Info size={18} className="text-lime-500" /> {(SPECTRUM_WORKFLOW_TEXT[language] || SPECTRUM_WORKFLOW_TEXT.en).compare}</h3>
                 <p className={`text-xs ${styles.textSecondary} mb-4 leading-normal`}>
                   {language === 'es' ? 'Use estas referencias de longitud de onda para identificar elementos químicos en picos espectrales:' : 'Use these standard optical emission peaks as references when identifying elements in your spectral graph:'}
                 </p>
                 <p role="status" className={`text-xs mb-3 ${styles.textSecondary}`}>{!calibratedSpectrum ? st.comparisonCalibration : spectralMode !== 'wavelength' ? st.comparisonWavelength : st.comparisonHelp}</p>
                 <div className="space-y-3.5">
                   {/* Element: Hydrogen */}
                   <div className={`rounded-xl p-3 border transition-colors ${activeReferenceOverlays.h2 ? (isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50/50 border-red-200') : (isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-red-500 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            disabled={!calibratedSpectrum || spectralMode !== 'wavelength'}
                            checked={activeReferenceOverlays.h2} 
                            onChange={(e) => setActiveReferenceOverlays({ ...activeReferenceOverlays, h2: e.target.checked })}
                            className={`rounded text-red-600 focus:ring-red-500 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}
                          />
                          {t.showH2}
                        </label>
                       <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Balmer Series</span>
                     </div>
                     <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px] text-slate-400">
                       <div className="flex justify-between"><span>Violet:</span><span className="font-bold">410.2 nm</span></div>
                       <div className="flex justify-between"><span>Blue-Vi:</span><span className="font-bold">434.0 nm</span></div>
                       <div className="flex justify-between"><span>Blue-Gr:</span><span className="font-bold">486.1 nm</span></div>
                       <div className="flex justify-between"><span>Red:</span><span className="font-bold text-red-500">656.3 nm</span></div>
                     </div>
                   </div>
                   
                   {/* Element: Helium */}
                   <div className={`rounded-xl p-3 border transition-colors ${activeReferenceOverlays.he ? (isDark ? 'bg-yellow-950/20 border-yellow-500/30' : 'bg-yellow-50/50 border-yellow-200') : (isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-yellow-500 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            disabled={!calibratedSpectrum || spectralMode !== 'wavelength'}
                            checked={activeReferenceOverlays.he} 
                            onChange={(e) => setActiveReferenceOverlays({ ...activeReferenceOverlays, he: e.target.checked })}
                            className={`rounded text-yellow-600 focus:ring-yellow-500 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}
                          />
                          {t.showHe}
                        </label>
                       <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">Noble Gas</span>
                     </div>
                     <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px] text-slate-400">
                       <div className="flex justify-between"><span>Blue:</span><span className="font-bold">447.1 nm</span></div>
                       <div className="flex justify-between"><span>Green:</span><span className="font-bold">501.6 nm</span></div>
                       <div className="flex justify-between"><span>Yellow:</span><span className="font-bold text-yellow-500">587.6 nm</span></div>
                       <div className="flex justify-between"><span>Red:</span><span className="font-bold text-red-500">667.8 nm</span></div>
                     </div>
                   </div>

                   {/* Element: Mercury */}
                   <div className={`rounded-xl p-3 border transition-colors ${activeReferenceOverlays.hg ? (isDark ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50/50 border-purple-200') : (isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-purple-500 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            disabled={!calibratedSpectrum || spectralMode !== 'wavelength'}
                            checked={activeReferenceOverlays.hg} 
                            onChange={(e) => setActiveReferenceOverlays({ ...activeReferenceOverlays, hg: e.target.checked })}
                            className={`rounded text-purple-600 focus:ring-purple-500 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}
                          />
                          {t.showHg}
                        </label>
                       <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Metal Vapor</span>
                     </div>
                     <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px] text-slate-400">
                       <div className="flex justify-between"><span>Violet:</span><span className="font-bold">404.7 nm</span></div>
                       <div className="flex justify-between"><span>Blue:</span><span className="font-bold">435.8 nm</span></div>
                       <div className="flex justify-between"><span>Green:</span><span className="font-bold text-green-500">546.1 nm</span></div>
                       <div className="flex justify-between"><span>Yellow:</span><span className="font-bold text-yellow-500">579.0 nm</span></div>
                     </div>
                   </div>
                 </div>
               </div>
             </>
           )}

           {/* EXPORT BUTTONS */}
           <div className={`flex flex-col gap-2 mt-4 border-t pt-4 ${styles.panelBorder}`}>
              <details>
              <summary className="cursor-pointer py-2 text-sm font-semibold">{a.appearance}</summary>
              
              {/* Legend Position Control */}
              <label htmlFor="analysis-legend" className={`text-xs uppercase font-bold tracking-wider mb-1 ${styles.textSecondary} flex items-center gap-2`}>
                <LayoutTemplate size={14} /> {t.legendPos}
              </label>
              <select 
                id="analysis-legend"
                value={legendPosition} 
                onChange={(e) => setLegendPosition(e.target.value)} 
                className={`border rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-cyan-600 ${styles.input}`}
              >
                <option value="top-left">{t.topLeft}</option>
                <option value="top-right">{t.topRight}</option>
                <option value="bottom-left">{t.bottomLeft}</option>
                <option value="bottom-right">{t.bottomRight}</option>
                <option value="none">{t.hide}</option>
              </select>
              </details>
              <h4 className="mt-3 mb-1 text-sm font-semibold">{a.export}</h4>

              <button onClick={exportScientificGraph} className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded transition border bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm`}>
                <Camera size={18} /> {t.exportGraph}
              </button>
              <button onClick={analysisChartMode === 'spectroscopy' ? downloadSpectrum : downloadCSV} className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded transition border ${styles.buttonSecondary}`}>
                <Download size={18} /> {analysisChartMode === 'spectroscopy' ? (SPECTRUM_WORKFLOW_TEXT[language] || SPECTRUM_WORKFLOW_TEXT.en).export : t.exportData}
              </button>
           </div>

        </div>
    </div>
  );
}
