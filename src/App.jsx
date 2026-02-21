/**
 * PhysTracker
 * Version: 1.0.0
 * Author: Cesar Cortes
 * Powered by: Gemini Pro AI
 * License: MIT
 * * Copyright (c) 2026 Cesar Cortes
 * * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Upload, Trash2, Play, Pause, AlertCircle, Ruler, Crosshair, Table, Activity, SkipBack, SkipForward, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Maximize, Undo2, CheckCircle2, Info, Download, TrendingUp, Clock, Target, CircleDashed, Calculator, Sun, Moon, Camera, LayoutTemplate, Save, FolderOpen, RefreshCw, Users, X, Languages, Coffee, Github, Mail, Move, Menu } from 'lucide-react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar } from 'recharts';

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

// --- TRANSLATIONS DICTIONARY ---
const TRANSLATIONS = {
  en: {
    appTitle: "PhysTracker",
    trackerMode: "Tracker",
    analysisMode: "Analysis",
    saveProject: "Save Project",
    loadProject: "Load Project",
    resetData: "Reset / Clear Data",
    waitingVideo: "Waiting for Video",
    startTracking: "Start Tracking",
    stopTracking: "Stop Tracking",
    setOrigin: "Set Origin",
    moveOrigin: "Move Origin",
    setScale: "Set Scale",
    hideScale: "Hide Scale",
    showScale: "Show Scale",
    enterDistance: "Enter Distance",
    uploadVideo: "Upload Video",
    dropToDelete: "Drop to Delete",
    setRealDistance: "Set Real Distance",
    cancel: "Cancel",
    save: "Save",
    uploadPrompt: "Upload a video to begin analysis",
    undoLast: "Undo Last Point",
    prevFrame: "Previous Frame",
    nextFrame: "Next Frame",
    playPause: "Play/Pause",
    zoomOut: "Zoom Out",
    zoomIn: "Zoom In",
    resetView: "Reset View",
    dataTable: "Data Table",
    originLabel: "Origin",
    scaleLabel: "Scale",
    notSet: "Not Set",
    timeStart: "t=0 at Start",
    videoTime: "Video Time",
    blurSize: "Blur Size / Uncertainty",
    clearData: "Clear Data",
    downloadCSV: "Download CSV",
    noData: "No data points yet for Object",
    yAxis: "Y-Axis",
    xAxis: "X-Axis",
    curveFitting: "Curve Fitting",
    modelType: "Model Type",
    none: "None",
    linear: "Linear (mx + b)",
    quadratic: "Quadratic (Ax² + Bx + C)",
    slope: "Slope (m)",
    intercept: "Intercept (b)",
    aTerm: "A term",
    bTerm: "B term",
    cTerm: "C term",
    legendPos: "Legend Position (Export)",
    topLeft: "Top Left",
    topRight: "Top Right",
    bottomLeft: "Bottom Left",
    bottomRight: "Bottom Right",
    hide: "None (Hide)",
    exportGraph: "Export Graph (PNG)",
    exportData: "Export Data (CSV)",
    objectA: "Object A",
    objectB: "Object B",
    about: "About PhysTracker",
    switchTheme: "Switch Theme",
    version: "Version",
    author: "Author",
    engine: "Engine",
    license: "License",
    rights: "All rights reserved.",
    licensedUnder: "Licensed under the MIT License.",
    aboutDesc: "A professional-grade, open-source video analysis tool designed for physics education.",
    tapToFire: "TAP TO FIRE",
    // Graph Labels
    xPos: "X Position (m)",
    yPos: "Y Position (m)",
    xVel: "X Velocity (m/s)",
    yVel: "Y Velocity (m/s)",
    time: "Time (s)",
    dataPoints: "Data Points",
    trendLine: "Trend Line",
    calcVel: "Calculated Velocity Data",
    expPos: "Experimental Position Data",
    // NEW TRANSLATIONS
    fpsLabel: "Frame Rate (FPS)",
    fpsTooltip: "Set to 60 for high-speed videos",
    // Link Buttons
    visitGithub: "Visit GitHub",
    sendFeedback: "Send Feedback",
    buyCoffee: "Support Project",
    moreOptions: "More Options"
  },
  es: {
    appTitle: "PhysTracker",
    trackerMode: "Rastreador",
    analysisMode: "Análisis",
    saveProject: "Guardar Proyecto",
    loadProject: "Cargar Proyecto",
    resetData: "Reiniciar / Borrar Datos",
    waitingVideo: "Esperando Video",
    startTracking: "Iniciar Rastreo",
    stopTracking: "Detener Rastreo",
    setOrigin: "Fijar Origen",
    moveOrigin: "Mover Origen",
    setScale: "Fijar Escala",
    hideScale: "Ocultar Escala",
    showScale: "Mostrar Escala",
    enterDistance: "Ingresar Distancia",
    uploadVideo: "Subir Video",
    dropToDelete: "Soltar para Borrar",
    setRealDistance: "Fijar Distancia Real",
    cancel: "Cancelar",
    save: "Guardar",
    uploadPrompt: "Sube un video para comenzar el análisis",
    undoLast: "Deshacer Último Punto",
    prevFrame: "Cuadro Anterior",
    nextFrame: "Siguiente Cuadro",
    playPause: "Reproducir/Pausar",
    zoomOut: "Alejar",
    zoomIn: "Acercar",
    resetView: "Vista Original",
    dataTable: "Tabla de Datos",
    originLabel: "Origen",
    scaleLabel: "Escala",
    notSet: "No Definido",
    timeStart: "t=0 al Inicio",
    videoTime: "Tiempo del Video",
    blurSize: "Tamaño de Desenfoque / Incertidumbre",
    clearData: "Borrar Datos",
    downloadCSV: "Descargar CSV",
    noData: "Aún no hay datos para el Objeto",
    yAxis: "Eje Y",
    xAxis: "Eje X",
    curveFitting: "Ajuste de Curva",
    modelType: "Tipo de Modelo",
    none: "Ninguno",
    linear: "Lineal (mx + b)",
    quadratic: "Cuadrática (Ax² + Bx + C)",
    slope: "Pendiente (m)",
    intercept: "Intersección (b)",
    aTerm: "Término A",
    bTerm: "Término B",
    cTerm: "Término C",
    legendPos: "Posición de Leyenda (Exportar)",
    topLeft: "Arriba Izquierda",
    topRight: "Arriba Derecha",
    bottomLeft: "Abajo Izquierda",
    bottomRight: "Abajo Derecha",
    hide: "Ninguna (Ocultar)",
    exportGraph: "Exportar Gráfico (PNG)",
    exportData: "Exportar Datos (CSV)",
    objectA: "Objeto A",
    objectB: "Objeto B",
    about: "Acerca de PhysTracker",
    switchTheme: "Cambiar Tema",
    version: "Versión",
    author: "Autor",
    engine: "Motor",
    license: "Licencia",
    rights: "Todos los derechos reservados.",
    licensedUnder: "Licenciado bajo la Licencia MIT.",
    aboutDesc: "Una herramienta de análisis de video de código abierto y nivel profesional diseñada para la educación en física.",
    tapToFire: "TOCA PARA MARCAR",
    // Graph Labels
    xPos: "Posición X (m)",
    yPos: "Posición Y (m)",
    xVel: "Velocidad X (m/s)",
    yVel: "Velocidad Y (m/s)",
    time: "Tiempo (s)",
    dataPoints: "Puntos de Datos",
    trendLine: "Línea de Tendencia",
    calcVel: "Datos de Velocidad Calculados",
    expPos: "Datos de Posición Experimentales",
    // NEW TRANSLATIONS
    fpsLabel: "Velocidad (FPS)",
    fpsTooltip: "Usar 60 para videos de alta velocidad",
    // Link Buttons
    visitGithub: "Ver en GitHub",
    sendFeedback: "Enviar Comentarios",
    buyCoffee: "Apoyar Proyecto",
    moreOptions: "Más Opciones"
  }
};

// --- SUB-COMPONENT: PURE VIDEO PLAYER ---
// Memoized to prevent layout thrashing. 
const PureVideoPlayer = React.memo(({ videoRef, src, onLoadedMetadata, onLoadedData, onEnded, onError, onTimeUpdate, onSeeked }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'translateZ(0)', willChange: 'transform' }}>
      <video 
        ref={videoRef} 
        key={src} 
        src={src} 
        className="block w-full h-full object-fill" 
        onLoadedMetadata={onLoadedMetadata} 
        onLoadedData={onLoadedData} // Critical: Fires when first frame is ready to draw
        onEnded={onEnded} 
        onError={onError}
        onTimeUpdate={onTimeUpdate} 
        onSeeked={onSeeked}         
        playsInline 
      />
    </div>
  );
});

// --- MATH HELPER: NICE NUMBERS ALGORITHM ---
const calculateNiceScale = (minValue, maxValue, lockZero = false) => {
  if (!isFinite(minValue) || !isFinite(maxValue) || minValue === maxValue) return { min: 0, max: 10, ticks: [0, 10], step: 1 };

  const range = maxValue - minValue;
  const padding = range === 0 ? 1 : range * 0.05;
  // MODIFIED: If lockZero is true and we have positive data, force start at 0
  const paddedMin = (lockZero && minValue >= 0) ? 0 : minValue - padding;
  const paddedMax = maxValue + padding;
  const paddedRange = paddedMax - paddedMin;

  const targetTickCount = 6; 
  const rawStep = paddedRange / targetTickCount;
  const mag = Math.floor(Math.log10(rawStep));
  const magPow = Math.pow(10, mag);
  let magStep = rawStep / magPow;

  if (magStep < 1.5) magStep = 1;
  else if (magStep < 2.25) magStep = 2;
  else if (magStep < 3.5) magStep = 2.5; 
  else if (magStep < 7.5) magStep = 5;
  else magStep = 10;

  const niceStep = magStep * magPow;
  const niceMin = Math.floor(paddedMin / niceStep) * niceStep;
  const niceMax = Math.ceil(paddedMax / niceStep) * niceStep;

  const ticks = [];
  for (let t = niceMin; t <= niceMax + (niceStep/100); t += niceStep) {
    ticks.push(parseFloat(t.toFixed(4))); 
  }

  return { min: niceMin, max: niceMax, ticks, step: niceStep };
};

export default function App() {
  // --- STATE MANAGEMENT ---
  
  // NEW: Language State
  const [language, setLanguage] = useState('en');
  // CRITICAL FIX: Fallback to English if language is invalid to prevent blank screen crash
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // NEW: FPS State (Default 30)
  const [fps, setFps] = useState(30);

  // NEW: Logo Error State (Fallback for Canvas/Preview)
  const [logoError, setLogoError] = useState(false);

  // NEW: Header Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // NEW: Multi-Object State
  const [objects, setObjects] = useState([
    { id: 'A', name: 'Object A', color: '#ef4444', points: [] }, // Red
    { id: 'B', name: 'Object B', color: '#3b82f6', points: [] }  // Blue
  ]);
  const [activeObjId, setActiveObjId] = useState('A');

  // DERIVED STATE: 'points' acts as a proxy for the active object's points
  // This ensures all existing logic (math, rendering, graphing) works without massive refactoring
  const points = useMemo(() => {
    return objects.find(o => o.id === activeObjId)?.points || [];
  }, [objects, activeObjId]);

  // PROXY SETTER: Updates only the active object within the objects array
  const setPoints = useCallback((newPointsInput) => {
    setObjects(prevObjects => {
      return prevObjects.map(obj => {
        if (obj.id !== activeObjId) return obj;
        
        // Handle both value and function updates (standard useState behavior)
        const nextPoints = typeof newPointsInput === 'function' 
          ? newPointsInput(obj.points) 
          : newPointsInput;
          
        return { ...obj, points: nextPoints };
      });
    });
  }, [activeObjId]);

  const activeObjectColor = useMemo(() => objects.find(o => o.id === activeObjId)?.color || '#ef4444', [objects, activeObjId]);

  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  
  // THEME STATE
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';

  // NEW: About Modal State
  const [showAboutModal, setShowAboutModal] = useState(false);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage(l => l === 'en' ? 'es' : 'en');

  // --- THEME CONFIGURATION ---
  const styles = {
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    panelBgOnly: isDark ? 'bg-slate-800' : 'bg-white',
    panelBorder: isDark ? 'border-slate-700' : 'border-slate-200',
    input: isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900',
    inputLabel: isDark ? 'text-slate-400' : 'text-slate-600',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    tableHeader: isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700',
    tableRow: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
    tableCell: isDark ? 'text-slate-200' : 'text-slate-800',
    tableDivider: isDark ? 'divide-slate-800' : 'divide-slate-200',
    workspaceBg: isDark ? 'bg-black/50' : 'bg-slate-200',
    chartGrid: isDark ? "#475569" : "#e2e8f0",
    chartAxis: isDark ? "#94a3b8" : "#64748b",
    chartTooltip: isDark ? { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' } : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }
  };

  // VIEW STATE
  const [viewMode, setViewMode] = useState('tracker');
  const [graphMode, setGraphMode] = useState('position'); 
  const [zeroTime, setZeroTime] = useState(true); 

  // Analysis State
  const [fitModel, setFitModel] = useState('none'); 
  const [legendPosition, setLegendPosition] = useState('top-left');

  const [isCalibrating, setIsCalibrating] = useState(false); 
  const [calibrationPoints, setCalibrationPoints] = useState([]); 
  const [pixelsPerMeter, setPixelsPerMeter] = useState(null); 
  const [showInputModal, setShowInputModal] = useState(false);
  const [realDistanceInput, setRealDistanceInput] = useState("1.0");
  const [isScaleVisible, setIsScaleVisible] = useState(true);

  const [isSettingOrigin, setIsSettingOrigin] = useState(false);
  const [origin, setOrigin] = useState(null); 
  const [originAngle, setOriginAngle] = useState(0); 

  // NEW: Master Frame Counter (Digital Twin for Robust Stepping)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const [isTracking, setIsTracking] = useState(false);
  // NEW: Reticle State for Phase 1 Step 2
  const [reticlePos, setReticlePos] = useState(null);

  // Zoom & Dimensions
  const [zoom, setZoom] = useState(1.0);
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 }); 

  const [dragState, setDragState] = useState(null); 
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);
  
  // NEW: Ref to track drag distance for Tap vs Drag detection
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  // NEW: Ref to store offset between cursor and object center during drag
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [uncertaintyPx, setUncertaintyPx] = useState(10);

  // Timeline State
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const trashRef = useRef(null); 
  const scrollContainerRef = useRef(null);
  const chartRef = useRef(null); 
  const animationFrameRef = useRef(null);
  // NEW: Ref for video callback ID (Phase 2)
  const videoCallbackRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for file input

  // NEW: State to track if data was restored from persistence
  const [hasRestoredData, setHasRestoredData] = useState(false);
  
  // NEW: Ref for custom touch panning
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // --- GRAPH STATE ---
  const [plotX, setPlotX] = useState('time');
  const [plotY, setPlotY] = useState('x');

  // --- 0. PERSISTENCE LOGIC (NEW) ---

  // Auto-Load on Mount
  useEffect(() => {
    const savedData = localStorage.getItem('physTracker_autosave');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // MIGRATION LOGIC: Handle old saves with single 'points'
            if (data.objects) {
                setObjects(data.objects);
                if (data.activeObjId) setActiveObjId(data.activeObjId);
            } else if (data.points) {
                setObjects([
                    { id: 'A', name: 'Object A', color: '#ef4444', points: data.points },
                    { id: 'B', name: 'Object B', color: '#3b82f6', points: [] }
                ]);
            }

            // Flag if we have ANY data
            const hasData = (data.objects && data.objects.some(o => o.points.length > 0)) || (data.points && data.points.length > 0);
            if (hasData) {
                setHasRestoredData(true);
            }

            if (data.calibrationPoints) setCalibrationPoints(data.calibrationPoints);
            if (data.pixelsPerMeter) setPixelsPerMeter(data.pixelsPerMeter);
            if (data.origin) setOrigin(data.origin);
            if (data.originAngle) setOriginAngle(data.originAngle);
            if (data.zeroTime !== undefined) setZeroTime(data.zeroTime);
            if (data.fitModel) setFitModel(data.fitModel);
            if (data.uncertaintyPx) setUncertaintyPx(data.uncertaintyPx);
            if (data.viewMode) setViewMode(data.viewMode);
            if (data.language) setLanguage(data.language); 
            if (data.fps) setFps(data.fps); // Restore FPS
        } catch (e) {
            console.error("Failed to restore autosave", e);
        }
    }
  }, []);

  // Auto-Save on Change
  useEffect(() => {
    const stateToSave = {
        objects, // Saving full objects array
        activeObjId,
        calibrationPoints,
        pixelsPerMeter,
        origin,
        originAngle,
        zeroTime,
        fitModel,
        uncertaintyPx,
        viewMode,
        language,
        fps // Save FPS
    };
    localStorage.setItem('physTracker_autosave', JSON.stringify(stateToSave));
  }, [objects, activeObjId, calibrationPoints, pixelsPerMeter, origin, originAngle, zeroTime, fitModel, uncertaintyPx, viewMode, language, fps]);

  const saveProject = () => {
    const stateToSave = {
        meta: { version: "1.0.0", date: new Date().toISOString() }, // Version 1.0.0
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
        fps // Save FPS
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
              
              // MIGRATION LOGIC
              if (data.objects) {
                  setObjects(data.objects);
                  setActiveObjId(data.activeObjId || 'A');
              } else {
                  setObjects([
                    { id: 'A', name: 'Object A', color: '#ef4444', points: data.points || [] },
                    { id: 'B', name: 'Object B', color: '#3b82f6', points: [] }
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
              if (data.language) setLanguage(data.language);
              if (data.fps) setFps(data.fps); // Load FPS
              
              alert("Project loaded successfully. Please upload the corresponding video file.");
          } catch (err) {
              alert("Invalid Project File");
          }
      };
      reader.readAsText(file);
      e.target.value = null; // Reset input
  };

  const clearProject = () => {
      if (confirm("Are you sure? This will delete all data and reset the app.")) {
          localStorage.removeItem('physTracker_autosave');
          window.location.reload();
      }
  };

  // --- 1. HANDLING VIDEO UPLOAD ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      
      // SMART WIPE LOGIC:
      // If we have points but NO video loaded (restored state), DO NOT WIPE.
      if (!hasRestoredData) {
          // Reset both objects
          setObjects([
            { id: 'A', name: 'Object A', color: '#ef4444', points: [] },
            { id: 'B', name: 'Object B', color: '#3b82f6', points: [] }
          ]);
          setCalibrationPoints([]);
          setPixelsPerMeter(null);
          setOrigin(null);
          setOriginAngle(0);
          setFitModel('none');
          setVideoDims({ w: 0, h: 0 });
          // We intentionally do NOT reset FPS to keep user preference
      } else {
          // We just attached a video to restored data. Turn off the flag so next upload wipes it.
          setHasRestoredData(false);
      }

      setIsPlaying(false);
      setError(null);
      setShowInputModal(false);
      setIsScaleVisible(true);
      setDragState(null);
      setZoom(1.0);
      setZeroTime(true); 
      setIsTracking(false);
      setReticlePos(null); // Reset reticle
      setUncertaintyPx(10);
      setDuration(0);
      setCurrentTime(0);
      setCurrentFrameIndex(0); // Reset Frame Counter
      setViewMode('tracker');
  }
  };

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
    }
  }, [videoSrc]);

  // NEW: Initialize Reticle when Tracking starts
  useEffect(() => {
    if (isTracking && !reticlePos && videoDims.w > 0) {
        // Place reticle at center of screen initially
        setReticlePos({ x: videoDims.w / 2, y: videoDims.h / 2 });
    }
  }, [isTracking, videoDims]);

  // NEW: Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);


  // --- 2. UNIFIED RENDER LOOP (CANVAS-FIRST APPROACH) ---
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Allow rendering if we have valid dimensions, even if video isn't ready (for restored data)
    if (!canvas || (!video && !hasRestoredData)) return;
    if (videoDims.w === 0 && !hasRestoredData) return;

    const ctx = canvas.getContext('2d');
    
    // Clear and set transform
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0); 
    ctx.clearRect(0, 0, videoDims.w, videoDims.h);

    // 1. DRAW VIDEO FRAME
    if (video && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, videoDims.w, videoDims.h);
    } else if (hasRestoredData) {
         // Placeholder background if we have points but no video
         ctx.fillStyle = '#1e293b';
         ctx.fillRect(0, 0, videoDims.w || 800, videoDims.h || 600); // Default size if unknown
         ctx.fillStyle = '#64748b';
         ctx.font = '20px sans-serif';
         ctx.fillText("Data Loaded. Please Upload Video.", 50, 50);
    }

    const lw = (w) => w / zoom; 

    // 2. Draw UI Elements
    const drawPointMarker = (x, y, isDragging = false, label = null) => {
      if (isDragging) return; 
      ctx.save();
      
      ctx.beginPath();
      ctx.arc(x, y, uncertaintyPx, 0, 2 * Math.PI);
      ctx.fillStyle = `${activeObjectColor}26`; // Hex alpha ~15%
      ctx.fill();
      ctx.lineWidth = lw(1);
      ctx.strokeStyle = `${activeObjectColor}4D`; // Hex alpha ~30%
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, lw(5), 0, 2 * Math.PI); 
      ctx.fillStyle = activeObjectColor; 
      ctx.fill();
      ctx.lineWidth = lw(2);
      ctx.strokeStyle = 'white'; 
      ctx.stroke();

      if (label) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${lw(12)}px sans-serif`; 
        ctx.shadowColor = 'black';
        ctx.shadowBlur = lw(3);
        ctx.fillText(label, x + lw(10), y - lw(10)); 
        ctx.shadowBlur = 0; 
      }
      ctx.restore();
    };

    const drawMagnifier = (x, y, isDragging) => {
      if (isDragging) return; // Don't draw if dragging (handled by pointer events logic usually) but here we want to see it?
      // Actually, standard magnifier draws ON TOP.
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = lw(2);
      ctx.strokeStyle = '#00ff00'; 
      ctx.arc(x, y, lw(20), 0, 2 * Math.PI); // Slightly larger
      ctx.stroke();
      
      // Crosshair inside magnifier
      ctx.beginPath();
      ctx.moveTo(x - lw(5), y); ctx.lineTo(x + lw(5), y);
      ctx.moveTo(x, y - lw(5)); ctx.lineTo(x, y + lw(5));
      ctx.stroke();
      
      ctx.restore();
    };
    
    // NEW: Draw Persistent Reticle (BIGGER AND BETTER)
    const drawReticle = (x, y, isDragging) => {
        ctx.save();
        
        // Outer Circle - Larger
        ctx.beginPath();
        ctx.arc(x, y, lw(30), 0, 2 * Math.PI); // Radius 30 (was 15)
        ctx.lineWidth = lw(2);
        ctx.strokeStyle = isDragging ? '#fbbf24' : '#4ade80'; // Amber when dragging, Green when static
        
        // Add semi-transparent fill for better visual "grabbability"
        ctx.fillStyle = isDragging ? 'rgba(251, 191, 36, 0.1)' : 'rgba(74, 222, 128, 0.1)'; 
        ctx.fill();
        ctx.stroke();
        
        // Inner Crosshair - Extended
        ctx.beginPath();
        ctx.moveTo(x - lw(50), y); ctx.lineTo(x + lw(50), y); // Length 50 (was 25)
        ctx.moveTo(x, y - lw(50)); ctx.lineTo(x, y + lw(50)); // Length 50 (was 25)
        ctx.lineWidth = lw(1.5);
        ctx.strokeStyle = isDragging ? '#fbbf24' : '#4ade80'; // Ensure stroke color matches
        ctx.stroke();
        
        // Center Dot
        ctx.beginPath();
        ctx.arc(x, y, lw(3), 0, 2 * Math.PI); // Slightly bigger dot
        ctx.fillStyle = isDragging ? '#fbbf24' : '#4ade80';
        ctx.fill();
        
        // Label
        if (!isDragging) {
            ctx.fillStyle = '#4ade80';
            ctx.font = `bold ${lw(14)}px sans-serif`; // Bigger font
            ctx.fillText(t.tapToFire, x + lw(35), y - lw(35));
        }
        
        ctx.restore();
    };

    // UPDATED: Professional Red Axes Design
    if (origin) {
      ctx.save(); 
      ctx.translate(origin.x, origin.y);
      ctx.rotate(originAngle);
      const length = Math.max(videoDims.w, videoDims.h) * 2;
      
      const axisColor = '#FF4444'; // Vibrant Red
      const axisWidth = lw(2);

      ctx.beginPath();
      ctx.strokeStyle = axisColor; 
      ctx.lineWidth = axisWidth; 
      
      // Draw Axes Lines
      ctx.moveTo(-length, 0); ctx.lineTo(length, 0); // X-Axis
      ctx.moveTo(0, length); ctx.lineTo(0, -length); // Y-Axis
      ctx.stroke();
      
      // Draw Arrowheads
      const arrowSize = lw(12);
      ctx.fillStyle = axisColor;
      
      // X Arrow (Right)
      ctx.beginPath();
      ctx.moveTo(length, 0);
      ctx.lineTo(length - arrowSize, -arrowSize/2);
      ctx.lineTo(length - arrowSize, arrowSize/2);
      ctx.fill();

      // Y Arrow (Up - remember canvas Y is down, so Up is negative length)
      ctx.beginPath();
      ctx.moveTo(0, -length);
      ctx.lineTo(-arrowSize/2, -length + arrowSize);
      ctx.lineTo(arrowSize/2, -length + arrowSize);
      ctx.fill();
      
      // Draw Origin "Bullseye"
      ctx.beginPath();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = lw(2);
      ctx.arc(0, 0, lw(10), 0, 2 * Math.PI); // Outer Ring
      ctx.stroke();
      
      ctx.beginPath();
      ctx.fillStyle = axisColor;
      ctx.arc(0, 0, lw(3), 0, 2 * Math.PI); // Center Dot
      ctx.fill();
      
      // Rotation Handle
      const handleDist = lw(100); 
      ctx.beginPath(); 
      ctx.arc(handleDist, 0, lw(6), 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 68, 68, 0.2)'; 
      ctx.strokeStyle = axisColor; 
      ctx.fill(); 
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = axisColor; 
      ctx.font = `bold ${lw(14)}px sans-serif`;
      ctx.fillText("+X", length - lw(30), -lw(8)); 
      ctx.fillText("+Y", lw(8), -length + lw(30)); 
      
      ctx.restore(); 
    }

    if (calibrationPoints.length > 0 && (isCalibrating || isScaleVisible)) {
      if (calibrationPoints.length === 2) {
        ctx.beginPath();
        ctx.strokeStyle = '#00ff00'; 
        ctx.lineWidth = lw(3); 
        ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
        ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
        ctx.stroke();
      }
      calibrationPoints.forEach((p, i) => {
        const isDraggingThis = dragState === 'calibration' && draggedPointIndex === i;
        drawMagnifier(p.x, p.y, isDraggingThis);
      });
    }

    // DRAW POINTS (Using the derived 'points' array, effectively showing only active object)
    points.forEach((point, index) => {
      const isDraggingThis = dragState === 'point' && draggedPointIndex === index;
      drawPointMarker(point.x, point.y, isDraggingThis, index + 1);
    });
    
    // NEW: Render Reticle if Tracking
    if (isTracking && reticlePos) {
        drawReticle(reticlePos.x, reticlePos.y, dragState === 'reticle' || dragState === 'reticle_move_jump');
    }

  }, [points, videoDims, zoom, origin, originAngle, calibrationPoints, isCalibrating, isScaleVisible, dragState, draggedPointIndex, uncertaintyPx, reticlePos, isTracking, hasRestoredData, activeObjectColor, t]);

  // --- 3. TRIGGER RENDER LOOP (UPDATED: FRAME SYNC) ---
  useEffect(() => {
    const performRender = () => {
       renderFrame();
    };

    const onVideoFrame = (now, metadata) => {
      if (videoRef.current && !videoRef.current.paused) {
        // CRITICAL FIX: Use metadata.mediaTime for frame-perfect sync during playback
        setCurrentTime(metadata.mediaTime);
        performRender();
        // Re-register callback
        videoCallbackRef.current = videoRef.current.requestVideoFrameCallback(onVideoFrame);
      }
    };

    const loopFallback = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
        performRender();
        animationFrameRef.current = requestAnimationFrame(loopFallback);
      }
    };

    if (isPlaying && videoRef.current) {
      if ('requestVideoFrameCallback' in videoRef.current) {
        // MODERN API: Synced to video refresh rate
        videoCallbackRef.current = videoRef.current.requestVideoFrameCallback(onVideoFrame);
      } else {
        // FALLBACK: Synced to screen refresh rate (older browsers)
        animationFrameRef.current = requestAnimationFrame(loopFallback);
      }
    } else {
      // If paused, just draw once to ensure UI is up to date
      performRender();
      
      // Cleanup loops
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoCallbackRef.current && videoRef.current && 'cancelVideoFrameCallback' in videoRef.current) {
        videoRef.current.cancelVideoFrameCallback(videoCallbackRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoCallbackRef.current && videoRef.current && 'cancelVideoFrameCallback' in videoRef.current) {
        // Safety check for ref existence during unmount
         videoRef.current.cancelVideoFrameCallback(videoCallbackRef.current);
      }
    };
  }, [isPlaying, renderFrame]);

  // --- VIEW SWITCHING FIX (Green Screen / Centering) ---
  useEffect(() => {
    if (viewMode === 'tracker') {
      // 1. Give the browser time to paint the DOM (Video & Canvas) before we touch it
      // Increased to 100ms to ensure stability on all devices
      const timer = setTimeout(() => {
        if (videoRef.current) {
          // 2. Force Video to "wake up" at the correct timestamp (Fixes Green Screen)
          // This flushes the decoding buffer which might be empty after unmount
          videoRef.current.currentTime = currentTime;
        }
        // 3. Force a redraw of the canvas points (Fixes Centering/Blank Canvas)
        // Wrapped in requestAnimationFrame to ensure it runs during a paint cycle
        requestAnimationFrame(() => renderFrame());
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentTime, renderFrame]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]); 

  // --- 5. POINTER LOGIC (Replaces Mouse Logic) ---
  const getCanvasCoords = (clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = (videoDims.w * zoom) / rect.width;
    const scaleY = (videoDims.h * zoom) / rect.height;
    return {
      x: ((clientX - rect.left) * scaleX) / zoom,
      y: ((clientY - rect.top) * scaleY) / zoom
    };
  };

  const handlePointerDown = (e) => {
    if (!videoRef.current || showInputModal) return;

    // --- CUSTOM TOUCH PANNING FIX ---
    // We handle all touches instantly to avoid Safari's native scroll delay
    
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    
    // --- FAT FINGER DETECTION ---
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    const hitRadius = (isTouch ? 45 : 15) / zoom; 
    const reticleHitRadius = (isTouch ? 80 : 60) / zoom; 

    let isInteractiveTarget = false; // Flag to track if we hit something actionable
    let newDragState = null; // NEW: Local tracker for immediate state logic

    // PRIORITY 1: RETICLE LOGIC
    if (!isCalibrating && isTracking && reticlePos) {
      const distToReticle = Math.sqrt(Math.pow(x - reticlePos.x, 2) + Math.pow(y - reticlePos.y, 2));

      if (distToReticle < reticleHitRadius) {
          isInteractiveTarget = true;
          newDragState = 'reticle';
          setDragState('reticle');
          dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          dragOffsetRef.current = { x: reticlePos.x - x, y: reticlePos.y - y };
      }
    }

    // 2. Check Existing Points
    if (!isInteractiveTarget) {
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
        if (dist < hitRadius) {
          isInteractiveTarget = true;
          newDragState = 'point';
          setDragState('point');
          setDraggedPointIndex(i);
          setMousePos({ x: e.clientX, y: e.clientY });
          break; // Stop checking
        }
      }
    }

    // 3. Check Calibration Points
    if (!isInteractiveTarget && (isCalibrating || (isScaleVisible && calibrationPoints.length > 0))) {
      for (let i = 0; i < calibrationPoints.length; i++) {
        const p = calibrationPoints[i];
        const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
        if (dist < hitRadius + 5/zoom) {
          isInteractiveTarget = true;
          newDragState = 'calibration';
          setDragState('calibration');
          setDraggedPointIndex(i);
          setMousePos({ x: e.clientX, y: e.clientY });
          break; 
        }
      }
    }

    // 4. Check Origin
    if (!isInteractiveTarget && origin) {
      const distOrigin = Math.sqrt(Math.pow(x - origin.x, 2) + Math.pow(y - origin.y, 2));
      if (distOrigin < hitRadius) { 
          isInteractiveTarget = true;
          newDragState = 'origin';
          setDragState('origin'); 
      } else {
          const handleDist = 100 / zoom; 
          const handleX = origin.x + handleDist * Math.cos(originAngle);
          const handleY = origin.y + handleDist * Math.sin(originAngle);
          const distHandle = Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2));
          if (distHandle < hitRadius) { 
              isInteractiveTarget = true;
              newDragState = 'rotate';
              setDragState('rotate'); 
          }
      }
    }

    // 5. Origin Setting Mode (Always capture click)
    if (isSettingOrigin) {
        isInteractiveTarget = true; // We want to place the origin, not scroll
    }

    if (isInteractiveTarget) {
       e.preventDefault(); // Stop scrolling, start app interaction
       e.currentTarget.setPointerCapture(e.pointerId);
       
       if (isSettingOrigin) {
          // If we clicked the axes handle directly, do NOT kill the drag.
          if (newDragState) {
             setIsSettingOrigin(false);
          } else {
             // We clicked empty space, so place the origin there.
             setOrigin({ x, y }); 
             setOriginAngle(0); 
             setIsSettingOrigin(false); 
             setDragState(null); 
          }
       }
    } else {
       // We hit empty space.
       if (isTouch) {
           // On Touch: Start Custom Panning Engine
           e.preventDefault();
           e.currentTarget.setPointerCapture(e.pointerId);
           setDragState('pan');
           if (scrollContainerRef.current) {
               panStartRef.current = {
                   x: e.clientX,
                   y: e.clientY,
                   scrollLeft: scrollContainerRef.current.scrollLeft,
                   scrollTop: scrollContainerRef.current.scrollTop
               };
           }
       } else if (e.pointerType === 'mouse' && !isCalibrating && isTracking && reticlePos) {
           // On Mouse: Reticle Jump
           e.preventDefault();
           e.currentTarget.setPointerCapture(e.pointerId);
           setDragState('reticle_move_jump');
           setReticlePos({ x, y });
           dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
           setMousePos({ x: e.clientX, y: e.clientY });
       }
    }
  };

  const handlePointerMove = (e) => {
    // Only update mouse pos if we are actually tracking/interacting, to save renders
    if (isTracking || dragState) {
        setMousePos({ x: e.clientX, y: e.clientY });
    }
    
    if (!dragState) return;

    // --- CUSTOM PANNING LOGIC ---
    if (dragState === 'pan') {
        if (scrollContainerRef.current) {
            const dx = e.clientX - panStartRef.current.x;
            const dy = e.clientY - panStartRef.current.y;
            scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
            scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
        }
        return; // Skip physics math when just panning
    }
    
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (dragState === 'origin') {
      setOrigin({ x, y });
    } else if (dragState === 'rotate' && origin) {
      const dx = x - origin.x;
      const dy = y - origin.y;
      setOriginAngle(Math.atan2(dy, dx));
    } else if (dragState === 'point' && draggedPointIndex !== null) {
      const updatedPoints = [...points];
      updatedPoints[draggedPointIndex] = { ...updatedPoints[draggedPointIndex], x, y };
      setPoints(updatedPoints);
      if (trashRef.current) {
        const trashRect = trashRef.current.getBoundingClientRect();
        const isOver = e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
                       e.clientY >= trashRect.top && e.clientY <= trashRect.bottom;
        setIsHoveringTrash(isOver);
      }
    } else if (dragState === 'calibration' && draggedPointIndex !== null) {
      const updatedCalib = [...calibrationPoints];
      updatedCalib[draggedPointIndex] = { x, y };
      setCalibrationPoints(updatedCalib);
    } else if (dragState === 'reticle') {
        // Drag using the relative offset
        setReticlePos({ 
            x: x + dragOffsetRef.current.x, 
            y: y + dragOffsetRef.current.y 
        });
    } else if (dragState === 'reticle_move_jump') {
        // Absolute move for jumps (Mouse only)
        setReticlePos({ x, y });
    }
  };

  const handlePointerUp = (e) => {
    // Only release capture if we actually captured it
    if (dragState) {
       e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (dragState === 'reticle') {
        // ... existing reticle drop logic ...
        // CHECK FOR TAP vs DRAG
        // Calculate screen distance moved since pointer down
        const dist = Math.sqrt(Math.pow(e.clientX - dragStartRef.current.x, 2) + Math.pow(e.clientY - dragStartRef.current.y, 2));
        const dt = Date.now() - dragStartRef.current.time;
        
        // Threshold: If moved less than 10 pixels and short duration, treat as TAP
        if (dist < 10) {
            // FIRE! Record Point
            const time = videoRef.current.currentTime;
            setPoints([...points, { id: Date.now(), x: reticlePos.x, y: reticlePos.y, time }]);
            stepForward();
            // Reticle stays where it is, ready for next adjustment
        }
    } else if (dragState === 'point') {
      if (isHoveringTrash) {
        const newPoints = points.filter((_, i) => i !== draggedPointIndex);
        setPoints(newPoints);
      }
      setIsHoveringTrash(false);
      setDraggedPointIndex(null);
    }
    
    // Reset drag state
    setDragState(null);
  };

  // --- HELPERS ---
  const handleScaleButtonClick = () => {
    if (pixelsPerMeter) {
      setIsScaleVisible(!isScaleVisible);
    } else {
      if (!isCalibrating) {
        setIsCalibrating(true);
        setIsSettingOrigin(false);
        setIsScaleVisible(true);
        setIsTracking(false);
        setReticlePos(null);
        const w = videoDims.w || 600;
        const h = videoDims.h || 400;
        setCalibrationPoints([{ x: w * 0.4, y: h * 0.5 }, { x: w * 0.6, y: h * 0.5 }]);
      } else {
        setShowInputModal(true);
      }
    }
  };

  const submitCalibration = () => {
    const meters = parseFloat(realDistanceInput);
    if (!isNaN(meters) && meters > 0) {
      const p1 = calibrationPoints[0];
      const p2 = calibrationPoints[1];
      const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      setPixelsPerMeter(distPx / meters);
      setIsCalibrating(false);
      setShowInputModal(false);
      setIsScaleVisible(true);
    } else {
      alert("Please enter a valid number");
    }
  };

  const cancelCalibration = () => { setCalibrationPoints([]); setIsCalibrating(false); setShowInputModal(false); };
  const resetScale = () => { setPixelsPerMeter(null); setCalibrationPoints([]); setIsCalibrating(false); setIsScaleVisible(true); };
  const undoLastPoint = () => setPoints(prev => prev.slice(0, -1));

  // --- STEP FUNCTIONS (GRID ALIGNED) ---
  const stepForward = useCallback(() => { 
    if (videoRef.current) { 
      videoRef.current.pause(); 
      setIsPlaying(false); 
      
      // STATE-BASED INDEXING: Trust the math, not the player
      const frameDuration = 1 / fps;
      const nextIndex = currentFrameIndex + 1;
      
      // Midpoint targeting: Target the CENTER of the frame to avoid boundary errors
      const targetTime = (nextIndex * frameDuration) + (frameDuration / 2); 
      
      if (targetTime <= videoRef.current.duration) {
          setCurrentFrameIndex(nextIndex);
          videoRef.current.currentTime = targetTime;
          setCurrentTime(targetTime); // Update UI immediately
      }
    } 
  }, [fps, currentFrameIndex]);

  const stepBackward = useCallback(() => { 
    if (videoRef.current) { 
      videoRef.current.pause(); 
      setIsPlaying(false); 
      
      // STATE-BASED INDEXING
      const frameDuration = 1 / fps;
      const prevIndex = Math.max(0, currentFrameIndex - 1);
      
      const targetTime = (prevIndex * frameDuration) + (frameDuration / 2); 
      
      setCurrentFrameIndex(prevIndex);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    } 
  }, [fps, currentFrameIndex]);

  // Handler for when the video *actually* finishes moving to new time
  const handleSeeked = useCallback(() => {
    if (videoRef.current) {
      // Sync strictly on seeked to handle external events, but stepping relies on state
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      // We don't overwrite currentFrameIndex here to avoid the "analog" drift loops
      renderFrame(); // <--- FIXED: Restored this call to update the canvas
    }
  }, [renderFrame]);

  // Handler for when video has decoded first frame (fixes black screen)
  const handleLoadedData = useCallback(() => {
    renderFrame();
  }, [renderFrame]);

  const togglePlay = async () => { 
    if (!videoRef.current) return; 
    try { 
      if (isPlaying) { 
        videoRef.current.pause(); 
        setIsPlaying(false); 
      } else { 
        await videoRef.current.play(); 
        setIsPlaying(true); 
      } 
    } catch (err) { 
      setError("Cannot play video."); 
      setIsPlaying(false); 
    } 
  };
  
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      // When MANUALLY seeking, we reset the frame index to match the visual time
      // This re-syncs the "Digital Twin" to the user's manual action
      setCurrentFrameIndex(Math.floor(time * fps + 0.001));
    }
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleVideoLoaded = useCallback(() => { 
    if (videoRef.current && scrollContainerRef.current) {
      setDuration(videoRef.current.duration); 
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      if (w > 0 && h > 0) {
        setVideoDims({ w, h });
        const availableW = scrollContainerRef.current.clientWidth - 40; 
        const availableH = scrollContainerRef.current.clientHeight - 40;
        const scaleW = availableW / w;
        const scaleH = availableH / h;
        const fitScale = Math.min(scaleW, scaleH);
        setZoom(fitScale < 1 ? fitScale : 1);
        
        // Initial Draw
        setTimeout(() => renderFrame(), 100);
      }
    } 
  }, [renderFrame]);

  const handleVideoEnded = useCallback(() => setIsPlaying(false), []);
  const handleVideoError = useCallback(() => setError("Error loading video."), []);
  
  // Standard sync handler for video events (needed for playhead update during normal playback)
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      
      // Only update the Master Counter from the video player IF we are playing.
      // If we are paused (stepping), we trust our own internal counter (stepForward)
      // more than the video player's reported time (which causes the glitch).
      if (isPlaying) {
         setCurrentFrameIndex(Math.floor(t * fps + 0.001));
      }
    }
  }, [fps, isPlaying]);

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

  // 1. Calculate Base Physics Data
  const { positionData, velocityData } = useMemo(() => {
    const sortedPoints = points.sort((a, b) => a.time - b.time);
    const posData = sortedPoints.map((p) => {
        const { x: rx, y: ry } = getRotatedCoords(p.x, p.y);
        const adjustedTime = zeroTime ? (p.time - startTime) : p.time;
        return {
          time: parseFloat(adjustedTime.toFixed(3)),
          x: parseFloat(formatVal(rx).toFixed(3)),
          y: parseFloat(formatVal(ry).toFixed(3)),
          error: parseFloat(uncertaintyMeters.toFixed(3))
        };
    });

    const velData = [];

    // --- VELOCITY CALCULATION (3-Point Formula) ---
    // N is the index of the last point
    const N = sortedPoints.length - 1;

    for (let i = 0; i <= N; i++) {
        // Basic requirements for any velocity calculation: at least 3 points total
        if (N < 2) break;

        const pCurrent = sortedPoints[i];
        const adjustedTime = zeroTime ? (pCurrent.time - startTime) : pCurrent.time;

        let vx = null;
        let vy = null;

        // 1. FIRST POINT (Forward Difference)
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

            // Assumes constant dt, but robust enough for minor variations
            const dt = t1 - t0;
            if (dt > 0.0001) {
                // Formula: (-3x0 + 4x1 - x2) / (2dt)
                vx = (-3*formatVal(x0) + 4*formatVal(x1) - formatVal(x2)) / (2*dt);
                vy = (-3*formatVal(y0) + 4*formatVal(y1) - formatVal(y2)) / (2*dt);
            }
        }
        // 2. LAST POINT (Backward Difference)
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
                 // Formula: (3xN - 4xN-1 + xN-2) / (2dt)
                vx = (3*formatVal(xN) - 4*formatVal(xN1) + formatVal(xN2)) / (2*dt);
                vy = (3*formatVal(yN) - 4*formatVal(yN1) + formatVal(yN2)) / (2*dt);
            }
        }
        // 3. MIDDLE POINTS (Central Difference)
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
                time: parseFloat(adjustedTime.toFixed(3)),
                vx: parseFloat(vx.toFixed(3)),
                vy: parseFloat(vy.toFixed(3)),
                x: null, 
                y: null,
                error: null 
            });
        }
    }

    return { positionData: posData, velocityData: velData };
  }, [points, origin, originAngle, pixelsPerMeter, zeroTime, uncertaintyPx, startTime, fps]);

  const activeData = useMemo(() => {
      if (['vx', 'vy'].includes(plotY)) {
          return velocityData;
      }
      return positionData;
  }, [plotY, positionData, velocityData]);

  // --- SCALE CALCULATION ---
  const xScale = useMemo(() => {
    if (activeData.length === 0) return { min: 0, max: 10, ticks: [], step: 1 };
    const vals = activeData.map(d => d[plotX]).filter(v => isFinite(v));
    // MODIFIED: Pass true for lockZero if plotX is 'time'
    return calculateNiceScale(Math.min(...vals), Math.max(...vals), plotX === 'time');
  }, [activeData, plotX]);

  const yScale = useMemo(() => {
    if (activeData.length === 0) return { min: 0, max: 10, ticks: [], step: 1 };
    const vals = activeData.map(d => d[plotY]).filter(v => isFinite(v));
    return calculateNiceScale(Math.min(...vals), Math.max(...vals));
  }, [activeData, plotY]);


  const solveLinearSystem = (matrix, vector) => {
    const n = vector.length;
    const A = matrix.map((row, i) => [...row, vector[i]]);
    for (let i = 0; i < n; i++) {
      let maxEl = Math.abs(A[i][i]); let maxRow = i;
      for (let k = i + 1; k < n; k++) { if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; } }
      for (let k = i; k < n + 1; k++) { const tmp = A[maxRow][k]; A[maxRow][k] = A[i][k]; A[i][k] = tmp; }
      for (let k = i + 1; k < n; k++) { if (Math.abs(A[i][i]) < 1e-10) continue; const c = -A[k][i] / A[i][i]; for (let j = i; j < n + 1; j++) { if (i === j) A[k][j] = 0; else A[k][j] += c * A[i][j]; } }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i > -1; i--) { if (Math.abs(A[i][i]) < 1e-10) return null; x[i] = A[i][n] / A[i][i]; for (let k = i - 1; k > -1; k--) { A[k][n] -= A[k][i] * x[i]; } }
    return x;
  };

  const fitEquation = useMemo(() => {
    if (fitModel === 'none' || activeData.length < 2) return null;

    const validData = activeData.filter(d => d[plotX] !== null && d[plotY] !== null && isFinite(d[plotX]) && isFinite(d[plotY]));
    if (validData.length < 2) return null;

    const xData = validData.map(d => d[plotX]);
    const yData = validData.map(d => d[plotY]);
    const n = validData.length;
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    let result = null;

    if (fitModel === 'linear') {
      const sumX = sum(xData); const sumY = sum(yData);
      const sumXY = xData.reduce((acc, x, i) => acc + x * yData[i], 0);
      const sumXX = xData.reduce((acc, x) => acc + x * x, 0);
      const denominator = (n * sumXX - sumX * sumX);
      if (Math.abs(denominator) > 1e-9) {
        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;
        result = { 
            type: 'Linear', 
            text: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`, 
            fn: (x) => slope * x + intercept, 
            params: { m: slope, b: intercept } 
        };
      }
    } 
    else if (fitModel === 'quadratic' && n > 2) {
      let sx = sum(xData); let sx2 = sum(xData.map(x=>x*x)); let sx3 = sum(xData.map(x=>x**3)); let sx4 = sum(xData.map(x=>x**4));
      let sy = sum(yData); let sxy = sum(xData.map((x,i)=>x*yData[i])); let sx2y = sum(xData.map((x,i)=>x*x*yData[i]));
      const matrix = [[sx4, sx3, sx2], [sx3, sx2, sx], [sx2, sx,  n]]; const vector = [sx2y, sxy, sy];
      const res = solveLinearSystem(matrix, vector);
      if (res) {
          const [a, b, c] = res;
          result = { 
            type: 'Quadratic', 
            text: `y = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`, 
            fn: (x) => a * x * x + b * x + c, 
            params: { A: a, B: b, C: c } 
          };
      }
    }

    if (result) {
        const yMean = sum(yData) / n;
        const ssTot = yData.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
        const ssRes = validData.reduce((acc, d) => {
            const pred = result.fn(d[plotX]);
            return acc + Math.pow(d[plotY] - pred, 2);
        }, 0);
        const r2 = 1 - (ssRes / ssTot);
        result.r2 = r2;
    }

    return result;
  }, [fitModel, activeData, plotX, plotY]);

  const chartData = useMemo(() => {
    if (!fitEquation) return activeData;
    return activeData.map(d => ({
      ...d,
      fitY: (d[plotX] !== null && isFinite(d[plotX])) ? fitEquation.fn(d[plotX]) : null
    }));
  }, [activeData, fitEquation, plotX]);

  const labels = { 
    'time': t.time, 
    'x': t.xPos, 
    'y': t.yPos, 
    'vx': t.xVel, 
    'vy': t.yVel 
  };

  const downloadCSV = () => {
    const headers = ["Time (s)", "X (m)", "Y (m)", "Uncertainty (m)"];
    const rows = positionData.map(row => `${row.time},${row.x},${row.y},${row.error}`);
    // UPDATED Header to reflect Central Difference method
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

    // --- 1. CALCULATE GRID BOUNDARIES FIRST (Moved Up) ---
    // We need these dimensions to geometrically center the Y-axis label
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

    // Default fallbacks if grid is empty
    if (minX === Infinity) { minX = 60; minY = 20; maxX = 740; maxY = 380; }

    const chartMidY = (minY + maxY) / 2;

    // --- 2. PROCESS TEXT ELEMENTS ---
    const texts = svgClone.querySelectorAll("text");
    texts.forEach(t => { 
      t.setAttribute("fill", "black"); 
      t.style.fill = "black"; 
      t.style.fontFamily = "Arial, Helvetica, sans-serif";

      // 1. MAKE TICKS BIGGER & BOLDER
      if (t.classList.contains("recharts-cartesian-axis-tick-value")) {
        t.style.fontSize = "24px"; 
        t.style.fontWeight = "bold";
      }

      // 2. MAKE AXIS LABELS BIGGER & ADJUST SPACING
      if (t.textContent === labels[plotX]) {
        t.style.fontSize = "32px"; 
        t.style.fontWeight = "bold";
        // Push X label down (increase dy)
        let currentDy = parseFloat(t.getAttribute("dy")) || 0;
        t.setAttribute("dy", currentDy + 30);
      }

      if (t.textContent === labels[plotY]) {
        t.style.fontSize = "32px"; 
        t.style.fontWeight = "bold";
        
        // --- FIX: GEOMETRIC CENTERING FOR Y-AXIS ---
        // 1. Get current X position (distance from left)
        const currentX = parseFloat(t.getAttribute("x")) || 20; 
        
        // 2. Force Y position to exact grid midpoint
        t.setAttribute("y", chartMidY);
        
        // 3. Update rotation to pivot around the NEW center
        // Standard SVG rotation is: rotate(deg, x, y)
        t.setAttribute("transform", `rotate(-90, ${currentX}, ${chartMidY})`);
        
        // 4. Ensure visual centering
        t.setAttribute("text-anchor", "middle");

        // 5. Adjust padding (Push left away from axis)
        t.setAttribute("dy", -40); // Increased spacing slightly for larger font
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

    // Draw Border Rect (using calculated dimensions)
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
        
        const topMargin = 100; // Increased margin for bigger title
        const leftMargin = 60; // Extra left margin for Y axis label
        const bottomMargin = 60; // Extra bottom margin for X axis label
        const rightMargin = 20; // Extra right padding

        canvas.width = img.width + leftMargin + rightMargin;
        canvas.height = img.height + topMargin + bottomMargin;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isVelocity = ['vx', 'vy'].includes(plotY);
        const isPosition = ['x', 'y'].includes(plotY);
        const yVar = isVelocity ? 'v' : (plotY === 'x' ? 'x' : 'y');
        const xVar = plotX === 'time' ? 't' : 'x';
        const modelName = fitEquation?.type === 'Linear' ? "Linear Regression" : (fitEquation?.type === 'Quadratic' ? "Quadratic Fit" : "Plot");
        
        ctx.font = "bold 36px Arial"; // Bigger Title
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        const titleText = `${modelName} of ${labels[plotY].split('(')[0].trim()} vs ${labels[plotX].split('(')[0].trim()}`;
        ctx.fillText(titleText, canvas.width / 2, 55);

        // Draw image shifted by margins
        ctx.drawImage(img, leftMargin, topMargin);

        if (fitEquation && legendPosition !== 'none') {
            const padding = 20;
            const boxW = 400; // Slightly wider for bigger text
            const boxH = 150; // Slightly taller

            // Default Top Left (relative to grid)
            let boxX = leftMargin + minX + padding;
            let boxY = topMargin + minY + padding;

            // Coordinate calculations based on grid boundaries found in SVG (minX, maxX, minY, maxY)
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
                    // Already set
                    break;
            }

            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.textAlign = "left";
            ctx.font = "20px Arial"; // Bigger Legend Text
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
            if (fitEquation.type === 'Linear') {
               equationText = `${yVar} = ${fitEquation.params.m.toFixed(4)}${xVar} + ${fitEquation.params.b.toFixed(4)}`;
            } else if (fitEquation.type === 'Quadratic') {
               equationText = `${yVar} = ${fitEquation.params.A.toFixed(4)}${xVar}² + ${fitEquation.params.B.toFixed(4)}${xVar} + ${fitEquation.params.C.toFixed(4)}`;
            }
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

  // MEMOIZED VIDEO ELEMENT WITH GPU LAYER FORCE AND INTEGER SIZE
  const videoElement = useMemo(() => (
    <PureVideoPlayer 
      videoRef={videoRef} 
      src={videoSrc}
      onLoadedMetadata={handleVideoLoaded} 
      onLoadedData={handleLoadedData} // NEW: Trigger initial render when first frame is ready
      onEnded={handleVideoEnded} 
      onError={handleVideoError}
      onTimeUpdate={handleTimeUpdate}
      onSeeked={handleSeeked} 
    />
  ), [videoSrc, handleVideoLoaded, handleLoadedData, handleVideoEnded, handleVideoError, handleTimeUpdate, handleSeeked]);

  return (
    <div className={`flex flex-col h-screen font-sans transition-colors duration-200 ${styles.bg} ${styles.text}`}>
      {/* HEADER WITH VIEW SWITCHER */}
      <div className={`p-4 border-b flex justify-between items-center shrink-0 h-16 ${styles.panel}`}>
        <div className="flex items-center gap-4">
          
          {/* LOGO IMAGE with Fallback */}
          {!logoError ? (
             <img 
               src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
               alt="PhysTracker" 
               className="h-10 w-auto object-contain" 
               onError={() => setLogoError(true)}
             />
          ) : (
             <h1 className="text-xl font-bold">
                <span className={isDark ? "text-cyan-400" : "text-cyan-600"}>Phys</span>
                <span className={isDark ? "text-slate-200" : "text-slate-700"}>Tracker</span>
             </h1>
          )}

          <div className={`flex rounded p-1 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => setViewMode('tracker')} className={`px-4 py-1 text-sm rounded transition ${viewMode === 'tracker' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white shadow-sm text-slate-900') : styles.textSecondary + ' hover:' + styles.text}`}>{t.trackerMode}</button>
            <button onClick={() => setViewMode('analysis')} className={`px-4 py-1 text-sm rounded transition ${viewMode === 'analysis' ? (isDark ? 'bg-slate-700 text-blue-400' : 'bg-white shadow-sm text-blue-600') : styles.textSecondary + ' hover:' + styles.text}`}>{t.analysisMode}</button>
          </div>
          
          {/* NEW: Object Switcher */}
          <div className={`flex rounded p-1 border ml-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setActiveObjId('A')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'A' ? 'bg-red-500 text-white shadow-sm' : styles.textSecondary}`}>
                  <Users size={14}/> {t.objectA}
              </button>
              <button onClick={() => setActiveObjId('B')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'B' ? 'bg-blue-500 text-white shadow-sm' : styles.textSecondary}`}>
                  <Users size={14}/> {t.objectB}
              </button>
          </div>

        </div>
        
        <div className="flex gap-4 items-center">
          
          {viewMode === 'tracker' && (
            <>
              {/* UPDATED: Removed text spans, relying on title attributes for tooltips */}
              <button 
                  onClick={() => { setIsTracking(!isTracking); setIsSettingOrigin(false); setIsCalibrating(false); }} 
                  className={`flex items-center gap-2 px-3 py-2 rounded transition ${isTracking ? 'bg-red-600 animate-pulse text-white' : styles.buttonSecondary}`}
                  title={isTracking ? t.stopTracking : t.startTracking}
              > 
                  <Target size={20} /> 
              </button>

              <button 
                  onClick={() => { 
                    if (!origin && videoDims.w > 0) {
                       setOrigin({ x: videoDims.w / 2, y: videoDims.h / 2 });
                    }
                    setIsSettingOrigin(true); 
                    setIsCalibrating(false); 
                    setIsTracking(false); 
                    setShowInputModal(false); 
                  }} 
                  className={`flex items-center gap-2 px-3 py-2 rounded transition ${isSettingOrigin ? 'bg-blue-600 text-white' : styles.buttonSecondary}`}
                  title={origin ? t.moveOrigin : t.setOrigin}
              > 
                  <Move size={20} /> 
              </button>

              <button 
                  onClick={handleScaleButtonClick} 
                  className={`flex items-center gap-2 px-3 py-2 rounded transition ${isCalibrating ? 'bg-green-600 text-white' : pixelsPerMeter ? 'bg-green-100 text-green-700 border border-green-200' : styles.buttonSecondary}`}
                  title={isCalibrating ? t.enterDistance : pixelsPerMeter ? (isScaleVisible ? t.hideScale : t.showScale) : t.setScale}
              > 
                  {isCalibrating ? <CheckCircle2 size={20} /> : (pixelsPerMeter ? (isScaleVisible ? <Eye size={20} /> : <EyeOff size={20} />) : <Ruler size={20} />)} 
              </button>
            </>
          )}
          
          <label 
              className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition ${styles.buttonSecondary}`}
              title={t.uploadVideo}
          > 
              <Upload size={20} /> 
              <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" /> 
          </label>
           
           {/* Waiting for Video Alert (Moved here) */}
           {hasRestoredData && !videoSrc && (
                 <span className="text-xs text-orange-400 animate-pulse font-semibold flex items-center gap-1 hidden lg:flex">
                     <AlertCircle size={16} /> {t.waitingVideo}
                 </span>
             )}

          {/* NEW: More Options Dropdown */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`p-2 rounded-full transition ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700' : styles.buttonSecondary}`}
              title={t.moreOptions}
            >
              <Menu size={20} />
            </button>
            
            {isMenuOpen && (
              <div className={`absolute right-0 top-12 w-56 rounded-xl shadow-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ${styles.panel}`}>
                <div className="p-1 flex flex-col gap-1">
                   <button onClick={() => {saveProject(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                      <Save size={16} className="text-blue-500"/> {t.saveProject}
                   </button>
                   <label className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition cursor-pointer ${styles.tableRow}`}>
                      <FolderOpen size={16} className="text-green-500"/> {t.loadProject}
                      <input type="file" ref={fileInputRef} onChange={(e) => {loadProject(e); setIsMenuOpen(false);}} accept=".json" className="hidden" />
                   </label>
                   <button onClick={() => {clearProject(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500`}>
                      <RefreshCw size={16} /> {t.resetData}
                   </button>
                   
                   <div className={`h-px my-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                   
                   <button onClick={() => {toggleTheme(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                      {isDark ? <Sun size={16} className="text-yellow-400"/> : <Moon size={16} className="text-indigo-400"/>} {t.switchTheme}
                   </button>
                   <button onClick={() => {toggleLanguage(); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                      <Languages size={16} className="text-purple-500"/> {language === 'en' ? 'Español' : 'English'}
                   </button>
                   <button onClick={() => {setShowAboutModal(true); setIsMenuOpen(false);}} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 rounded-lg transition ${styles.tableRow}`}>
                      <Info size={16} className="text-cyan-500"/> {t.about}
                   </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* VIEW 1: TRACKER MODE */}
        {viewMode === 'tracker' && (
          <>
            <div className={`flex-1 flex flex-col min-w-0 ${styles.bg} relative`}>
              {/* MOVED TRASH ICON HERE - FIXED OVERLAY */}
              <div ref={trashRef} className={`absolute top-8 right-6 z-50 p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${dragState === 'point' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${isHoveringTrash ? 'bg-red-900/90 border-red-500 scale-110 text-white' : `${styles.panel} opacity-90`}`}> <Trash2 size={32} /> <span className="text-xs font-bold mt-2"> {t.dropToDelete} </span> </div>
              
              {/* NEW: Heads-Up "Enter Distance" Button for Calibration */}
              {isCalibrating && !showInputModal && (
                 <button 
                   onClick={() => setShowInputModal(true)}
                   className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
                 >
                   <CheckCircle2 size={20} />
                   {t.enterDistance}
                 </button>
              )}

              <div ref={scrollContainerRef} className={`flex-1 overflow-auto flex items-start justify-center p-4 relative ${styles.workspaceBg}`}>
                {/* REMOVED OLD SVG RETICLE */}
                {dragState === 'point' && ( <div className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: mousePos.x, top: mousePos.y }}> <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="13" cy="13" r="4" fill={activeObjectColor} stroke="white" strokeWidth="1.5" /> </svg> </div> )}
                {dragState === 'calibration' && ( <div className="fixed z-[100] w-12 h-12 rounded-full border-4 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: mousePos.x, top: mousePos.y }}> <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> </div> )}
                {showInputModal && ( 
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border p-6 rounded-xl shadow-2xl z-50 w-80 text-center ${styles.panel}`}>
                    <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>{t.setRealDistance}</h3>
                    <div className="flex items-center justify-center gap-2 mb-6"> <input type="number" value={realDistanceInput} onChange={(e) => setRealDistanceInput(e.target.value)} className={`rounded px-3 py-2 w-24 text-center focus:outline-none focus:border-blue-500 text-lg ${styles.input}`} autoFocus /> <span className={`font-semibold text-lg ${styles.textSecondary}`}>m</span> </div>
                    <div className="flex gap-3 justify-center"> <button onClick={cancelCalibration} className={`px-4 py-2 rounded transition ${styles.buttonSecondary}`}>{t.cancel}</button> <button onClick={submitCalibration} className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-semibold transition">{t.save}</button> </div> 
                  </div> 
                )}
                {videoSrc ? (
                  // CANVAS-FIRST RENDER: Video is HIDDEN (opacity 0), Canvas draws the frame
                  // Added flex-none to prevent aspect ratio distortion during zoom
                  <div className="relative shadow-2xl origin-top-left bg-black mt-10 flex-none" ref={containerRef} style={{ width: Math.floor(videoDims.w * zoom), height: Math.floor(videoDims.h * zoom) }}>
                    {/* MEMOIZED VIDEO ELEMENT WITH GPU LAYER FORCE */}
                    {videoElement}
                    <canvas 
                        ref={canvasRef} 
                        width={Math.floor(videoDims.w * zoom)} 
                        height={Math.floor(videoDims.h * zoom)} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            zIndex: 10, 
                            touchAction: 'none' // TOTAL LOCKDOWN: Bypasses Safari delay entirely
                        }} 
                        onPointerDown={handlePointerDown} 
                        onPointerMove={handlePointerMove} 
                        onPointerUp={handlePointerUp} 
                        onPointerCancel={handlePointerUp} 
                        onMouseEnter={() => setIsHoveringCanvas(true)} 
                        onMouseLeave={() => setIsHoveringCanvas(false)} 
                        className={`${dragState === 'origin' ? 'cursor-move' : dragState === 'rotate' ? 'cursor-grab' : dragState === 'pan' ? 'cursor-grabbing' : dragState === 'point' || dragState === 'calibration' ? 'cursor-grabbing' : (isSettingOrigin) ? 'cursor-crosshair' : (isTracking && !dragState) ? 'cursor-default' : 'cursor-default'}`} 
                    />
                  </div>
                ) : ( <div className={`text-center mt-20 ${styles.textSecondary}`}> <Upload size={48} className="mx-auto mb-4 opacity-50" /> <p>{t.uploadPrompt}</p> </div> )}
              </div>
              <div className={`h-20 border-t flex items-center justify-center gap-8 px-6 shrink-0 z-30 ${styles.panel}`}>
                 <button onClick={undoLastPoint} disabled={points.length === 0} className={`p-3 rounded-full transition disabled:opacity-30 ${styles.buttonSecondary}`} title={t.undoLast}> <Undo2 size={20} /> </button>
                 <div className={`flex items-center gap-4 px-6 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}> 
                    <button onClick={stepBackward} className={`p-2 rounded-full transition active:scale-90 active:bg-blue-500 active:text-white ${styles.buttonSecondary}`} title={t.prevFrame}> <SkipBack size={20} /> </button> 
                    <button onClick={togglePlay} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow-lg shadow-blue-900/20" title={t.playPause}> {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />} </button> 
                    <button onClick={stepForward} className={`p-2 rounded-full transition active:scale-90 active:bg-blue-500 active:text-white ${styles.buttonSecondary}`} title={t.nextFrame}> <SkipForward size={20} /> </button> 
                 </div>
                 <div className="flex-1 max-w-xl mx-4 flex items-center gap-3"> <span className={`text-xs font-mono w-12 text-right ${styles.textSecondary}`}>{formatTime(currentTime)}</span> <input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeek} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" /> <span className={`text-xs font-mono w-12 ${styles.textSecondary}`}>{formatTime(duration)}</span> </div>
                 <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}> <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.zoomOut}> <ZoomOut size={18} /> </button> <span className={`text-sm font-mono w-12 text-center ${styles.textSecondary}`}>{Math.round(zoom * 100)}%</span> <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.zoomIn}> <ZoomIn size={18} /> </button> <div className={`w-px h-6 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div> <button onClick={() => setZoom(1)} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.resetView}> <Maximize size={18} /> </button> </div>
              </div>
            </div>

            <div className={`w-96 border-l flex flex-col transition-all z-20 shrink-0 ${styles.panel}`}>
              <div className={`p-4 border-b flex justify-between items-center ${styles.panelHeader} ${styles.panelBorder}`}> <h2 className={`text-sm font-semibold flex items-center gap-2 ${styles.text}`}><Table size={16} /> {t.dataTable} ({activeObjId})</h2> </div>
              <div className={`p-4 border-b flex flex-col gap-4 ${styles.panelBgOnly} ${styles.panelBorder}`}> 
                {/* NEW: FPS SETTING */}
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${styles.textSecondary}`}>{t.fpsLabel}</span>
                    <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className={`text-xs p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                        <option value="30">30 fps</option>
                        <option value="60">60 fps</option>
                        <option value="120">120 fps</option>
                        <option value="240">240 fps</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 border-t pt-3 border-slate-700/20"> 
                  <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}> <span>{t.originLabel}: {origin ? `(${Math.round(origin.x)}, ${Math.round(origin.y)})` : t.notSet}</span> </div> 
                  <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}> <span>{t.scaleLabel}: {pixelsPerMeter ? `${Math.round(pixelsPerMeter)} px/m` : t.notSet}</span> {pixelsPerMeter && ( <button onClick={resetScale} className="hover:text-red-400 transition" title="Reset Scale"> <RotateCcw size={12} /> </button> )} </div>
                  <button onClick={() => setZeroTime(!zeroTime)} className={`text-xs flex items-center gap-2 px-2 py-1 rounded border transition ${zeroTime ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' : styles.buttonSecondary}`} title={zeroTime ? t.timeStart : t.videoTime}> <Clock size={12} /> <span>{zeroTime ? t.timeStart : t.videoTime}</span> </button>
                </div> 
                <div className={`border-t pt-3 ${styles.panelBorder}`}>
                  <div className={`flex items-center justify-between text-xs mb-1 ${styles.textSecondary}`}> <span className="flex items-center gap-1"><CircleDashed size={12}/> {t.blurSize}</span> <span>{uncertaintyPx}px</span> </div>
                  <input type="range" min="0" max="50" value={uncertaintyPx} onChange={(e) => setUncertaintyPx(Number(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
                {points.length > 0 && ( <button onClick={() => setPoints([])} className="text-red-400 hover:text-red-300 flex items-center justify-center gap-2 text-sm"> <Trash2 size={16} /> {t.clearData} </button> )} 
              </div>
              <div className={`flex-1 overflow-y-auto ${styles.bg}`}> 
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-sm text-left">
                        <thead className={`sticky top-0 shadow-md ${styles.tableHeader}`}>
                          <tr> <th className="p-3">#</th> <th className="p-3">{t.time}</th> <th className="p-3">{t.xPos.split(' ')[0]} (m) <span className="font-normal text-xs opacity-70">±{uncertaintyMeters.toFixed(3)}</span> </th> <th className="p-3"> {t.yPos.split(' ')[0]} (m) <span className="font-normal text-xs opacity-70">±{uncertaintyMeters.toFixed(3)}</span> </th> </tr>
                        </thead>
                        <tbody className={`divide-y ${styles.tableDivider}`}>
                          {positionData.map((p, i) => (
                            <tr key={i} className={`transition ${styles.tableRow}`}> <td className={`p-3 ${styles.textSecondary}`}>{i + 1}</td> <td className="p-3 font-mono text-blue-500">{p.time.toFixed(3)}</td> <td className={`p-3 font-mono ${styles.tableCell}`}>{p.x.toFixed(3)}</td> <td className={`p-3 font-mono ${styles.tableCell}`}>{p.y.toFixed(3)}</td> </tr>
                          ))}
                          {points.length === 0 && ( <tr><td colSpan="4" className={`p-8 text-center ${styles.textSecondary}`}>{t.noData} {activeObjId}</td></tr> )}
                        </tbody>
                      </table>
                    </div>
                    {points.length > 0 && ( <div className={`p-4 border-t ${styles.panelBgOnly} ${styles.panelBorder}`}> <button onClick={downloadCSV} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition"> <Download size={18} /> {t.downloadCSV} </button> </div> )}
                  </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: ANALYSIS MODE (Full Screen) */}
        {viewMode === 'analysis' && (
          <div className={`flex flex-1 overflow-hidden ${styles.bg}`}>
            <div className="flex-1 p-6 flex flex-col">
              <div id="motion-chart" className={`rounded-xl border flex-1 flex flex-col overflow-hidden shadow-2xl ${styles.panel}`}>
                 <div className={`p-4 border-b flex gap-4 ${styles.panelBgOnly} ${styles.panelBorder}`}>
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
                 </div>

                 <div className="flex-1 p-4 relative">
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
                        <Scatter name={`${t.dataPoints} (${activeObjId})`} dataKey={plotY} fill={activeObjectColor} />
                        {fitEquation && <Line type="monotone" dataKey="fitY" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} />}
                        {['x', 'y'].includes(plotY) && ( <Scatter dataKey={plotY} fill="none" stroke="none"> <ErrorBar dataKey="error" width={6} strokeWidth={2} stroke="#60a5fa" direction="y" /> </Scatter> )}
                      </ComposedChart> 
                   </ResponsiveContainer>
                   {points.length < 2 && ( <div className={`absolute inset-0 flex items-center justify-center italic ${styles.textSecondary}`}> Add points in Tracker mode to see data. </div> )}
                 </div>
              </div>
            </div>

            <div className={`w-96 border-l flex flex-col p-6 gap-6 shrink-0 ${styles.panel}`}>
               <div>
                 <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Calculator /> {t.curveFitting} ({activeObjId})</h3>
                 <div className="flex flex-col gap-2">
                    <label className={`text-sm ${styles.textSecondary}`}>{t.modelType}</label>
                    <select value={fitModel} onChange={(e) => setFitModel(e.target.value)} className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${styles.input}`}>
                      <option value="none">{t.none}</option>
                      <option value="linear">{t.linear}</option>
                      <option value="quadratic">{t.quadratic}</option>
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
                      ) : (
                        <>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.aTerm}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.A.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.bTerm}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.B.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>{t.cTerm}</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.C.toFixed(4)}</span></div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                        <span className={styles.textSecondary}>R²</span> 
                        <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.r2 ? fitEquation.r2.toFixed(4) : "N/A"}</span>
                      </div>
                   </div>
                 </div>
               )}

               {/* EXPORT BUTTONS */}
               <div className="flex flex-col gap-2 mt-4">
                  
                  {/* NEW: Legend Position Control */}
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
        )}
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
                        <span className="font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit dark:bg-blue-900/50 dark:text-blue-300">1.0.0</span>
                        
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
