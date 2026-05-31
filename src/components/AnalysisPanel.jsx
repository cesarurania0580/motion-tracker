import React from 'react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { 
  Calculator, Info, LayoutTemplate, Camera, Download, Activity 
} from 'lucide-react';
import { 
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ErrorBar, ReferenceLine 
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
  const spectralMode = useStore((state) => state.spectralMode);
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

  const styles = {
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    panelBgOnly: isDark ? 'bg-slate-800' : 'bg-white',
    panelBorder: isDark ? 'border-slate-700' : 'border-slate-200',
    input: isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    chartGrid: isDark ? "#475569" : "#e2e8f0",
    chartAxis: isDark ? "#94a3b8" : "#64748b",
    chartTooltip: isDark ? { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }
  };

  const labels = { 
    'time': t.time, 
    'x': t.xPos, 
    'y': t.yPos, 
    'vx': t.xVel, 
    'vy': t.yVel 
  };

  const exportScientificGraph = () => {
    const svgElement = document.querySelector("#motion-chart .recharts-surface");
    if (!svgElement) {
        alert("Could not find chart to export.");
        return;
    }

    const svgClone = svgElement.cloneNode(true);
    
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
        const titleText = `${modelName} of ${labels[plotY].split('(')[0].trim()} vs ${labels[plotX].split('(')[0].trim()}`;
        ctx.fillText(titleText, canvas.width / 2, 55);

        ctx.drawImage(img, leftMargin, topMargin);

        if (fitEquation && legendPosition !== 'none') {
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

            ctx.fillText(`R² = ${fitEquation.r2.toFixed(4)}`, boxX + 50, boxY + 130); 
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
    <div className={`flex flex-1 overflow-hidden ${styles.bg} ${viewMode === 'analysis' ? '' : 'hidden'}`}>
        <div className="flex-1 p-6 flex flex-col">
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
                      className={`px-3 py-1 text-xs rounded transition font-semibold ${analysisChartMode === 'spectroscopy' ? (isDark ? 'bg-slate-700 text-lime-400 shadow-sm' : 'bg-white shadow-sm text-lime-600') : styles.textSecondary + ' hover:' + styles.text}`}
                    >
                      {t.trackerMode === 'Rastreador' ? 'Perfil Espectral' : 'Spectral Profile'}
                    </button>
                  )}
                </div>

                <div className={`w-px h-5 mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

                {analysisChartMode === 'kinematics' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.yAxis}</span>
                      <select value={plotY} onChange={(e) => setPlotY(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`}>
                        <option value="x">{t.xPos}</option> <option value="y">{t.yPos}</option> <option value="vx">{t.xVel}</option> <option value="vy">{t.yVel}</option> <option value="time">{t.time}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.xAxis}</span>
                      <select value={plotX} onChange={(e) => setPlotX(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`}>
                         <option value="time">{t.time}</option> <option value="x">{t.xPos}</option> <option value="y">{t.yPos}</option> <option value="vx">{t.xVel}</option> <option value="vy">{t.yVel}</option>
                      </select>
                    </div>
                    
                    <div className="flex-1"></div>
                    
                    {/* DATA RANGE CROPPER */}
                    <div className={`flex items-center gap-2 pl-4 border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.dataRange} (s):</span>
                      <input 
                          type="number" 
                          step="0.1" 
                          value={cropStart} 
                          onChange={(e) => setCropStart(e.target.value)} 
                          placeholder={t.start} 
                          className={`w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`} 
                      />
                      <span className={styles.textSecondary}>-</span>
                      <input 
                          type="number" 
                          step="0.1" 
                          value={cropEnd} 
                          onChange={(e) => setCropEnd(e.target.value)} 
                          placeholder={t.end} 
                          className={`w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`} 
                      />
                      <button 
                          onClick={() => { setCropStart(''); setCropEnd(''); }} 
                          className={`px-3 py-1.5 text-xs rounded transition font-semibold ${styles.buttonSecondary}`}
                      >
                          {t.reset}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.spectralXAxisMode}</span>
                      <select 
                        value={spectralMode} 
                        onChange={(e) => setSpectralMode(e.target.value)}
                        className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`}
                      >
                        <option value="pixels">{t.pixelUnit}</option>
                        {pixelsPerMeter && <option value="distance">{t.meterUnit}</option>}
                        {wavelengthCalibration && <option value="wavelength">{t.wavelengthUnit}</option>}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>{t.channelLabel}</span>
                      <select 
                        value={lineProfile?.channel || 'luma'} 
                        onChange={(e) => setLineProfile({ ...lineProfile, channel: e.target.value })}
                        className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`}
                      >
                        <option value="luma">{t.lumaChannel}</option>
                        <option value="red">{t.redChannel}</option>
                        <option value="green">{t.greenChannel}</option>
                        <option value="blue">{t.blueChannel}</option>
                      </select>
                    </div>
                    <div className="flex-1"></div>
                    {wavelengthCalibration && (
                      <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded border border-lime-500/20 bg-lime-500/10 text-lime-400 animate-in fade-in`}>
                        {wavelengthCalibration.p1_wl} nm ({Math.round((wavelengthCalibration.p1_t ?? 0.0) * 100)}%) ↔ {wavelengthCalibration.p2_wl} nm ({Math.round((wavelengthCalibration.p2_t ?? 1.0) * 100)}%)
                      </div>
                    )}
                  </>
                )}

             </div>

             <div className="flex-1 p-4 relative">
                {analysisChartMode === 'kinematics' ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%"> 
                       <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 50, bottom: 50 }}> 
                         <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} /> 
                         <XAxis 
                           dataKey={plotX} 
                           type="number" 
                           stroke={styles.chartAxis} 
                           fontSize={16} 
                           domain={[xScale.min, xScale.max]}
                           ticks={xScale.ticks}
                           tickFormatter={getTickFormatter(xScale.step)} 
                           label={{ value: labels[plotX], position: 'bottom', offset: 20, fill: styles.chartAxis, fontSize: 18 }} 
                         /> 
                         <YAxis 
                           stroke={styles.chartAxis} 
                           fontSize={16} 
                           domain={[yScale.min, yScale.max]}
                           ticks={yScale.ticks}
                           tickFormatter={getTickFormatter(yScale.step)} 
                           label={{ value: labels[plotY], angle: -90, position: 'insideLeft', offset: -40, fill: styles.chartAxis, fontSize: 18 }} 
                         /> 
                         <Tooltip contentStyle={styles.chartTooltip} formatter={(val) => (typeof val === 'number') ? val.toFixed(3) : val} labelFormatter={(val) => `${labels[plotX]}: ${val}`} /> 
                         <Scatter name={`${t.dataPoints} (${activeObjId === 'COM' ? t.comShort : activeObjId})`} dataKey={plotY} fill={activeObjectColor} />
                         {fitEquation && <Line type="linear" dataKey="fitYContinuous" name={t.curveFit} stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} />}
                         {['x', 'y'].includes(plotY) && ( <Scatter dataKey={plotY} fill="none" stroke="none"> <ErrorBar dataKey="error" width={6} strokeWidth={2} stroke="#60a5fa" direction="y" /> </Scatter> )}
                       </ComposedChart> 
                    </ResponsiveContainer>
                    {points.length < 2 && ( <div className={`absolute inset-0 flex items-center justify-center italic ${styles.textSecondary}`}> Add points in Tracker mode to see data. </div> )}
                  </>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={spectralData.map(p => {
                          let xVal = p.distance;
                          if (spectralMode === 'distance' && pixelsPerMeter) {
                            xVal = p.distance / pixelsPerMeter;
                          } else if (spectralMode === 'wavelength' && wavelengthCalibration && spectralData.length > 1) {
                            const maxIdx = spectralData.length - 1;
                            const t1 = wavelengthCalibration.p1_t !== undefined ? wavelengthCalibration.p1_t : 0.0;
                            const t2 = wavelengthCalibration.p2_t !== undefined ? wavelengthCalibration.p2_t : 1.0;
                            const wl1 = wavelengthCalibration.p1_wl || 400;
                            const wl2 = wavelengthCalibration.p2_wl || 700;
                            
                            let calculatedWl;
                            if (Math.abs(t2 - t1) > 0.0001) {
                              const t_curr = p.index / maxIdx;
                              calculatedWl = wl1 + ((t_curr - t1) / (t2 - t1)) * (wl2 - wl1);
                            } else {
                              calculatedWl = wl1;
                            }
                            xVal = calculatedWl;
                          }
                          return {
                            ...p,
                            xVal: parseFloat(xVal.toFixed(3))
                          };
                        })} 
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
                          label={{ value: t.spectralIntensity, angle: -90, position: 'insideLeft', offset: -40, fill: styles.chartAxis, fontSize: 16 }} 
                        />
                        <Tooltip 
                          contentStyle={styles.chartTooltip} 
                          formatter={(val, name) => {
                            if (name === 'intensity') return [val, t.channelLabel];
                            return [val, name.toUpperCase()];
                          }}
                          labelFormatter={(val) => `${spectralMode === 'distance' ? `${t.spectralDistance} (m)` : spectralMode === 'wavelength' ? `${t.wavelengthUnit} (nm)` : `${t.spectralDistance} (px)`}: ${val}`} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="intensity" 
                          stroke="#84cc16" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        {lineProfile?.channel === 'luma' && (
                          <>
                            <Line type="monotone" dataKey="r" stroke="#ef4444" strokeWidth={1} dot={false} strokeOpacity={0.3} />
                            <Line type="monotone" dataKey="g" stroke="#22c55e" strokeWidth={1} dot={false} strokeOpacity={0.3} />
                            <Line type="monotone" dataKey="b" stroke="#3b82f6" strokeWidth={1} dot={false} strokeOpacity={0.3} />
                          </>
                        )}
                        {spectralMode === 'wavelength' && REFERENCE_EMISSION_LINES.map((line, idx) => {
                          if (!activeReferenceOverlays[line.element]) return null;
                          return (
                            <ReferenceLine
                              key={idx}
                              x={line.wl}
                              stroke={line.color}
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              label={{
                                value: line.label,
                                position: 'top',
                                fill: line.color,
                                fontSize: 10,
                                fontWeight: 'bold',
                                dy: -10
                              }}
                            />
                          );
                        })}
                      </ComposedChart>
                    </ResponsiveContainer>
                    {spectralData.length === 0 && ( <div className={`absolute inset-0 flex items-center justify-center italic ${styles.textSecondary}`}> Activate Line Profile and upload video to see spectral analysis. </div> )}
                  </>
                )}
              </div>
          </div>
        </div>

        <div className={`w-96 border-l flex flex-col p-6 gap-6 shrink-0 ${styles.panel}`}>
           {analysisChartMode === 'kinematics' ? (
             <>
               <div>
                 <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Calculator /> {t.curveFitting} ({activeObjId === 'COM' ? t.comShort : activeObjId})</h3>
                 <div className="flex flex-col gap-2">
                    <label className={`text-sm ${styles.textSecondary}`}>{t.modelType}</label>
                    <select value={fitModel} onChange={(e) => setFitModel(e.target.value)} className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${styles.input}`}>
                      <option value="none">{t.none}</option>
                      <option value="linear">{t.linear}</option>
                      <option value="quadratic">{t.quadratic}</option>
                      <option value="sinusoidal">{t.sinusoidal}</option>
                    </select>
                 </div>
               </div>
               {fitEquation && (
                 <div className={`rounded-xl border p-4 animate-in fade-in slide-in-from-right-4 ${isDark ? 'bg-slate-900/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                   <div className={`font-mono font-bold text-sm mb-4 pb-2 border-b ${isDark ? 'text-orange-400 border-slate-700' : 'text-orange-600 border-slate-200'}`}> {fitEquation.text} </div>
                   <div className="space-y-3">
                      {fitEquation.type === 'Linear' ? (
                        <>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.slope}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.m.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.intercept}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.b.toFixed(4)}</span></div>
                        </>
                      ) : fitEquation.type === 'Quadratic' ? (
                        <>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.aTerm}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.A.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.bTerm}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.B.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.cTerm}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.C.toFixed(4)}</span></div>
                        </>
                      ) : (
                         <>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.amplitude}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.A.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.frequency}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.B.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.phase}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.C.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.offset}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.D.toFixed(4)}</span></div>
                         </>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                        <span className={styles.textSecondary}>R²</span> 
                        <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.r2 ? fitEquation.r2.toFixed(4) : "N/A"}</span>
                      </div>
                   </div>
                 </div>
               )}
             </>
           ) : (
             <>
               <div>
                 <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${styles.text}`}><Info size={18} className="text-lime-500" /> {t.language === 'es' ? 'Líneas de Emisión' : 'Emission Line Guides'}</h3>
                 <p className={`text-xs ${styles.textSecondary} mb-4 leading-normal`}>
                   {t.language === 'es' ? 'Use estas referencias de longitud de onda para identificar elementos químicos en picos espectrales:' : 'Use these standard optical emission peaks as references when identifying elements in your spectral graph:'}
                 </p>
                 <div className="space-y-3.5">
                   {/* Element: Hydrogen */}
                   <div className={`rounded-xl p-3 border transition-colors ${activeReferenceOverlays.h2 ? (isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50/50 border-red-200') : (isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-red-500 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
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
           <div className="flex flex-col gap-2 mt-4">
              
              {/* Legend Position Control */}
              <label className={`text-xs uppercase font-bold tracking-wider mb-1 ${styles.textSecondary} flex items-center gap-2`}>
                <LayoutTemplate size={14} /> {t.legendPos}
              </label>
              <select 
                value={legendPosition} 
                onChange={(e) => setLegendPosition(e.target.value)} 
                className={`border rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-500 ${styles.input}`}
              >
                <option value="top-left">{t.topLeft}</option>
                <option value="top-right">{t.topRight}</option>
                <option value="bottom-left">{t.bottomLeft}</option>
                <option value="bottom-right">{t.bottomRight}</option>
                <option value="none">{t.hide}</option>
              </select>

              <button onClick={exportScientificGraph} className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded transition border bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm`}>
                <Camera size={18} /> {t.exportGraph}
              </button>
              <button onClick={downloadCSV} className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded transition border ${styles.buttonSecondary}`}>
                <Download size={18} /> {t.exportData}
              </button>
           </div>

        </div>
    </div>
  );
}
