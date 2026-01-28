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
import { Upload, Trash2, Play, Pause, AlertCircle, Ruler, Crosshair, Table, Activity, SkipBack, SkipForward, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Maximize, Undo2, CheckCircle2, Info, Download, TrendingUp, Clock, Target, CircleDashed, Calculator, Sun, Moon, Camera, LayoutTemplate, Save, FolderOpen, RefreshCw, Users, X } from 'lucide-react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar } from 'recharts';

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
const calculateNiceScale = (minValue, maxValue) => {
  if (!isFinite(minValue) || !isFinite(maxValue) || minValue === maxValue) return { min: 0, max: 10, ticks: [0, 10] };

  const range = maxValue - minValue;
  const padding = range === 0 ? 1 : range * 0.05;
  const paddedMin = minValue - padding;
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

  return { min: niceMin, max: niceMax, ticks };
};

// --- HELPER: VIDEO FRAME CONSTANTS ---
const FPS = 30;
const FRAME_DURATION = 1 / FPS; 

export default function App() {
  // --- STATE MANAGEMENT ---
  
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
        viewMode
    };
    localStorage.setItem('physTracker_autosave', JSON.stringify(stateToSave));
  }, [objects, activeObjId, calibrationPoints, pixelsPerMeter, origin, originAngle, zeroTime, fitModel, uncertaintyPx, viewMode]);

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
        uncertaintyPx
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
            ctx.fillText("TAP TO FIRE", x + lw(35), y - lw(35));
        }
        
        ctx.restore();
    };

    if (origin) {
      ctx.save(); 
      ctx.translate(origin.x, origin.y);
      ctx.rotate(originAngle);
      const length = Math.max(videoDims.w, videoDims.h) * 2;
      
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; 
      ctx.lineWidth = lw(2.5); 
      ctx.moveTo(-length, 0); ctx.lineTo(length, 0);
      ctx.moveTo(0, -length); ctx.lineTo(0, length);
      ctx.stroke();
      
      ctx.beginPath(); ctx.arc(0, 0, lw(7), 0, 2 * Math.PI); 
      ctx.fillStyle = '#3b82f6'; ctx.fill(); 
      
      const handleDist = lw(100); 
      ctx.beginPath(); ctx.arc(handleDist, 0, lw(6), 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; ctx.strokeStyle = '#3b82f6'; ctx.fill(); ctx.stroke();
      
      ctx.fillStyle = '#3b82f6'; ctx.font = `bold ${lw(12)}px Arial`;
      ctx.fillText("+X", length - lw(20), -lw(5)); 
      ctx.fillText("+Y", lw(5), -length + lw(20)); 
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

  }, [points, videoDims, zoom, origin, originAngle, calibrationPoints, isCalibrating, isScaleVisible, dragState, draggedPointIndex, uncertaintyPx, reticlePos, isTracking, hasRestoredData, activeObjectColor]);

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

    // CRITICAL: Prevent default browser behavior (scrolling) and capture the pointer
    // This allows dragging to continue even if the pointer leaves the canvas bounds
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitRadius = 15 / zoom; 

    // PRIORITY 1: RETICLE LOGIC (Moves to top to prevent dragging underlying points)
    if (!isCalibrating && isTracking && reticlePos) {
      // Distance to current reticle position
      const distToReticle = Math.sqrt(Math.pow(x - reticlePos.x, 2) + Math.pow(y - reticlePos.y, 2));
      
      // Define Reticle Hit Radius - MUCH LARGER for easier grabbing
      const reticleHitRadius = 60 / zoom; 

      if (distToReticle < reticleHitRadius) {
          // User hit the reticle -> Start Dragging/Aiming
          setDragState('reticle');
          // Store START position and time to detect TAP vs DRAG later
          dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          // Calculate offset so dragging is relative
          dragOffsetRef.current = { x: reticlePos.x - x, y: reticlePos.y - y };
          // Return immediately so we don't accidentally select a point underneath
          return;
      }
    }

    // 2. Check Existing Points (Secondary Priority)
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
      if (dist < hitRadius) {
        setDragState('point');
        setDraggedPointIndex(i);
        setMousePos({ x: e.clientX, y: e.clientY });
        return;
      }
    }

    // 3. Check Calibration Points
    if (isCalibrating || (isScaleVisible && calibrationPoints.length > 0)) {
      for (let i = 0; i < calibrationPoints.length; i++) {
        const p = calibrationPoints[i];
        const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
        if (dist < hitRadius + 5/zoom) {
          setDragState('calibration');
          setDraggedPointIndex(i);
          setMousePos({ x: e.clientX, y: e.clientY });
          return;
        }
      }
    }

    // 4. Check Origin
    if (origin) {
      const distOrigin = Math.sqrt(Math.pow(x - origin.x, 2) + Math.pow(y - origin.y, 2));
      if (distOrigin < hitRadius) { setDragState('origin'); return; }
      
      const handleDist = 100 / zoom; 
      const handleX = origin.x + handleDist * Math.cos(originAngle);
      const handleY = origin.y + handleDist * Math.sin(originAngle);
      const distHandle = Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2));
      if (distHandle < hitRadius) { setDragState('rotate'); return; }
    }

    if (isSettingOrigin) {
      setOrigin({ x, y }); setOriginAngle(0); setIsSettingOrigin(false); return;
    }

    // 5. Reticle Jump (Fallback if nothing else hit)
    if (!isCalibrating && isTracking && reticlePos) {
       // User hit empty space -> Jump Reticle to here (Coarse Aiming)
       setDragState('reticle_move_jump');
       setReticlePos({ x, y });
       dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
       setMousePos({ x: e.clientX, y: e.clientY });
       return;
    }
  };

  const handlePointerMove = (e) => {
    if (isTracking || dragState) {
        setMousePos({ x: e.clientX, y: e.clientY });
    }

    if (!dragState) return;

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
        // Absolute move for jumps
        setReticlePos({ x, y });
    }
  };

  const handlePointerUp = (e) => {
    // Release the capture so other elements can interact again
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (dragState === 'reticle') {
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
      
      const currentTime = videoRef.current.currentTime;
      // GRID-ALIGNED STEPPING (SYMMETRIC):
      // Calculate current frame index based on 30fps
      const currentFrame = Math.floor(currentTime * FPS + 0.001); // +epsilon to handle float precision
      const nextFrame = currentFrame + 1;
      
      // Calculate target time: EXACT start of next frame + small epsilon
      const targetTime = (nextFrame * FRAME_DURATION) + 0.001;
      
      const finalTime = Math.min(videoRef.current.duration, targetTime);
      videoRef.current.currentTime = finalTime;
    } 
  }, []);

  const stepBackward = useCallback(() => { 
    if (videoRef.current) { 
      videoRef.current.pause(); 
      setIsPlaying(false); 
      
      const currentTime = videoRef.current.currentTime;
      const currentFrame = Math.round(currentTime * FPS); // Use round to find current block robustly
      const prevFrame = currentFrame - 1;
      
      const targetTime = (prevFrame * FRAME_DURATION) + 0.001;
      const finalTime = Math.max(0, targetTime);
      
      videoRef.current.currentTime = finalTime;
    } 
  }, []);

  // Handler for when the video *actually* finishes moving to new time
  const handleSeeked = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      renderFrame(); // Force redraw on seek
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
      // Manual seek is fine to update immediately for responsiveness
      videoRef.current.currentTime = time;
      setCurrentTime(time);
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
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

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
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const pCurrent = sortedPoints[i];
        const pNext = sortedPoints[i+1];
        
        const dt = pNext.time - pCurrent.time;
        if (dt <= 0) continue;

        const tMid = (pCurrent.time + pNext.time) / 2.0;
        const adjustedTMid = zeroTime ? (tMid - startTime) : tMid;

        const { x: curX, y: curY } = getRotatedCoords(pCurrent.x, pCurrent.y);
        const { x: nxtX, y: nxtY } = getRotatedCoords(pNext.x, pNext.y);

        const vx = (formatVal(nxtX) - formatVal(curX)) / dt;
        const vy = (formatVal(nxtY) - formatVal(curY)) / dt;

        velData.push({
            time: parseFloat(adjustedTMid.toFixed(3)),
            vx: parseFloat(vx.toFixed(3)),
            vy: parseFloat(vy.toFixed(3)),
            x: null, 
            y: null,
            error: null 
        });
    }

    return { positionData: posData, velocityData: velData };
  }, [points, origin, originAngle, pixelsPerMeter, zeroTime, uncertaintyPx, startTime]);

  const activeData = useMemo(() => {
      if (['vx', 'vy'].includes(plotY)) {
          return velocityData;
      }
      return positionData;
  }, [plotY, positionData, velocityData]);

  // --- SCALE CALCULATION ---
  const xScale = useMemo(() => {
    if (activeData.length === 0) return { min: 0, max: 10, ticks: [] };
    const vals = activeData.map(d => d[plotX]).filter(v => isFinite(v));
    return calculateNiceScale(Math.min(...vals), Math.max(...vals));
  }, [activeData, plotX]);

  const yScale = useMemo(() => {
    if (activeData.length === 0) return { min: 0, max: 10, ticks: [] };
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

  const labels = { 'time': 'Time (s)', 'x': 'X Position (m)', 'y': 'Y Position (m)', 'vx': 'Velocity (m/s)', 'vy': 'Velocity (m/s)' };

  const downloadCSV = () => {
    const headers = ["Time (s)", "X (m)", "Y (m)", "Uncertainty (m)"];
    const rows = positionData.map(row => `${row.time},${row.x},${row.y},${row.error}`);
    const vHeaders = ["\nVelocity Data (Midpoint)", "Time Mid (s)", "Vx (m/s)", "Vy (m/s)"];
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
        // Push Y label left (decrease dy because of rotation)
        let currentDy = parseFloat(t.getAttribute("dy")) || 0;
        t.setAttribute("dy", currentDy - 30);
      }
    });

    const gridLines = svgClone.querySelectorAll(".recharts-cartesian-grid line");
    gridLines.forEach(l => { 
      l.setAttribute("stroke", "#9ca3af"); 
      l.removeAttribute("stroke-dasharray"); 
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

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    gridLines.forEach(line => {
      const x1 = parseFloat(line.getAttribute("x1"));
      const x2 = parseFloat(line.getAttribute("x2"));
      const y1 = parseFloat(line.getAttribute("y1"));
      const y2 = parseFloat(line.getAttribute("y2"));
      if (!isNaN(x1)) { minX = Math.min(minX, x1); maxX = Math.max(maxX, x1); }
      if (!isNaN(x2)) { minX = Math.min(minX, x2); maxX = Math.max(maxX, x2); }
      if (!isNaN(y1)) { minY = Math.min(minY, y1); maxY = Math.max(maxY, y1); }
      if (!isNaN(y2)) { minY = Math.min(minY, y2); maxY = Math.max(maxY, y2); }
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
    } else {
        minX = 60; minY = 20; 
        maxX = 740; maxY = 380;
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
            const dataLabel = isVelocity ? "Calculated Velocity Data" : (isPosition ? "Experimental Position Data" : "Data Points");
            ctx.fillText(dataLabel, boxX + 50, boxY + 35);

            ctx.fillText("Trend Line", boxX + 50, boxY + 65);

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
          <h1 className="text-xl font-bold text-blue-400">PhysTracker</h1>
          <div className={`flex rounded p-1 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button onClick={() => setViewMode('tracker')} className={`px-4 py-1 text-sm rounded transition ${viewMode === 'tracker' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white shadow-sm text-slate-900') : styles.textSecondary + ' hover:' + styles.text}`}>Tracker</button>
            <button onClick={() => setViewMode('analysis')} className={`px-4 py-1 text-sm rounded transition ${viewMode === 'analysis' ? (isDark ? 'bg-slate-700 text-blue-400' : 'bg-white shadow-sm text-blue-600') : styles.textSecondary + ' hover:' + styles.text}`}>Analysis</button>
          </div>
          
          {/* NEW: Object Switcher */}
          <div className={`flex rounded p-1 border ml-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setActiveObjId('A')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'A' ? 'bg-red-500 text-white shadow-sm' : styles.textSecondary}`}>
                  <Users size={14}/> Object A
              </button>
              <button onClick={() => setActiveObjId('B')} className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition ${activeObjId === 'B' ? 'bg-blue-500 text-white shadow-sm' : styles.textSecondary}`}>
                  <Users size={14}/> Object B
              </button>
          </div>

          {/* NEW: FILE CONTROLS */}
          <div className="flex items-center gap-2 border-l pl-4 ml-2 border-slate-600">
             <button onClick={saveProject} className={`p-2 rounded transition ${styles.buttonSecondary}`} title="Save Project to File">
                <Save size={18} />
             </button>
             <label className={`p-2 rounded cursor-pointer transition ${styles.buttonSecondary}`} title="Load Project from File">
                <FolderOpen size={18} />
                <input type="file" ref={fileInputRef} onChange={loadProject} accept=".json" className="hidden" />
             </label>
             <button onClick={clearProject} className={`p-2 rounded transition hover:text-red-400 ${styles.buttonSecondary}`} title="Reset / Clear Data">
                <RefreshCw size={18} />
             </button>
             {hasRestoredData && !videoSrc && (
                 <span className="text-xs text-orange-400 animate-pulse font-semibold ml-2 flex items-center gap-1">
                     <AlertCircle size={12} /> Waiting for Video
                 </span>
             )}
          </div>
        </div>
        
        <div className="flex gap-4">
          
          <button onClick={() => setShowAboutModal(true)} className={`p-2 rounded-full transition ${styles.buttonSecondary}`} title="About PhysTracker">
            <Info size={20} />
          </button>

          <button onClick={toggleTheme} className={`p-2 rounded-full transition ${styles.buttonSecondary}`} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {viewMode === 'tracker' && (
            <>
              <button onClick={() => { setIsTracking(!isTracking); setIsSettingOrigin(false); setIsCalibrating(false); }} className={`flex items-center gap-2 px-4 py-2 rounded transition ${isTracking ? 'bg-red-600 animate-pulse text-white' : styles.buttonSecondary}`}> <Target size={18} /> <span>{isTracking ? "Stop Tracking" : "Start Tracking"}</span> </button>
              <button onClick={() => { setIsSettingOrigin(true); setIsCalibrating(false); setIsTracking(false); setShowInputModal(false); }} className={`flex items-center gap-2 px-4 py-2 rounded transition ${isSettingOrigin ? 'bg-blue-600 text-white' : styles.buttonSecondary}`}> <Crosshair size={18} /> <span>{origin ? "Move Origin" : "Set Origin"}</span> </button>
              <button onClick={handleScaleButtonClick} className={`flex items-center gap-2 px-4 py-2 rounded transition ${isCalibrating ? 'bg-green-600 text-white' : pixelsPerMeter ? 'bg-green-100 text-green-700 border border-green-200' : styles.buttonSecondary}`}> {isCalibrating ? <CheckCircle2 size={18} /> : (pixelsPerMeter ? (isScaleVisible ? <Eye size={18} /> : <EyeOff size={18} />) : <Ruler size={18} />)} <span>{isCalibrating ? "Enter Distance" : pixelsPerMeter ? (isScaleVisible ? "Hide Scale" : "Show Scale") : "Set Scale"}</span> </button>
            </>
          )}
          <label className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer transition ${styles.buttonSecondary}`}> <Upload size={18} /> <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" /> </label>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* VIEW 1: TRACKER MODE */}
        {viewMode === 'tracker' && (
          <>
            <div className={`flex-1 flex flex-col min-w-0 ${styles.bg}`}>
              <div ref={scrollContainerRef} className={`flex-1 overflow-auto flex items-start justify-center p-4 relative ${styles.workspaceBg}`}>
                {/* REMOVED OLD SVG RETICLE */}
                {dragState === 'point' && ( <div className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: mousePos.x, top: mousePos.y }}> <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="13" cy="13" r="4" fill={activeObjectColor} stroke="white" strokeWidth="1.5" /> </svg> </div> )}
                {dragState === 'calibration' && ( <div className="fixed z-[100] w-12 h-12 rounded-full border-4 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: mousePos.x, top: mousePos.y }}> <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> </div> )}
                <div ref={trashRef} className={`absolute top-8 right-6 z-50 p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${dragState === 'point' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${isHoveringTrash ? 'bg-red-900/90 border-red-500 scale-110 text-white' : `${styles.panel} opacity-90`}`}> <Trash2 size={32} /> <span className="text-xs font-bold mt-2"> Drop to Delete </span> </div>
                {showInputModal && ( 
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border p-6 rounded-xl shadow-2xl z-50 w-80 text-center ${styles.panel}`}>
                    <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>Set Real Distance</h3>
                    <div className="flex items-center justify-center gap-2 mb-6"> <input type="number" value={realDistanceInput} onChange={(e) => setRealDistanceInput(e.target.value)} className={`rounded px-3 py-2 w-24 text-center focus:outline-none focus:border-blue-500 text-lg ${styles.input}`} autoFocus /> <span className={`font-semibold text-lg ${styles.textSecondary}`}>m</span> </div>
                    <div className="flex gap-3 justify-center"> <button onClick={cancelCalibration} className={`px-4 py-2 rounded transition ${styles.buttonSecondary}`}>Cancel</button> <button onClick={submitCalibration} className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-semibold transition">Save</button> </div> 
                  </div> 
                )}
                {videoSrc ? (
                  // CANVAS-FIRST RENDER: Video is HIDDEN (opacity 0), Canvas draws the frame
                  // Added flex-none to prevent aspect ratio distortion during zoom
                  <div className="relative shadow-2xl origin-top-left bg-black mt-10 flex-none" ref={containerRef} style={{ width: Math.floor(videoDims.w * zoom), height: Math.floor(videoDims.h * zoom) }}>
                    {/* MEMOIZED VIDEO ELEMENT WITH GPU LAYER FORCE */}
                    {videoElement}
                    <canvas ref={canvasRef} width={Math.floor(videoDims.w * zoom)} height={Math.floor(videoDims.h * zoom)} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10, touchAction: 'none' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onMouseEnter={() => setIsHoveringCanvas(true)} onMouseLeave={() => setIsHoveringCanvas(false)} className={`${dragState === 'origin' ? 'cursor-move' : dragState === 'rotate' ? 'cursor-grab' : dragState === 'point' || dragState === 'calibration' ? 'cursor-grabbing' : (isSettingOrigin) ? 'cursor-crosshair' : (isTracking && !dragState) ? 'cursor-default' : 'cursor-default'}`} />
                  </div>
                ) : ( <div className={`text-center mt-20 ${styles.textSecondary}`}> <Upload size={48} className="mx-auto mb-4 opacity-50" /> <p>Upload a video to begin analysis</p> </div> )}
              </div>
              <div className={`h-20 border-t flex items-center justify-center gap-8 px-6 shrink-0 z-30 ${styles.panel}`}>
                 <button onClick={undoLastPoint} disabled={points.length === 0} className={`p-3 rounded-full transition disabled:opacity-30 ${styles.buttonSecondary}`} title="Undo Last Point"> <Undo2 size={20} /> </button>
                 <div className={`flex items-center gap-4 px-6 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}> <button onClick={stepBackward} className={`p-2 rounded-full transition ${styles.buttonSecondary}`} title="Previous Frame"> <SkipBack size={20} /> </button> <button onClick={togglePlay} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition shadow-lg shadow-blue-900/20"> {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />} </button> <button onClick={stepForward} className={`p-2 rounded-full transition ${styles.buttonSecondary}`} title="Next Frame"> <SkipForward size={20} /> </button> </div>
                 <div className="flex-1 max-w-xl mx-4 flex items-center gap-3"> <span className={`text-xs font-mono w-12 text-right ${styles.textSecondary}`}>{formatTime(currentTime)}</span> <input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeek} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" /> <span className={`text-xs font-mono w-12 ${styles.textSecondary}`}>{formatTime(duration)}</span> </div>
                 <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}> <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className={`p-2 rounded-full ${styles.buttonSecondary}`} title="Zoom Out"> <ZoomOut size={18} /> </button> <span className={`text-sm font-mono w-12 text-center ${styles.textSecondary}`}>{Math.round(zoom * 100)}%</span> <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className={`p-2 rounded-full ${styles.buttonSecondary}`} title="Zoom In"> <ZoomIn size={18} /> </button> <div className={`w-px h-6 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div> <button onClick={() => setZoom(1)} className={`p-2 rounded-full ${styles.buttonSecondary}`} title="Reset View"> <Maximize size={18} /> </button> </div>
              </div>
            </div>

            <div className={`w-96 border-l flex flex-col transition-all z-20 shrink-0 ${styles.panel}`}>
              <div className={`p-4 border-b flex justify-between items-center ${styles.panelHeader} ${styles.panelBorder}`}> <h2 className={`text-sm font-semibold flex items-center gap-2 ${styles.text}`}><Table size={16} /> Data Table ({activeObjId})</h2> </div>
              <div className={`p-4 border-b flex flex-col gap-4 ${styles.panelBgOnly} ${styles.panelBorder}`}> 
                <div className="flex flex-col gap-1"> 
                  <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}> <span>Origin: {origin ? `(${Math.round(origin.x)}, ${Math.round(origin.y)})` : "Not Set"}</span> </div> 
                  <div className={`text-xs flex items-center gap-2 ${styles.textSecondary}`}> <span>Scale: {pixelsPerMeter ? `${Math.round(pixelsPerMeter)} px/m` : "Not Set"}</span> {pixelsPerMeter && ( <button onClick={resetScale} className="hover:text-red-400 transition" title="Reset Scale"> <RotateCcw size={12} /> </button> )} </div>
                  <button onClick={() => setZeroTime(!zeroTime)} className={`text-xs flex items-center gap-2 px-2 py-1 rounded border transition ${zeroTime ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' : styles.buttonSecondary}`} title={zeroTime ? "Time starts at 0s" : "Showing absolute video time"}> <Clock size={12} /> <span>{zeroTime ? "t=0 at Start" : "Video Time"}</span> </button>
                </div> 
                <div className={`border-t pt-3 ${styles.panelBorder}`}>
                  <div className={`flex items-center justify-between text-xs mb-1 ${styles.textSecondary}`}> <span className="flex items-center gap-1"><CircleDashed size={12}/> Blur Size / Uncertainty</span> <span>{uncertaintyPx}px</span> </div>
                  <input type="range" min="0" max="50" value={uncertaintyPx} onChange={(e) => setUncertaintyPx(Number(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
                {points.length > 0 && ( <button onClick={() => setPoints([])} className="text-red-400 hover:text-red-300 flex items-center justify-center gap-2 text-sm"> <Trash2 size={16} /> Clear Data </button> )} 
              </div>
              <div className={`flex-1 overflow-y-auto ${styles.bg}`}> 
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-sm text-left">
                        <thead className={`sticky top-0 shadow-md ${styles.tableHeader}`}>
                          <tr> <th className="p-3">#</th> <th className="p-3">Time</th> <th className="p-3"> X (m) {pixelsPerMeter && <span className="font-normal text-xs opacity-70">±{uncertaintyMeters.toFixed(3)}</span>} </th> <th className="p-3"> Y (m) {pixelsPerMeter && <span className="font-normal text-xs opacity-70">±{uncertaintyMeters.toFixed(3)}</span>} </th> </tr>
                        </thead>
                        <tbody className={`divide-y ${styles.tableDivider}`}>
                          {positionData.map((p, i) => (
                            <tr key={i} className={`transition ${styles.tableRow}`}> <td className={`p-3 ${styles.textSecondary}`}>{i + 1}</td> <td className="p-3 font-mono text-blue-500">{p.time.toFixed(3)}</td> <td className={`p-3 font-mono ${styles.tableCell}`}>{p.x.toFixed(3)}</td> <td className={`p-3 font-mono ${styles.tableCell}`}>{p.y.toFixed(3)}</td> </tr>
                          ))}
                          {points.length === 0 && ( <tr><td colSpan="4" className={`p-8 text-center ${styles.textSecondary}`}>No data points yet for Object {activeObjId}</td></tr> )}
                        </tbody>
                      </table>
                    </div>
                    {points.length > 0 && ( <div className={`p-4 border-t ${styles.panelBgOnly} ${styles.panelBorder}`}> <button onClick={downloadCSV} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition"> <Download size={18} /> Download CSV </button> </div> )}
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
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>Y-Axis</span>
                      <select value={plotY} onChange={(e) => setPlotY(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`}>
                        <option value="x">X Position (m)</option> <option value="y">Y Position (m)</option> <option value="vx">X Velocity (m/s)</option> <option value="vy">Y Velocity (m/s)</option> <option value="time">Time (s)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase font-bold tracking-wider ${styles.textSecondary}`}>X-Axis</span>
                      <select value={plotX} onChange={(e) => setPlotX(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 ${styles.input}`}>
                         <option value="time">Time (s)</option> <option value="x">X Position (m)</option> <option value="y">Y Position (m)</option> <option value="vx">X Velocity (m/s)</option> <option value="vy">Y Velocity (m/s)</option>
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
                          label={{ value: labels[plotX], position: 'bottom', offset: 20, fill: styles.chartAxis, fontSize: 18 }} 
                        /> 
                        <YAxis 
                          stroke={styles.chartAxis} 
                          fontSize={16} 
                          domain={[yScale.min, yScale.max]}
                          ticks={yScale.ticks}
                          label={{ value: labels[plotY], angle: -90, position: 'insideLeft', offset: -40, fill: styles.chartAxis, fontSize: 18 }} 
                        /> 
                        <Tooltip contentStyle={styles.chartTooltip} formatter={(val) => (typeof val === 'number') ? val.toFixed(3) : val} labelFormatter={(val) => `${labels[plotX]}: ${val}`} /> 
                        <Scatter name={`Data Points (${activeObjId})`} dataKey={plotY} fill={activeObjectColor} />
                        {fitEquation && <Line type="monotone" dataKey="fitY" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false} />}
                        {['x', 'y'].includes(plotY) && ( <Scatter dataKey={plotY} fill="none" stroke="none"> <ErrorBar dataKey="error" width={6} strokeWidth={2} stroke="#60a5fa" direction="y" /> </Scatter> )}
                      </ComposedChart> 
                   </ResponsiveContainer>
                   {points.length < 2 && ( <div className={`absolute inset-0 flex items-center justify-center italic ${styles.textSecondary}`}> Add points in Tracker mode to see data. </div> )}
                 </div>
              </div>
            </div>

            <div className={`w-80 border-l flex flex-col p-6 gap-6 shrink-0 ${styles.panel}`}>
               <div>
                 <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Calculator /> Curve Fitting ({activeObjId})</h3>
                 <div className="flex flex-col gap-2">
                    <label className={`text-sm ${styles.textSecondary}`}>Model Type</label>
                    <select value={fitModel} onChange={(e) => setFitModel(e.target.value)} className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${styles.input}`}>
                      <option value="none">None</option>
                      <option value="linear">Linear (mx + b)</option>
                      <option value="quadratic">Quadratic (Ax² + Bx + C)</option>
                    </select>
                 </div>
               </div>
               {fitEquation && (
                 <div className={`rounded-xl border p-4 animate-in fade-in slide-in-from-right-4 ${isDark ? 'bg-slate-900/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                   <div className={`font-mono font-bold text-sm mb-4 pb-2 border-b ${isDark ? 'text-orange-400 border-slate-700' : 'text-orange-600 border-slate-200'}`}> {fitEquation.text} </div>
                   <div className="space-y-3">
                      {fitEquation.type === 'Linear' ? (
                        <>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>Slope (m)</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.m.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>Intercept (b)</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.b.toFixed(4)}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>A term</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.A.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>B term</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.B.toFixed(4)}</span></div>
                          <div className="flex justify-between items-center"><span className={styles.textSecondary}>C term</span> <span className={`font-mono text-lg ${styles.text}`}>{fitEquation.params.C.toFixed(4)}</span></div>
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
                    <LayoutTemplate size={14} /> Legend Position (Export)
                  </label>
                  <select 
                    value={legendPosition} 
                    onChange={(e) => setLegendPosition(e.target.value)} 
                    className={`border rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-500 ${styles.input}`}
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="none">None (Hide)</option>
                  </select>

                  <button onClick={exportScientificGraph} className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded transition border bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm`}>
                    <Camera size={18} /> Export Graph (PNG)
                  </button>
                  <button onClick={downloadCSV} className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded transition border ${styles.buttonSecondary}`}>
                    <Download size={18} /> Export Data (CSV)
                  </button>
               </div>

               <div className={`mt-auto border p-4 rounded-lg text-xs ${isDark ? 'bg-blue-900/20 border-blue-900/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                 <p className="mb-2 font-bold flex items-center gap-2"><Info size={14}/> Analysis Tips:</p>
                 <ul className="list-disc pl-4 space-y-1 opacity-80">
                   <li>Select <strong>Quadratic</strong> for free-fall to find gravity.</li>
                   <li>Select <strong>Linear</strong> for constant velocity motion.</li>
                   <li>The <strong>A term</strong> in quadratic fit represents ½a.</li>
                 </ul>
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
                    A professional-grade, open-source video analysis tool designed for physics education.
                </p>
                
                <div className={`p-5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm items-center">
                        <span className="opacity-60 font-semibold">Version</span>
                        <span className="font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit dark:bg-blue-900/50 dark:text-blue-300">1.0.0</span>
                        
                        <span className="opacity-60 font-semibold">Author</span>
                        <span>Cesar Cortes</span>
                        
                        <span className="opacity-60 font-semibold">Engine</span>
                        <span className="flex items-center gap-1">Gemini Pro AI ✨</span>
                        
                        <span className="opacity-60 font-semibold">License</span>
                        <span>MIT Open Source</span>
                    </div>
                </div>

                <div className="text-xs opacity-50 text-center pt-4 border-t border-slate-700/30 leading-relaxed">
                    Copyright © 2026 Cesar Cortes. All rights reserved.<br/>
                    Licensed under the MIT License.
                </div>
            </div>
            </div>
        </div>
      )}

    </div>
  );
}
