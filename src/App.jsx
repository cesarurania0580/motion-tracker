/* eslint-disable */
/* eslint-enable no-undef */
/**
 * PhysTracker
 * Version: 1.1.0
 * Author: Cesar Cortes
 * Powered by: Gemini Pro AI
 * License: MIT
 * * Copyright (c) 2026 Cesar Cortes
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Activity, X, Github, Mail, Coffee } from 'lucide-react';

// --- UTILS & CORE DICTIONARIES ---
import { TRANSLATIONS } from './utils/translations';
import {fitCurve} from './utils/curveFit';
import { calculateNiceScale } from './utils/physicsMath';
import { useStore } from './store/useStore';

// --- SUB-COMPONENTS ---
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AnalysisPanel from './components/AnalysisPanel';
import VideoCanvas from './components/VideoCanvas';
import {useAutotracking} from './hooks/useAutotracking';


export default function App() {
  const videoRef = useRef(null);
  const autotracking = useAutotracking(videoRef);
  // --- ZUSTAND STATE MANAGEMENT ---
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const fps = useStore(state => state.fps);
  const setFps = useStore(state => state.setFps);

  const objects = useStore(state => state.objects);
  const setObjects = useStore(state => state.setObjects);
  const activeObjId = useStore(state => state.activeObjId);
  const setActiveObjId = useStore(state => state.setActiveObjId);

  const videoSrc = useStore(state => state.videoSrc);
  const setVideoSrc = useStore(state => state.setVideoSrc);
  const imageSrc = useStore(state => state.imageSrc);
  const setImageSrc = useStore(state => state.setImageSrc);
  const imageObj = useStore(state => state.imageObj);
  const setImageObj = useStore(state => state.setImageObj);
  const isPlaying = useStore(state => state.isPlaying);
  const setIsPlaying = useStore(state => state.setIsPlaying);
  const setError = useStore(state => state.setError);

  const protractor = useStore(state => state.protractor);
  const setProtractor = useStore(state => state.setProtractor);
  const tapeMeasure = useStore(state => state.tapeMeasure);
  const setTapeMeasure = useStore(state => state.setTapeMeasure);
  const showVelocityVectors = useStore(state => state.showVelocityVectors);
  const setShowVelocityVectors = useStore(state => state.setShowVelocityVectors);
  const showAccelerationVectors = useStore(state => state.showAccelerationVectors);
  const setShowAccelerationVectors = useStore(state => state.setShowAccelerationVectors);
  const vectorScale = useStore(state => state.vectorScale);
  const setVectorScale = useStore(state => state.setVectorScale);

  const lineProfile = useStore(state => state.lineProfile);
  const setLineProfile = useStore(state => state.setLineProfile);
  const wavelengthCalibration = useStore(state => state.wavelengthCalibration);
  const setWavelengthCalibration = useStore(state => state.setWavelengthCalibration);
  const spectralMode = useStore(state => state.spectralMode);
  const setSpectralMode = useStore(state => state.setSpectralMode);
  const activeReferenceOverlays = useStore(state => state.activeReferenceOverlays);
  const setActiveReferenceOverlays = useStore(state => state.setActiveReferenceOverlays);
  const showGuidelines = useStore(state => state.showGuidelines);
  const setShowGuidelines = useStore(state => state.setShowGuidelines);
  
  const theme = useStore(state => state.theme);
  const isDark = theme === 'dark';

  const showAboutModal = useStore(state => state.showAboutModal);
  const setShowAboutModal = useStore(state => state.setShowAboutModal);

  const viewMode = useStore(state => state.viewMode);
  const setViewMode = useStore(state => state.setViewMode);
  const zeroTime = useStore(state => state.zeroTime);
  const setZeroTime = useStore(state => state.setZeroTime);

  const fitModel = useStore(state => state.fitModel);
  const setFitModel = useStore(state => state.setFitModel);
  
  const cropStart = useStore(state => state.cropStart);
  const setCropStart = useStore(state => state.setCropStart);
  const cropEnd = useStore(state => state.cropEnd);
  const setCropEnd = useStore(state => state.setCropEnd);

  const isCalibrating = useStore(state => state.isCalibrating);
  const setIsCalibrating = useStore(state => state.setIsCalibrating);
  const setIsSettingOrigin = useStore(state => state.setIsSettingOrigin);
  const calibrationPoints = useStore(state => state.calibrationPoints);
  const setCalibrationPoints = useStore(state => state.setCalibrationPoints);
  const pixelsPerMeter = useStore(state => state.pixelsPerMeter);
  const setPixelsPerMeter = useStore(state => state.setPixelsPerMeter);
  const showInputModal = useStore(state => state.showInputModal);
  const setShowInputModal = useStore(state => state.setShowInputModal);
  const realDistanceInput = useStore(state => state.realDistanceInput);
  const setRealDistanceInput = useStore(state => state.setRealDistanceInput);
  const isScaleVisible = useStore(state => state.isScaleVisible);
  const setIsScaleVisible = useStore(state => state.setIsScaleVisible);

  const origin = useStore(state => state.origin);
  const setOrigin = useStore(state => state.setOrigin);
  const originAngle = useStore(state => state.originAngle);
  const setOriginAngle = useStore(state => state.setOriginAngle);

  const currentFrameIndex = useStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = useStore(state => state.setCurrentFrameIndex);
  const reticlePos = useStore(state => state.reticlePos);
  const setReticlePos = useStore(state => state.setReticlePos);
  const setZoom = useStore(state => state.setZoom);
  const videoDims = useStore(state => state.videoDims);
  const setVideoDims = useStore(state => state.setVideoDims);
  const setDragState = useStore(state => state.setDragState);
  const setDuration = useStore(state => state.setDuration);
  const setCurrentTime = useStore(state => state.setCurrentTime);
  const setUncertaintyPx = useStore(state => state.setUncertaintyPx);

  const hasRestoredData = useStore(state => state.hasRestoredData);
  const setHasRestoredData = useStore(state => state.setHasRestoredData);

  const plotX = useStore(state => state.plotX);
  const plotY = useStore(state => state.plotY);
  const uncertaintyPx = useStore(state => state.uncertaintyPx);

  const styles = {
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
  };

  // DERIVED STATE: 'points' acts as a proxy for the active object's points OR the calculated COM
  const points = useMemo(() => {
    const safeObjects = objects || [];
    if (activeObjId === 'COM') {
      const objA = safeObjects.find(o => o.id === 'A') || { points: [], mass: 1 };
      const objB = safeObjects.find(o => o.id === 'B') || { points: [], mass: 1 };
      const mA = typeof objA.mass === 'number' ? objA.mass : 1;
      const mB = typeof objB.mass === 'number' ? objB.mass : 1;
      const comPoints = [];
      
      // Match points by timestamp to calculate COM
      objA.points.forEach(pA => {
        const pB = objB.points.find(pb => Math.abs(pb.time - pA.time) < 0.005);
        if (pB) {
          comPoints.push({
            id: `com-${pA.time}`,
            time: pA.time,
            x: (mA * pA.x + mB * pB.x) / (mA + mB),
            y: (mA * pA.y + mB * pB.y) / (mA + mB)
          });
        }
      });
      return comPoints;
    }
    return safeObjects.find(o => o.id === activeObjId)?.points || [];
  }, [objects, activeObjId]);

  const activeObjectColor = useMemo(() => {
    if (activeObjId === 'COM') return '#a855f7';
    return (objects || []).find(o => o.id === activeObjId)?.color || '#ef4444';
  }, [objects, activeObjId]);

  const handleObjectSwitch = useCallback((id) => {
    setActiveObjId(id);
    if (id === 'COM') {
      useStore.getState().setIsTracking(false);
      useStore.getState().setDragState(null);
      useStore.getState().setDraggedPointIndex(null);
    }
  }, [setActiveObjId]);

  const handleScaleButtonClick = () => {
    if (pixelsPerMeter) {
      setIsScaleVisible(!isScaleVisible);
    } else {
      if (!isCalibrating) {
        setIsCalibrating(true);
        setIsSettingOrigin(false);
        setIsScaleVisible(true);
        useStore.getState().setIsTracking(false);
        setReticlePos(null);
        const w = videoDims.w || 600;
        const h = videoDims.h || 400;
        setCalibrationPoints([{ x: w * 0.4, y: h * 0.5 }, { x: w * 0.6, y: h * 0.5 }]);
      } else {
        setShowInputModal(true);
      }
    }
  };

  const resetScale = () => { 
    setPixelsPerMeter(null); 
    setCalibrationPoints([]); 
    setIsCalibrating(false); 
    setIsScaleVisible(true); 
  };

  const saveProject = () => {
    const stateToSave = {
        meta: { version: "1.1.0", date: new Date().toISOString() },
        objects,
        activeObjId,
        calibrationPoints,
        pixelsPerMeter,
        origin,
        originAngle,
        zeroTime,
        fitModel,
        uncertaintyPx,
        language,
        fps,
        cropStart,
        cropEnd,
        protractor,
        tapeMeasure,
        showVelocityVectors,
        showAccelerationVectors,
        vectorScale,
        lineProfile,
        wavelengthCalibration,
        spectralMode,
        activeReferenceOverlays,
        showGuidelines
    };
    const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phys_tracker_project_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadProject = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.objects) {
          const migratedObjects = data.objects.map(o => ({ ...o, mass: o.mass !== undefined ? o.mass : 1 }));
          setObjects(migratedObjects);
          setActiveObjId(data.activeObjId || 'A');
        } else {
          setObjects([
            { id: 'A', name: 'Object A', color: '#ef4444', points: data.points || [], mass: 1 },
            { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
          ]);
          setActiveObjId('A');
        }

        setCalibrationPoints(data.calibrationPoints || []);
        setPixelsPerMeter(data.pixelsPerMeter || null);
        setOrigin(data.origin || null);
        setOriginAngle(data.originAngle || 0);
        setZeroTime(data.zeroTime !== undefined ? data.zeroTime : true);
        setFitModel(data.fitModel || 'none');
        setUncertaintyPx(data.uncertaintyPx || 10);
        setHasRestoredData(true);
        setVideoSrc(null); 
        setImageSrc(null);
        setImageObj(null);
        if (data.language) setLanguage(data.language);
        if (data.fps) setFps(data.fps);
        setCropStart(data.cropStart || '');
        setCropEnd(data.cropEnd || '');
        setProtractor(data.protractor || null);
        setTapeMeasure(data.tapeMeasure || null);
        setShowVelocityVectors(data.showVelocityVectors || false);
        setShowAccelerationVectors(data.showAccelerationVectors || false);
        setVectorScale(data.vectorScale || 1.0);
        setLineProfile(data.lineProfile || null);
        setWavelengthCalibration(data.wavelengthCalibration || null);
        setSpectralMode(data.spectralMode || 'pixels');
        setActiveReferenceOverlays(data.activeReferenceOverlays || { h2: false, he: false, hg: false });
        setShowGuidelines(data.showGuidelines !== undefined ? data.showGuidelines : true);
        
        alert("Project loaded successfully. Please upload the corresponding video or image file.");
      } catch (err) {
        alert("Invalid Project File");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const clearProject = () => {
    if (confirm("Are you sure? This will delete all data and reset the app.")) {
      if (typeof window !== 'undefined') {
        window.isResetting = true;
      }
      useStore.getState().resetProject();
      window.location.reload();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      const url = URL.createObjectURL(file);
      
      if (!hasRestoredData) {
          setObjects([
            { id: 'A', name: 'Object A', color: '#ef4444', points: [], mass: 1 },
            { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
          ]);
          setCalibrationPoints([]);
          setPixelsPerMeter(null);
          setOrigin(null);
          setOriginAngle(0);
          setFitModel('none');
          setVideoDims({ w: 0, h: 0 });
      } else {
          setHasRestoredData(false);
      }

      setIsPlaying(false);
      setError(null);
      setShowInputModal(false);
      setIsScaleVisible(true);
      setDragState(null);
      setZoom(1.0);
      setZeroTime(true); 
      useStore.getState().setIsTracking(false);
      setReticlePos(null);
      setUncertaintyPx(10);
      setDuration(0);
      setCurrentTime(0);
      setCurrentFrameIndex(0);
      setViewMode('tracker');
      setCropStart('');
      setCropEnd('');
      if (activeObjId === 'COM') setActiveObjId('A');

      if (file.type.startsWith('image/')) {
        setVideoSrc(null);
        setImageSrc(url);
        
        const imgObj = new Image();
        imgObj.src = url;
        imgObj.onload = () => {
          setImageObj(imgObj);
          setVideoDims({ w: imgObj.width, h: imgObj.height });
          setDuration(0.033);
        };
        imgObj.onerror = () => {
          setError("Error loading image.");
        };
      } else {
        setImageSrc(null);
        setImageObj(null);
        setVideoSrc(url);
      }
    }
  };

  // --- MATH & DATA PROCESSING ---
  const getRotatedCoords = (rawX, rawY) => {
    if (!origin) return { x: rawX, y: rawY };
    const dx = rawX - origin.x; const dy = rawY - origin.y;
    const cos = Math.cos(originAngle); const sin = Math.sin(originAngle);
    return { x: dx * cos + dy * sin, y: -(-dx * sin + dy * cos) };
  };
  const formatVal = (val) => pixelsPerMeter ? val / pixelsPerMeter : val;
  const startTime = points.length > 0 ? Math.min(...points.map(p => p.time)) : 0;
  const uncertaintyMeters = pixelsPerMeter ? (uncertaintyPx / pixelsPerMeter) : 0;

  // Calculate Base Physics Data
  const { positionData, velocityData } = useMemo(() => {
    const sortedPoints = points.sort((a, b) => a.time - b.time);
    const posData = sortedPoints.map((p) => {
        const { x: rx, y: ry } = getRotatedCoords(p.x, p.y);
        const adjustedTime = zeroTime ? (p.time - startTime) : p.time;
        return {
          time: adjustedTime,
          x: formatVal(rx),
          y: formatVal(ry),
          error: uncertaintyMeters
        };
    });

    const velData = [];
    const N = sortedPoints.length - 1;

    for (let i = 0; i <= N; i++) {
        if (N < 2) break;

        const pCurrent = sortedPoints[i];
        const adjustedTime = zeroTime ? (pCurrent.time - startTime) : pCurrent.time;

        let vx = null;
        let vy = null;

        if (i === 0) {
            const p0 = sortedPoints[0];
            const p1 = sortedPoints[1];
            const p2 = sortedPoints[2];

            const { x: x0, y: y0 } = getRotatedCoords(p0.x, p0.y);
            const { x: x1, y: y1 } = getRotatedCoords(p1.x, p1.y);
            const { x: x2, y: y2 } = getRotatedCoords(p2.x, p2.y);

            const t0 = p0.time;
            const t1 = p1.time;
            const t2 = p2.time;

            const dt = t1 - t0;
            if (dt > 0.0001) {
                vx = (-3*formatVal(x0) + 4*formatVal(x1) - formatVal(x2)) / (2*dt);
                vy = (-3*formatVal(y0) + 4*formatVal(y1) - formatVal(y2)) / (2*dt);
            }
        }
        else if (i === N) {
            const pN = sortedPoints[N];
            const pN1 = sortedPoints[N-1];
            const pN2 = sortedPoints[N-2];

            const { x: xN, y: yN } = getRotatedCoords(pN.x, pN.y);
            const { x: xN1, y: yN1 } = getRotatedCoords(pN1.x, pN1.y);
            const { x: xN2, y: yN2 } = getRotatedCoords(pN2.x, pN2.y);

            const tN = pN.time;
            const tN1 = pN1.time;
            
            const dt = tN - tN1;
            if (dt > 0.0001) {
                vx = (3*formatVal(xN) - 4*formatVal(xN1) + formatVal(xN2)) / (2*dt);
                vy = (3*formatVal(yN) - 4*formatVal(yN1) + formatVal(yN2)) / (2*dt);
            }
        }
        else {
            const pPrev = sortedPoints[i-1];
            const pNext = sortedPoints[i+1];
            
            const dt = pNext.time - pPrev.time;
            
            if (dt > 0.0001) {
                const { x: prvX, y: prvY } = getRotatedCoords(pPrev.x, pPrev.y);
                const { x: nxtX, y: nxtY } = getRotatedCoords(pNext.x, pNext.y);

                vx = (formatVal(nxtX) - formatVal(prvX)) / dt;
                vy = (formatVal(nxtY) - formatVal(prvY)) / dt;
            }
        }

        if (vx !== null && vy !== null) {
            velData.push({
                time: adjustedTime,
                vx: vx,
                vy: vy,
                x: null, 
                y: null,
                error: null 
            });
        }
    }

    return { positionData: posData, velocityData: velData };
  }, [points, origin, originAngle, pixelsPerMeter, zeroTime, uncertaintyPx, startTime, fps]);

  const activeData = useMemo(() => {
      let data = ['vx', 'vy'].includes(plotY) ? velocityData : positionData;
      
      const start = parseFloat(cropStart);
      const end = parseFloat(cropEnd);
      
      if (!isNaN(start)) {
          data = data.filter(d => d.time >= start);
      }
      if (!isNaN(end)) {
          data = data.filter(d => d.time <= end);
      }

      return data;
  }, [plotY, positionData, velocityData, cropStart, cropEnd]);

  // Curve fitting calculations
  const fitEquation = useMemo(() => {
    return fitCurve(activeData, fitModel, plotX, plotY);
  }, [fitModel, activeData, plotX, plotY]);

  const xScale = useMemo(() => {
    if (activeData.length === 0) return { min: 0, max: 10, ticks: [], step: 1 };
    const vals = activeData.map(d => d[plotX]).filter(v => isFinite(v));
    return calculateNiceScale(Math.min(...vals), Math.max(...vals), plotX === 'time');
  }, [activeData, plotX]);

  const yScale = useMemo(() => {
    if (activeData.length === 0) return { min: 0, max: 10, ticks: [], step: 1 };
    const vals = activeData.map(d => d[plotY]).filter(v => isFinite(v));
    return calculateNiceScale(Math.min(...vals), Math.max(...vals), false);
  }, [activeData, plotY]);

  const chartData = useMemo(() => {
    if (!fitEquation) return activeData;

    const base = activeData.map(d => ({
      ...d,
      fitY: (d[plotX] !== null && isFinite(d[plotX])) ? fitEquation.fn(d[plotX]) : null
    }));

    if (activeData.length === 0 || xScale.min === undefined || xScale.max === undefined) {
      return base;
    }

    const minX = xScale.min;
    const maxX = xScale.max;
    const range = maxX - minX;
    if (range <= 0) return base;

    const cycles = fitEquation.type === 'Sinusoidal' ? fitEquation.params.B * range / (2 * Math.PI) : 0;
    const resolution = Math.min(8192, Math.max(150, Math.ceil(cycles * 32)));
    const step = range / resolution;
    const virtualPoints = [];

    for (let i = 0; i <= resolution; i++) {
      const vx = minX + i * step;
      virtualPoints.push({
        [plotX]: vx,
        fitYContinuous: fitEquation.fn(vx),
        isVirtual: true
      });
    }

    return [...base, ...virtualPoints];
  }, [activeData, fitEquation, plotX, xScale]);

  const downloadCSV = () => {
    const headers = ["Time (s)", "X (m)", "Y (m)", "Uncertainty (m)"];
    const rows = positionData.map(row => `${row.time},${row.x},${row.y},${row.error}`);
    const vHeaders = ["\nVelocity Data (Central Difference)", "Time (s)", "Vx (m/s)", "Vy (m/s)"];
    const vRows = velocityData.map(row => `,${row.time},${row.vx},${row.vy}`);
    const csvContent = headers.join(",") + "\n" + rows.join("\n") + "\n" + vHeaders.join(",") + "\n" + vRows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + csvContent));
    link.setAttribute("download", `motion_data_${activeObjId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex flex-col h-screen font-sans transition-colors duration-200 ${styles.bg} ${styles.text}`}>
      {/* HEADER WITH VIEW SWITCHER */}
      <Header
        autotracking={autotracking}
        handleObjectSwitch={handleObjectSwitch}
        handleScaleButtonClick={handleScaleButtonClick}
        handleFileUpload={handleFileUpload}
        saveProject={saveProject}
        loadProject={loadProject}
        clearProject={clearProject}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* VIEW 1: TRACKER MODE */}
        <div className={`flex-1 flex overflow-hidden ${viewMode === 'tracker' ? '' : 'hidden'}`}>
            <VideoCanvas points={points} videoRef={videoRef} autotracking={autotracking} />
            <Sidebar
              autotracking={autotracking}
              positionData={positionData}
              uncertaintyMeters={uncertaintyMeters}
              resetScale={resetScale}
              downloadCSV={downloadCSV}
              points={points}
            />
        </div>

        {/* VIEW 2: ANALYSIS MODE (Full Screen) */}
        <AnalysisPanel
          chartData={chartData}
          xScale={xScale}
          yScale={yScale}
          fitEquation={fitEquation}
          activeObjectColor={activeObjectColor}
          downloadCSV={downloadCSV}
          points={points}
        />
      </div>

       {/* --- ABOUT MODAL --- */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAboutModal(false)}>
            <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full relative transform transition-all scale-100 ${styles.panel}`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAboutModal(false)} className={`absolute top-4 right-4 p-1 rounded-full hover:bg-black/10 transition ${styles.textSecondary}`}>
                <X size={20} />
            </button>
            
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 text-blue-500">
                <Activity size={32} strokeWidth={2.5} /> PhysTracker
            </h2>
            
            <div className={`space-y-6 ${styles.text}`}>
                <p className="text-lg font-medium opacity-90 leading-relaxed">
                    {t.aboutDesc}
                </p>
                
                <div className={`p-5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm items-center">
                        <span className="opacity-60 font-semibold">{t.version}</span>
                        <span className="font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit dark:bg-blue-900/50 dark:text-blue-300">1.1.0</span>
                        
                        <span className="opacity-60 font-semibold">{t.author}</span>
                        <span>Cesar Cortes</span>
                        
                        <span className="opacity-60 font-semibold">{t.engine}</span>
                        <span className="flex items-center gap-1">Gemini Pro AI ✨</span>
                        
                        <span className="opacity-60 font-semibold">{t.license}</span>
                        <span>MIT Open Source</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <a href="https://github.com/cesarurania0580/motion-tracker" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition">
                        <Github size={18} /> {t.visitGithub}
                    </a>
                    <div className="flex gap-3">
                        <a href="mailto:phystracker.contact@gmail.com" className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition ${styles.buttonSecondary}`}>
                            <Mail size={18} /> {t.sendFeedback}
                        </a>
                        <a href="https://buymeacoffee.com/phystracker" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-300 transition">
                            <Coffee size={18} /> {t.buyCoffee}
                        </a>
                    </div>
                </div>

                <div className="text-xs opacity-50 text-center pt-4 border-t border-slate-700/30 leading-relaxed">
                    Copyright © 2026 Cesar Cortes. {t.rights}<br/>
                    {t.licensedUnder}
                </div>
            </div>
            </div>
        </div>
      )}

    </div>
  );
}
