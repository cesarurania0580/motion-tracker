/* eslint-disable */
/**
 * PhysTracker
 * Version: 1.1.0
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
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar, ReferenceLine } from 'recharts';

// --- TRANSLATIONS DICTIONARY ---
import { TRANSLATIONS } from './utils/translations';
import { calculateNiceScale, solveLinearSystem, projectPointToSegmentT, getDistanceToSegment } from './utils/physicsMath';
import { useStore } from './store/useStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AnalysisPanel from './components/AnalysisPanel';

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

export default function App() {
  // --- STATE MANAGEMENT ---
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const fps = useStore(state => state.fps);
  const setFps = useStore(state => state.setFps);

  const logoError = useStore(state => state.logoError);
  const setLogoError = useStore(state => state.setLogoError);

  const isMenuOpen = useStore(state => state.isMenuOpen);
  const setIsMenuOpen = useStore(state => state.setIsMenuOpen);
  const menuRef = useRef(null);

  const objects = useStore(state => state.objects);
  const setObjects = useStore(state => state.setObjects);
  const activeObjId = useStore(state => state.activeObjId);
  const setActiveObjId = useStore(state => state.setActiveObjId);

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

  // PROXY SETTER: Updates only the active object within the objects array
  const setPoints = useStore(state => state.setPoints);

  const activeObjectColor = useMemo(() => {
    if (activeObjId === 'COM') return '#a855f7'; // Purple for COM
    return (objects || []).find(o => o.id === activeObjId)?.color || '#ef4444';
  }, [objects, activeObjId]);

  const videoSrc = useStore(state => state.videoSrc);
  const setVideoSrc = useStore(state => state.setVideoSrc);
  const imageSrc = useStore(state => state.imageSrc);
  const setImageSrc = useStore(state => state.setImageSrc);
  const imageObj = useStore(state => state.imageObj);
  const setImageObj = useStore(state => state.setImageObj);
  const isPlaying = useStore(state => state.isPlaying);
  const setIsPlaying = useStore(state => state.setIsPlaying);
  const error = useStore(state => state.error);
  const setError = useStore(state => state.setError);

  // Overlay states
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

  // Spectroscopy states
  const lineProfile = useStore(state => state.lineProfile);
  const setLineProfile = useStore(state => state.setLineProfile);
  const wavelengthCalibration = useStore(state => state.wavelengthCalibration);
  const setWavelengthCalibration = useStore(state => state.setWavelengthCalibration);
  const spectralMode = useStore(state => state.spectralMode);
  const setSpectralMode = useStore(state => state.setSpectralMode);
  const analysisChartMode = useStore(state => state.analysisChartMode);
  const setAnalysisChartMode = useStore(state => state.setAnalysisChartMode);
  const spectralData = useStore(state => state.spectralData);
  const setSpectralData = useStore(state => state.setSpectralData);
  const activeReferenceOverlays = useStore(state => state.activeReferenceOverlays);
  const setActiveReferenceOverlays = useStore(state => state.setActiveReferenceOverlays);
  const activeClickTarget = useStore(state => state.activeClickTarget);
  const setActiveClickTarget = useStore(state => state.setActiveClickTarget);
  const showGuidelines = useStore(state => state.showGuidelines);
  const setShowGuidelines = useStore(state => state.setShowGuidelines);
  
  // THEME STATE
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const isDark = theme === 'dark';

  // About Modal State
  const showAboutModal = useStore(state => state.showAboutModal);
  const setShowAboutModal = useStore(state => state.setShowAboutModal);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage(l => l === 'en' ? 'es' : 'en');

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
  const viewMode = useStore(state => state.viewMode);
  const setViewMode = useStore(state => state.setViewMode);
  const graphMode = useStore(state => state.graphMode);
  const setGraphMode = useStore(state => state.setGraphMode);
  const zeroTime = useStore(state => state.zeroTime);
  const setZeroTime = useStore(state => state.setZeroTime);

  // Analysis State
  const fitModel = useStore(state => state.fitModel);
  const setFitModel = useStore(state => state.setFitModel);
  const legendPosition = useStore(state => state.legendPosition);
  const setLegendPosition = useStore(state => state.setLegendPosition);

  // NEW: Data Cropping State
  const cropStart = useStore(state => state.cropStart);
  const setCropStart = useStore(state => state.setCropStart);
  const cropEnd = useStore(state => state.cropEnd);
  const setCropEnd = useStore(state => state.setCropEnd);

  const isCalibrating = useStore(state => state.isCalibrating);
  const setIsCalibrating = useStore(state => state.setIsCalibrating);
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

  const isSettingOrigin = useStore(state => state.isSettingOrigin);
  const setIsSettingOrigin = useStore(state => state.setIsSettingOrigin);
  const origin = useStore(state => state.origin);
  const setOrigin = useStore(state => state.setOrigin);
  const originAngle = useStore(state => state.originAngle);
  const setOriginAngle = useStore(state => state.setOriginAngle);

  // NEW: Master Frame Counter (Digital Twin for Robust Stepping)
  const currentFrameIndex = useStore(state => state.currentFrameIndex);
  const setCurrentFrameIndex = useStore(state => state.setCurrentFrameIndex);

  const isTracking = useStore(state => state.isTracking);
  const setIsTracking = useStore(state => state.setIsTracking);
  // NEW: Reticle State for Phase 1 Step 2
  const reticlePos = useStore(state => state.reticlePos);
  const setReticlePos = useStore(state => state.setReticlePos);

  // Zoom & Dimensions
  const zoom = useStore(state => state.zoom);
  const setZoom = useStore(state => state.setZoom);
  const videoDims = useStore(state => state.videoDims);
  const setVideoDims = useStore(state => state.setVideoDims);

  const dragState = useStore(state => state.dragState);
  const setDragState = useStore(state => state.setDragState);
  const draggedPointIndex = useStore(state => state.draggedPointIndex);
  const setDraggedPointIndex = useStore(state => state.setDraggedPointIndex);
  
  // NEW: Ref to track drag distance for Tap vs Drag detection
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lineProfileStartRef = useRef(null);
  
  const isHoveringTrash = useStore(state => state.isHoveringTrash);
  const setIsHoveringTrash = useStore(state => state.setIsHoveringTrash);
  
  const isHoveringCanvas = useStore(state => state.isHoveringCanvas);
  const setIsHoveringCanvas = useStore(state => state.setIsHoveringCanvas);
  const mousePos = useStore(state => state.mousePos);
  const setMousePos = useStore(state => state.setMousePos);

  const uncertaintyPx = useStore(state => state.uncertaintyPx);
  const setUncertaintyPx = useStore(state => state.setUncertaintyPx);

  // Timeline State
  const duration = useStore(state => state.duration);
  const setDuration = useStore(state => state.setDuration);
  const currentTime = useStore(state => state.currentTime);
  const setCurrentTime = useStore(state => state.setCurrentTime);
  const currentTimeRef = useRef(0);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

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
  const hasRestoredData = useStore(state => state.hasRestoredData);
  const setHasRestoredData = useStore(state => state.setHasRestoredData);
  
  // NEW: Ref for custom touch panning
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // --- GRAPH STATE ---
  const plotX = useStore(state => state.plotX);
  const setPlotX = useStore(state => state.setPlotX);
  const plotY = useStore(state => state.plotY);
  const setPlotY = useStore(state => state.setPlotY);


  const saveProject = () => {
    const stateToSave = {
        meta: { version: "1.1.0", date: new Date().toISOString() }, // Version 1.1.0
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
        fps, // Save FPS
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
              
              // MIGRATION LOGIC
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
              if (data.fps) setFps(data.fps); // Load FPS
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
      e.target.value = null; // Reset input
  };

  const clearProject = () => {
      if (confirm("Are you sure? This will delete all data and reset the app.")) {
          localStorage.removeItem('physTracker_autosave');
          window.location.reload();
      }
  };

  // --- 1. HANDLING VIDEO OR IMAGE UPLOAD ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      const url = URL.createObjectURL(file);
      
      // SMART WIPE LOGIC:
      // If we have points but NO video/image loaded (restored state), DO NOT WIPE.
      if (!hasRestoredData) {
          // Reset both objects
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
          // We intentionally do NOT reset FPS to keep user preference
      } else {
          // We just attached a video/image to restored data. Turn off the flag so next upload wipes it.
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
      setCropStart(''); // Reset crop
      setCropEnd('');
      if (activeObjId === 'COM') setActiveObjId('A'); // Reset to safe object

      if (file.type.startsWith('image/')) {
        setVideoSrc(null);
        setImageSrc(url);
        
        const imgObj = new Image();
        imgObj.src = url;
        imgObj.onload = () => {
          setImageObj(imgObj);
          const w = imgObj.width;
          const h = imgObj.height;
          setVideoDims({ w, h });
          setDuration(0.033); // Mock duration
          
          if (scrollContainerRef.current) {
            const availableW = scrollContainerRef.current.clientWidth - 40; 
            const availableH = scrollContainerRef.current.clientHeight - 40;
            const scaleW = availableW / w;
            const scaleH = availableH / h;
            const fitScale = Math.min(scaleW, scaleH);
            setZoom(fitScale < 1 ? fitScale : 1);
          }
          
          setTimeout(() => renderFrame(), 100);
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

  // NEW: Object Switcher Handler
  const handleObjectSwitch = useCallback((id) => {
      setActiveObjId(id);
      if (id === 'COM') {
          setIsTracking(false);
          setDragState(null);
          setDraggedPointIndex(null);
      }
  }, []);

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
    
    // Allow rendering if we have valid dimensions, even if video/image isn't ready (for restored data)
    if (!canvas || (!video && !imageObj && !hasRestoredData)) return;
    if (videoDims.w === 0 && !hasRestoredData) return;

    const ctx = canvas.getContext('2d');
    
    // Clear and set transform
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0); 
    ctx.clearRect(0, 0, videoDims.w, videoDims.h);

    // 1. DRAW VIDEO OR IMAGE FRAME
    if (imageObj) {
        ctx.drawImage(imageObj, 0, 0, videoDims.w, videoDims.h);
    } else if (video && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, videoDims.w, videoDims.h);
    } else if (hasRestoredData) {
         // Placeholder background if we have points but no video
         ctx.fillStyle = '#1e293b';
         ctx.fillRect(0, 0, videoDims.w || 800, videoDims.h || 600); // Default size if unknown
         ctx.fillStyle = '#64748b';
         ctx.font = '20px sans-serif';
         ctx.fillText("Data Loaded. Please Upload Video/Image.", 50, 50);
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
    
    // NEW: Render Reticle if Tracking (Disabled for COM)
    if (isTracking && reticlePos && activeObjId !== 'COM') {
        drawReticle(reticlePos.x, reticlePos.y, dragState === 'reticle' || dragState === 'reticle_move_jump');
    }

    // --- DRAW MEASUREMENT OVERLAYS ---
    
    // Draw Tape Measure
    if (tapeMeasure) {
      ctx.save();
      const { p1, p2 } = tapeMeasure;

      // Draw dashed yellow-green line
      ctx.beginPath();
      ctx.strokeStyle = '#84cc16'; // yellow-green
      ctx.lineWidth = lw(2.5);
      ctx.setLineDash([5, 5]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // End Pins
      const drawPin = (p, isDragging) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, lw(6), 0, 2 * Math.PI);
        ctx.fillStyle = isDragging ? '#a3e635' : '#84cc16';
        ctx.fill();
        ctx.lineWidth = lw(2);
        ctx.strokeStyle = 'white';
        ctx.stroke();
      };
      
      drawPin(p1, dragState === 'tape_p1');
      drawPin(p2, dragState === 'tape_p2');

      // Metric value text banner
      const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const distVal = pixelsPerMeter ? `${(distPx / pixelsPerMeter).toFixed(3)} m` : `${Math.round(distPx)} px`;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.font = `bold ${lw(12)}px sans-serif`;
      ctx.textAlign = 'center';
      
      const textWidth = ctx.measureText(distVal).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; 
      ctx.fillRect(midX - textWidth/2 - lw(6), midY - lw(10), textWidth + lw(12), lw(20));
      ctx.fillStyle = '#f8fafc'; 
      ctx.fillText(distVal, midX, midY + lw(4));

      ctx.restore();
    }

    // Draw Protractor
    if (protractor) {
      ctx.save();
      const { v, a, b } = protractor;

      // Arm lines
      ctx.beginPath();
      ctx.strokeStyle = '#c084fc'; // Light purple
      ctx.lineWidth = lw(2);
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(a.x, a.y);
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const drawHandle = (p, isDragging) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, lw(6), 0, 2 * Math.PI);
        ctx.fillStyle = isDragging ? '#e9d5ff' : '#a855f7';
        ctx.fill();
        ctx.lineWidth = lw(2);
        ctx.strokeStyle = 'white';
        ctx.stroke();
      };

      drawHandle(v, dragState === 'protractor_v');
      drawHandle(a, dragState === 'protractor_a');
      drawHandle(b, dragState === 'protractor_b');

      // Angle calculation
      const dxA = a.x - v.x;
      const dyA = a.y - v.y;
      const dxB = b.x - v.x;
      const dyB = b.y - v.y;

      const angleA = Math.atan2(dyA, dxA);
      const angleB = Math.atan2(dyB, dxB);
      let diff = angleB - angleA;
      
      while (diff < 0) diff += 2 * Math.PI;
      const angleDeg = (diff * 180) / Math.PI;

      // Angle sector arc filling
      const arcRadius = lw(35);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = lw(1.5);
      ctx.moveTo(v.x, v.y);
      ctx.arc(v.x, v.y, arcRadius, angleA, angleB);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Degree Badge
      const textX = v.x + Math.cos((angleA + angleB) / 2) * lw(55);
      const textY = v.y + Math.sin((angleA + angleB) / 2) * lw(55);
      const valStr = `${angleDeg.toFixed(1)}°`;

      ctx.font = `bold ${lw(12)}px sans-serif`;
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(valStr).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(textX - textWidth/2 - lw(4), textY - lw(8), textWidth + lw(8), lw(16));
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(valStr, textX, textY + lw(4));

      ctx.restore();
    }

    // Draw Line Profile
    if (lineProfile) {
      ctx.save();
      const { p1, p2, spread } = lineProfile;

      // 1. Draw solid thin outer guidelines showing the spread (if spread > 1)
      if (spread > 1) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          const nx = -(dy / len) * (spread / 2);
          const ny = (dx / len) * (spread / 2);

          ctx.beginPath();
          ctx.strokeStyle = isDark ? 'rgba(163, 230, 53, 0.25)' : 'rgba(132, 204, 22, 0.35)'; // Light lime borders
          ctx.lineWidth = lw(1);
          // Upper boundary
          ctx.moveTo(p1.x + nx, p1.y + ny);
          ctx.lineTo(p2.x + nx, p2.y + ny);
          // Lower boundary
          ctx.moveTo(p1.x - nx, p1.y - ny);
          ctx.lineTo(p2.x - nx, p2.y - ny);
          ctx.stroke();

          // Connect endpoints with thin lines
          ctx.beginPath();
          ctx.moveTo(p1.x + nx, p1.y + ny);
          ctx.lineTo(p1.x - nx, p1.y - ny);
          ctx.moveTo(p2.x + nx, p2.y + ny);
          ctx.lineTo(p2.x - nx, p2.y - ny);
          ctx.stroke();
        }
      }

      // 2. Draw dashed center line (Vibrant Lime color)
      ctx.beginPath();
      ctx.strokeStyle = '#84cc16'; // Lime-500
      ctx.lineWidth = lw(2);
      ctx.setLineDash([6, 4]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw End handles
      const drawHandle = (p, isDragging, label) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, lw(7), 0, 2 * Math.PI);
        ctx.fillStyle = isDragging ? '#a3e635' : '#84cc16'; // Lighter green when active
        ctx.fill();
        ctx.lineWidth = lw(2);
        ctx.strokeStyle = 'white';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#84cc16';
        ctx.font = `bold ${lw(11)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, p.x, p.y - lw(12));
      };

      drawHandle(p1, dragState === 'line_p1', 'P1');
      drawHandle(p2, dragState === 'line_p2', 'P2');

      // 4. Draw customized calibration reference crosshairs R1/R2 and vertical guidelines
      if (wavelengthCalibration) {
        const p1_t = wavelengthCalibration.p1_t !== undefined ? wavelengthCalibration.p1_t : 0.0;
        const p2_t = wavelengthCalibration.p2_t !== undefined ? wavelengthCalibration.p2_t : 1.0;
        const r1_x = p1.x + p1_t * (p2.x - p1.x);
        const r1_y = p1.y + p1_t * (p2.y - p1.y);
        const r2_x = p1.x + p2_t * (p2.x - p1.x);
        const r2_y = p1.y + p2_t * (p2.y - p1.y);

        // a. Draw vertical guidelines if checked
        if (showGuidelines) {
          ctx.beginPath();
          ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.55)'; // Cyan with transparency
          ctx.lineWidth = lw(1.5);
          ctx.setLineDash([4, 4]);
          ctx.moveTo(r1_x, 0);
          ctx.lineTo(r1_x, videoDims.h);
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.55)'; // Red with transparency
          ctx.moveTo(r2_x, 0);
          ctx.lineTo(r2_x, videoDims.h);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // b. Draw target markers on the line
        const drawRefMarker = (rx, ry, color, label, isDragging) => {
          ctx.beginPath();
          ctx.arc(rx, ry, lw(6), 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.lineWidth = lw(2);
          ctx.strokeStyle = 'white';
          ctx.stroke();

          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(rx - lw(9), ry);
          ctx.lineTo(rx + lw(9), ry);
          ctx.moveTo(rx, ry - lw(9));
          ctx.lineTo(rx, ry + lw(9));
          ctx.strokeStyle = color;
          ctx.lineWidth = lw(1.5);
          ctx.stroke();

          // Label
          ctx.fillStyle = color;
          ctx.font = `bold ${lw(10)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(label, rx, ry - lw(12));
        };

        drawRefMarker(r1_x, r1_y, '#06b6d4', 'R1', dragState === 'line_r1');
        drawRefMarker(r2_x, r2_y, '#ef4444', 'R2', dragState === 'line_r2');
      }

      ctx.restore();
    }

    // --- DRAW DYNAMIC KINEMATIC VECTORS ---
    const sortedPoints = [...points].sort((a, b) => a.time - b.time);
    const activeIndex = sortedPoints.findIndex(p => Math.abs(p.time - currentTimeRef.current) < 0.01);

    const getScreenVelocity = (idx) => {
      if (sortedPoints.length < 3) return { vx: 0, vy: 0 };
      let vx = 0, vy = 0;
      if (idx === 0) {
        const p0 = sortedPoints[0], p1 = sortedPoints[1], p2 = sortedPoints[2];
        const dt = p1.time - p0.time;
        if (dt > 0.0001) {
          vx = (-3 * p0.x + 4 * p1.x - p2.x) / (2 * dt);
          vy = (-3 * p0.y + 4 * p1.y - p2.y) / (2 * dt);
        }
      } else if (idx === sortedPoints.length - 1) {
        const pN = sortedPoints[sortedPoints.length - 1], pN1 = sortedPoints[sortedPoints.length - 2], pN2 = sortedPoints[sortedPoints.length - 3];
        const dt = pN.time - pN1.time;
        if (dt > 0.0001) {
          vx = (3 * pN.x - 4 * pN1.x + pN2.x) / (2 * dt);
          vy = (3 * pN.y - 4 * pN1.y + pN2.y) / (2 * dt);
        }
      } else {
        const pPrev = sortedPoints[idx - 1], pNext = sortedPoints[idx + 1];
        const dt = pNext.time - pPrev.time;
        if (dt > 0.0001) {
          vx = (pNext.x - pPrev.x) / dt;
          vy = (pNext.y - pPrev.y) / dt;
        }
      }
      return { vx, vy };
    };

    const drawArrow = (fromX, fromY, dx, dy, color, label) => {
      const arrowLength = Math.sqrt(dx * dx + dy * dy);
      if (arrowLength < 2) return; 

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw(3);
      ctx.moveTo(fromX, fromY);
      
      const toX = fromX + dx;
      const toY = fromY + dy;
      ctx.lineTo(toX, toY);
      ctx.stroke();

      const angle = Math.atan2(dy, dx);
      const headLength = lw(10);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = `bold ${lw(11)}px sans-serif`;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = lw(2);
      ctx.fillText(label, toX + lw(8) * Math.cos(angle), toY + lw(8) * Math.sin(angle) + lw(3));
      ctx.restore();
    };

    if (activeIndex !== -1 && sortedPoints.length >= 3) {
      const activeP = sortedPoints[activeIndex];
      
      if (showVelocityVectors) {
        const sVel = getScreenVelocity(activeIndex);
        const vScaleFactor = 0.5 * vectorScale;
        drawArrow(activeP.x, activeP.y, sVel.vx * vScaleFactor, sVel.vy * vScaleFactor, '#22d3ee', 'v');
      }

      if (showAccelerationVectors) {
        let sax = 0, say = 0;
        if (activeIndex === 0) {
          const v0 = getScreenVelocity(0), v1 = getScreenVelocity(1), v2 = getScreenVelocity(2);
          const dt0 = sortedPoints[1].time - sortedPoints[0].time;
          if (dt0 > 0.0001) {
            sax = (-3 * v0.vx + 4 * v1.vx - v2.vx) / (2 * dt0);
            say = (-3 * v0.vy + 4 * v1.vy - v2.vy) / (2 * dt0);
          }
        } else if (activeIndex === sortedPoints.length - 1) {
          const vM = getScreenVelocity(sortedPoints.length - 1), vM1 = getScreenVelocity(sortedPoints.length - 2), vM2 = getScreenVelocity(sortedPoints.length - 3);
          const dtM = sortedPoints[sortedPoints.length - 1].time - sortedPoints[sortedPoints.length - 2].time;
          if (dtM > 0.0001) {
            sax = (3 * vM.vx - 4 * vM1.vx + vM2.vx) / (2 * dtM);
            say = (3 * vM.vy - 4 * vM1.vy + vM2.vy) / (2 * dtM);
          }
        } else {
          const vPrev = getScreenVelocity(activeIndex - 1), vNext = getScreenVelocity(activeIndex + 1);
          const dtC = sortedPoints[activeIndex + 1].time - sortedPoints[activeIndex - 1].time;
          if (dtC > 0.0001) {
            sax = (vNext.vx - vPrev.vx) / dtC;
            say = (vNext.vy - vPrev.vy) / dtC;
          }
        }
        
        const aScaleFactor = 0.1 * vectorScale;
        drawArrow(activeP.x, activeP.y, sax * aScaleFactor, say * aScaleFactor, '#fbbf24', 'a');
      }
    }

  }, [points, videoDims, zoom, origin, originAngle, calibrationPoints, isCalibrating, isScaleVisible, dragState, draggedPointIndex, uncertaintyPx, reticlePos, isTracking, hasRestoredData, activeObjectColor, t, activeObjId, protractor, tapeMeasure, showVelocityVectors, showAccelerationVectors, vectorScale, pixelsPerMeter, lineProfile, imageObj, wavelengthCalibration, showGuidelines]);

  const sampleLineIntensity = useCallback(() => {
    const video = videoRef.current;
    if ((!video && !imageObj) || !lineProfile || videoDims.w === 0) return;
    
    // Create offscreen canvas at native dimensions
    const canvas = document.createElement('canvas');
    canvas.width = videoDims.w;
    canvas.height = videoDims.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw raw video frame or image
    try {
      if (imageObj) {
        ctx.drawImage(imageObj, 0, 0, videoDims.w, videoDims.h);
      } else if (video) {
        ctx.drawImage(video, 0, 0, videoDims.w, videoDims.h);
      }
    } catch (e) {
      return; // Media might not be ready
    }
    
    // Get image data
    const imgData = ctx.getImageData(0, 0, videoDims.w, videoDims.h);
    const data = imgData.data;
    const width = imgData.width;
    const height = imgData.height;
    
    // Sample points along line Profile (p1/p2 are already in native video coordinates)
    const x1 = lineProfile.p1.x;
    const y1 = lineProfile.p1.y;
    const x2 = lineProfile.p2.x;
    const y2 = lineProfile.p2.y;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    
    const ux = dx / len;
    const uy = dy / len;
    
    // Normal perpendicular unit vector
    const nx = -uy;
    const ny = ux;
    
    const N = Math.floor(len); // Sample at roughly every pixel along the line
    const spread = lineProfile.spread || 1;
    const K = Math.floor(spread / 2);
    const channel = lineProfile.channel || 'luma';
    
    const results = [];
    
    for (let i = 0; i <= N; i++) {
      const pct = i / N;
      const cx = x1 + pct * dx;
      const cy = y1 + pct * dy;
      
      let sumIntensity = 0;
      let sumR = 0, sumG = 0, sumB = 0;
      let sampleCount = 0;
      
      // Perpendicular averaging (Spread)
      for (let k = -K; k <= K; k++) {
        const sx = Math.floor(cx + k * nx);
        const sy = Math.floor(cy + k * ny);
        
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const idx = (sy * width + sx) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          sumR += r;
          sumG += g;
          sumB += b;
          
          let val = 0;
          if (channel === 'red') val = r;
          else if (channel === 'green') val = g;
          else if (channel === 'blue') val = b;
          else {
            // Luma
            val = 0.299 * r + 0.587 * g + 0.114 * b;
          }
          sumIntensity += val;
          sampleCount++;
        }
      }
      
      if (sampleCount > 0) {
        results.push({
          index: i,
          distance: i, // Raw distance in pixels
          intensity: Math.round(sumIntensity / sampleCount),
          r: Math.round(sumR / sampleCount),
          g: Math.round(sumG / sampleCount),
          b: Math.round(sumB / sampleCount)
        });
      }
    }
    
    setSpectralData(results);
  }, [lineProfile, videoDims, imageObj]);

  // Sync sampling on video updates or line profile changes
  useEffect(() => {
    if (lineProfile) {
      sampleLineIntensity();
    }
  }, [currentTime, lineProfile, sampleLineIntensity]);

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
          videoRef.current.currentTime = currentTimeRef.current;
        }
        // 3. Force a redraw of the canvas points (Fixes Centering/Blank Canvas)
        // Wrapped in requestAnimationFrame to ensure it runs during a paint cycle
        requestAnimationFrame(() => renderFrame());
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, renderFrame]);

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
    if ((!videoRef.current && !imageObj) || showInputModal) return;

    // --- CUSTOM TOUCH PANNING FIX ---
    // We handle all touches instantly to avoid Safari's native scroll delay
    
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    
    // --- FAT FINGER DETECTION ---
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    const hitRadius = (isTouch ? 45 : 15) / zoom; 
    const reticleHitRadius = (isTouch ? 80 : 60) / zoom; 

    let isInteractiveTarget = false; // Flag to track if we hit something actionable
    let newDragState = null; // NEW: Local tracker for immediate state logic

    // PRIORITY 0.1: TAPE MEASURE
    if (tapeMeasure) {
      const distP1 = Math.sqrt(Math.pow(x - tapeMeasure.p1.x, 2) + Math.pow(y - tapeMeasure.p1.y, 2));
      const distP2 = Math.sqrt(Math.pow(x - tapeMeasure.p2.x, 2) + Math.pow(y - tapeMeasure.p2.y, 2));
      
      if (distP1 < hitRadius) {
        isInteractiveTarget = true;
        newDragState = 'tape_p1';
        setDragState('tape_p1');
      } else if (distP2 < hitRadius) {
        isInteractiveTarget = true;
        newDragState = 'tape_p2';
        setDragState('tape_p2');
      }
    }

    // PRIORITY 0.15: LINE PROFILE
    if (!isInteractiveTarget && lineProfile) {
      // 0. Check Snapping click mode
      if (activeClickTarget && wavelengthCalibration) {
        isInteractiveTarget = true;
        const t_proj = projectPointToSegmentT(x, y, lineProfile.p1.x, lineProfile.p1.y, lineProfile.p2.x, lineProfile.p2.y, false);
        setWavelengthCalibration(prev => ({
          ...prev,
          p1_t: activeClickTarget === 'r1' ? t_proj : (prev?.p1_t ?? 0.0),
          p2_t: activeClickTarget === 'r2' ? t_proj : (prev?.p2_t ?? 1.0)
        }));
        setActiveClickTarget(null);
        return;
      }

      // Check R1 and R2 calibration handles (only if they are placed away from the line endpoints P1 and P2)
      if (wavelengthCalibration) {
        const p1_t = wavelengthCalibration.p1_t !== undefined ? wavelengthCalibration.p1_t : 0.0;
        const p2_t = wavelengthCalibration.p2_t !== undefined ? wavelengthCalibration.p2_t : 1.0;
        const r1_x = lineProfile.p1.x + p1_t * (lineProfile.p2.x - lineProfile.p1.x);
        const r1_y = lineProfile.p1.y + p1_t * (lineProfile.p2.y - lineProfile.p1.y);
        const r2_x = lineProfile.p1.x + p2_t * (lineProfile.p2.x - lineProfile.p1.x);
        const r2_y = lineProfile.p1.y + p2_t * (lineProfile.p2.y - lineProfile.p1.y);

        const distR1 = Math.sqrt(Math.pow(x - r1_x, 2) + Math.pow(y - r1_y, 2));
        const distR2 = Math.sqrt(Math.pow(x - r2_x, 2) + Math.pow(y - r2_y, 2));

        if (distR1 < hitRadius && p1_t > 0.02 && p1_t < 0.98) {
          isInteractiveTarget = true;
          newDragState = 'line_r1';
          setDragState('line_r1');
        } else if (distR2 < hitRadius && p2_t > 0.02 && p2_t < 0.98) {
          isInteractiveTarget = true;
          newDragState = 'line_r2';
          setDragState('line_r2');
        }
      }

      if (!isInteractiveTarget) {
        const distP1 = Math.sqrt(Math.pow(x - lineProfile.p1.x, 2) + Math.pow(y - lineProfile.p1.y, 2));
        const distP2 = Math.sqrt(Math.pow(x - lineProfile.p2.x, 2) + Math.pow(y - lineProfile.p2.y, 2));
        
        if (distP1 < hitRadius) {
          isInteractiveTarget = true;
          newDragState = 'line_p1';
          setDragState('line_p1');
        } else if (distP2 < hitRadius) {
          isInteractiveTarget = true;
          newDragState = 'line_p2';
          setDragState('line_p2');
        } else {
        const distToLine = getDistanceToSegment(x, y, lineProfile.p1.x, lineProfile.p1.y, lineProfile.p2.x, lineProfile.p2.y);
        if (distToLine < hitRadius) {
          isInteractiveTarget = true;
          newDragState = 'line_body';
          setDragState('line_body');
          lineProfileStartRef.current = {
            p1: { ...lineProfile.p1 },
            p2: { ...lineProfile.p2 },
            click: { x, y }
          };
        }
      }
      }
    }

    // PRIORITY 0.2: PROTRACTOR
    if (!isInteractiveTarget && protractor) {
      const distV = Math.sqrt(Math.pow(x - protractor.v.x, 2) + Math.pow(y - protractor.v.y, 2));
      const distA = Math.sqrt(Math.pow(x - protractor.a.x, 2) + Math.pow(y - protractor.a.y, 2));
      const distB = Math.sqrt(Math.pow(x - protractor.b.x, 2) + Math.pow(y - protractor.b.y, 2));
      
      if (distV < hitRadius) {
        isInteractiveTarget = true;
        newDragState = 'protractor_v';
        setDragState('protractor_v');
      } else if (distA < hitRadius) {
        isInteractiveTarget = true;
        newDragState = 'protractor_a';
        setDragState('protractor_a');
      } else if (distB < hitRadius) {
        isInteractiveTarget = true;
        newDragState = 'protractor_b';
        setDragState('protractor_b');
      }
    }

    // PRIORITY 1: RETICLE LOGIC
    if (!isCalibrating && isTracking && reticlePos && activeObjId !== 'COM') {
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
    if (!isInteractiveTarget && activeObjId !== 'COM') {
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
       } else if (e.pointerType === 'mouse' && !isCalibrating && isTracking && reticlePos && activeObjId !== 'COM') {
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

    // --- OVERLAYS DRAG HANDLERS ---
    if (dragState === 'tape_p1') {
      setTapeMeasure({ ...tapeMeasure, p1: { x, y } });
    } else if (dragState === 'tape_p2') {
      setTapeMeasure({ ...tapeMeasure, p2: { x, y } });
    } else if (dragState === 'protractor_v') {
      const dxA = protractor.a.x - protractor.v.x;
      const dyA = protractor.a.y - protractor.v.y;
      const dxB = protractor.b.x - protractor.v.x;
      const dyB = protractor.b.y - protractor.v.y;
      setProtractor({
        v: { x, y },
        a: { x: x + dxA, y: y + dyA },
        b: { x: x + dxB, y: y + dyB }
      });
    } else if (dragState === 'protractor_a') {
      setProtractor({ ...protractor, a: { x, y } });
    } else if (dragState === 'protractor_b') {
      setProtractor({ ...protractor, b: { x, y } });
    } else if (dragState === 'line_p1') {
      setLineProfile({ ...lineProfile, p1: { x, y } });
    } else if (dragState === 'line_p2') {
      setLineProfile({ ...lineProfile, p2: { x, y } });
    } else if (dragState === 'line_r1' || dragState === 'line_r2') {
      if (lineProfile) {
        const t_proj = projectPointToSegmentT(x, y, lineProfile.p1.x, lineProfile.p1.y, lineProfile.p2.x, lineProfile.p2.y, true);
        setWavelengthCalibration(prev => ({
          ...prev,
          p1_t: dragState === 'line_r1' ? t_proj : (prev?.p1_t ?? 0.0),
          p2_t: dragState === 'line_r2' ? t_proj : (prev?.p2_t ?? 1.0)
        }));
      }
    } else if (dragState === 'line_body') {
      const dx = x - lineProfileStartRef.current.click.x;
      const dy = y - lineProfileStartRef.current.click.y;
      setLineProfile({
        ...lineProfile,
        p1: { x: lineProfileStartRef.current.p1.x + dx, y: lineProfileStartRef.current.p1.y + dy },
        p2: { x: lineProfileStartRef.current.p2.x + dx, y: lineProfileStartRef.current.p2.y + dy }
      });
    }
    else if (dragState === 'origin') {
      setOrigin({ x, y });
    } else if (dragState === 'rotate' && origin) {
      const dx = x - origin.x;
      const dy = y - origin.y;
      setOriginAngle(Math.atan2(dy, dx));
    } else if (dragState === 'point' && draggedPointIndex !== null && activeObjId !== 'COM') {
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
        if (dist < 10 && activeObjId !== 'COM') {
            // FIRE! Record Point
            const time = videoRef.current ? videoRef.current.currentTime : 0;
            setPoints([...points, { id: Date.now(), x: reticlePos.x, y: reticlePos.y, time }]);
            stepForward();
            // Reticle stays where it is, ready for next adjustment
        }
    } else if (dragState === 'point') {
      if (isHoveringTrash && activeObjId !== 'COM') {
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
    if (imageObj) return;
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
  }, [fps, currentFrameIndex, imageObj]);

  const stepBackward = useCallback(() => { 
    if (imageObj) return;
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
  }, [fps, currentFrameIndex, imageObj]);

  // Handler for when the video *actually* finishes moving to new time
  const handleSeeked = useCallback(() => {
    if (imageObj) return;
    if (videoRef.current) {
      // Sync strictly on seeked to handle external events, but stepping relies on state
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      // We don't overwrite currentFrameIndex here to avoid the "analog" drift loops
      renderFrame(); // <--- FIXED: Restored this call to update the canvas
    }
  }, [renderFrame, imageObj]);

  // Handler for when video has decoded first frame (fixes black screen)
  const handleLoadedData = useCallback(() => {
    renderFrame();
  }, [renderFrame]);

  const togglePlay = async () => { 
    if (imageObj) return;
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
    if (imageObj) return;
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
      let data = ['vx', 'vy'].includes(plotY) ? velocityData : positionData;
      
      // NEW: Apply Data Cropping Filter
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
            text: `y = ${slope.toFixed(4)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(4)}`, 
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
            text: `y = ${a.toFixed(4)}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(4)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)}`, 
            fn: (x) => a * x * x + b * x + c, 
            params: { A: a, B: b, C: c } 
          };
      }
    }
    else if (fitModel === 'sinusoidal' && n > 3) {
      // NEW: HEURISTIC SINUSOIDAL ESTIMATOR
      const yMax = Math.max(...yData);
      const yMin = Math.min(...yData);
      const D = (yMax + yMin) / 2;
      const A = (yMax - yMin) / 2;

      // 1. Estimate Period (T) via Zero-Crossings
      let crosses = [];
      for(let i = 1; i < n; i++) {
          const y1 = yData[i-1] - D;
          const y2 = yData[i] - D;
          if(y1 * y2 <= 0 && y1 !== y2) { // Sign change
              const dx = xData[i] - xData[i-1];
              const dy = y2 - y1;
              const xCross = xData[i-1] - y1 * (dx / dy); // Linear interpolation
              crosses.push(xCross);
          }
      }

      let T;
      if (crosses.length >= 2) {
          let sumDiff = 0;
          for(let i=1; i<crosses.length; i++) sumDiff += (crosses[i] - crosses[i-1]);
          T = 2 * (sumDiff / (crosses.length - 1)); // Distance between crossings is half a period
      } else {
          // Fallback: Max to Min distance
          const xMax = xData[yData.indexOf(yMax)];
          const xMin = xData[yData.indexOf(yMin)];
          T = 2 * Math.abs(xMax - xMin);
          if (T === 0) T = 1; // Prevent division by zero
      }

      const B_est = (2 * Math.PI) / T;

      // 2. Grid Search to find Phase (C) and fine-tune Frequency (B)
      let bestB = B_est;
      let bestC = 0;
      let minError = Infinity;

      // Sweep B slightly around estimate, and sweep C across a full cycle
      for(let b_mult = 0.8; b_mult <= 1.2; b_mult += 0.05) {
          const testB = B_est * b_mult;
          for(let c = -Math.PI; c <= Math.PI; c += 0.1) {
              let error = 0;
              for(let i=0; i<n; i++) {
                  const pred = A * Math.sin(testB * xData[i] + c) + D;
                  error += Math.pow(yData[i] - pred, 2);
              }
              if (error < minError) {
                  minError = error;
                  bestB = testB;
                  bestC = c;
              }
          }
      }

      result = {
          type: 'Sinusoidal',
          text: `y = ${A.toFixed(4)}sin(${bestB.toFixed(4)}x ${bestC >= 0 ? '+' : '-'} ${Math.abs(bestC).toFixed(4)}) ${D >= 0 ? '+' : '-'} ${Math.abs(D).toFixed(4)}`,
          fn: (x) => A * Math.sin(bestB * x + bestC) + D,
          params: { A: A, B: bestB, C: bestC, D: D }
      };
    }

    if (result) {
        const yMean = sum(yData) / n;
        const ssTot = yData.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
        const ssRes = validData.reduce((acc, d) => {
            const pred = result.fn(d[plotX]);
            return acc + Math.pow(d[plotY] - pred, 2);
        }, 0);
        // Protect against perfectly flat lines causing NaN R2
        const r2 = ssTot === 0 ? 1 : (1 - (ssRes / ssTot));
        result.r2 = r2;
    }

    return result;
  }, [fitModel, activeData, plotX, plotY]);

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

    const resolution = 150;
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
      <Header 
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

              <div ref={scrollContainerRef} className={`flex-1 overflow-auto flex items-start p-4 relative ${styles.workspaceBg}`}>
                {/* Snapping Mode Banner overlay */}
                {activeClickTarget && (
                   <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-full font-bold shadow-2xl flex items-center gap-3 transition-all animate-pulse select-none border border-white/20">
                     <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                     <span className="text-xs tracking-wide">
                       {activeClickTarget === 'r1' ? t.snappingPrompt : t.snappingPrompt2}
                     </span>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setActiveClickTarget(null);
                       }} 
                       className="ml-2 px-2 py-0.5 rounded bg-black/35 hover:bg-black/50 text-[10px] text-amber-200 transition font-bold"
                     >
                       {t.cancel}
                     </button>
                   </div>
                )}
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
                {(videoSrc || imageSrc) ? (
                  // CANVAS-FIRST RENDER: Video is HIDDEN (opacity 0), Canvas draws the frame
                  // Added flex-none to prevent aspect ratio distortion during zoom
                  <div className="relative shadow-2xl origin-top-left bg-black mt-10 flex-none mx-auto" ref={containerRef} style={{ width: Math.floor(videoDims.w * zoom), height: Math.floor(videoDims.h * zoom) }}>
                    {/* MEMOIZED VIDEO ELEMENT WITH GPU LAYER FORCE */}
                    {videoSrc && videoElement}
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
                        className={`${activeClickTarget ? 'cursor-crosshair' : dragState === 'origin' ? 'cursor-move' : dragState === 'rotate' ? 'cursor-grab' : dragState === 'pan' ? 'cursor-grabbing' : dragState === 'point' || dragState === 'calibration' ? 'cursor-grabbing' : (isSettingOrigin) ? 'cursor-crosshair' : (isTracking && !dragState) ? 'cursor-default' : 'cursor-default'}`} 
                    />
                  </div>
                ) : ( 
                  // FIX: Added 'w-full' here so the empty state text expands and centers itself correctly
                  <div className={`w-full text-center mt-20 ${styles.textSecondary}`}> 
                    <Upload size={48} className="mx-auto mb-4 opacity-50" /> 
                    <p>{t.uploadPrompt}</p> 
                  </div> 
                )}
              </div>
              <div className={`h-20 border-t flex items-center justify-center gap-8 px-6 shrink-0 z-30 ${styles.panel}`}>
                 <button onClick={undoLastPoint} disabled={points.length === 0 || activeObjId === 'COM'} className={`p-3 rounded-full transition disabled:opacity-30 ${styles.buttonSecondary}`} title={t.undoLast}> <Undo2 size={20} /> </button>
                 <div className={`flex items-center gap-4 px-6 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'} ${imageObj ? 'opacity-40 pointer-events-none' : ''}`}> 
                    <button onClick={stepBackward} disabled={!!imageObj} className={`p-2 rounded-full transition active:scale-90 active:bg-blue-500 active:text-white ${styles.buttonSecondary}`} title={t.prevFrame}> <SkipBack size={20} /> </button> 
                    <button onClick={togglePlay} disabled={!!imageObj} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow-lg shadow-blue-900/20" title={t.playPause}> {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />} </button> 
                    <button onClick={stepForward} disabled={!!imageObj} className={`p-2 rounded-full transition active:scale-90 active:bg-blue-500 active:text-white ${styles.buttonSecondary}`} title={t.nextFrame}> <SkipForward size={20} /> </button> 
                 </div>
                 <div className="flex-1 max-w-xl mx-4 flex items-center gap-3"> <span className={`text-xs font-mono w-12 text-right ${styles.textSecondary}`}>{formatTime(currentTime)}</span> <input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeek} disabled={!!imageObj} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30 disabled:pointer-events-none" /> <span className={`text-xs font-mono w-12 ${styles.textSecondary}`}>{formatTime(duration)}</span> </div>
                 <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}> <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.zoomOut}> <ZoomOut size={18} /> </button> <span className={`text-sm font-mono w-12 text-center ${styles.textSecondary}`}>{Math.round(zoom * 100)}%</span> <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.zoomIn}> <ZoomIn size={18} /> </button> <div className={`w-px h-6 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div> <button onClick={() => setZoom(1)} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.resetView}> <Maximize size={18} /> </button> </div>
              </div>
            </div>

            <Sidebar 
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
