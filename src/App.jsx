import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Upload, Trash2, Play, Pause, AlertCircle, Ruler, Crosshair, Table, Activity, SkipBack, SkipForward, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Maximize, Undo2, CheckCircle2, Info, Download, TrendingUp, Clock, Target, CircleDashed, Calculator, Sun, Moon, Camera, LayoutTemplate } from 'lucide-react';
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

export default function MotionTracker() {
  // --- STATE MANAGEMENT ---
  const [points, setPoints] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  
  // THEME STATE
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';

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

  // Zoom & Dimensions
  const [zoom, setZoom] = useState(1.0);
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 }); 

  const [dragState, setDragState] = useState(null); 
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);
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

  // --- GRAPH STATE ---
  const [plotX, setPlotX] = useState('time');
  const [plotY, setPlotY] = useState('x');

  // --- 1. HANDLING VIDEO UPLOAD ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setPoints([]);
      setCalibrationPoints([]);
      setPixelsPerMeter(null);
      setOrigin(null);
      setOriginAngle(0);
      setIsPlaying(false);
      setError(null);
      setShowInputModal(false);
      setIsScaleVisible(true);
      setDragState(null);
      setZoom(1.0);
      setZeroTime(true); 
      setIsTracking(false);
      setVideoDims({ w: 0, h: 0 });
      setUncertaintyPx(10);
      setDuration(0);
      setCurrentTime(0);
      setFitModel('none');
      setViewMode('tracker');
    }
  };

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
    }
  }, [videoSrc]);

  // --- 2. UNIFIED RENDER LOOP (CANVAS-FIRST APPROACH) ---
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || videoDims.w === 0) return;

    const ctx = canvas.getContext('2d');
    
    // Clear and set transform
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0); 
    ctx.clearRect(0, 0, videoDims.w, videoDims.h);

    // 1. DRAW VIDEO FRAME
    // Only draw if we have valid dimensions
    if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, videoDims.w, videoDims.h);
    }

    const lw = (w) => w / zoom; 

    // 2. Draw UI Elements
    const drawPointMarker = (x, y, isDragging = false, label = null) => {
      if (isDragging) return; 
      ctx.save();
      
      ctx.beginPath();
      ctx.arc(x, y, uncertaintyPx, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'; 
      ctx.fill();
      ctx.lineWidth = lw(1);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, lw(5), 0, 2 * Math.PI); 
      ctx.fillStyle = '#ef4444'; 
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
      // Logic moved to "active interaction" section below to handle dynamic magnifier
      // This helper was for static visual representation of calibration points
      if (isDragging) return; 
      ctx.beginPath();
      ctx.lineWidth = lw(2);
      ctx.strokeStyle = '#00ff00'; 
      ctx.arc(x, y, lw(15), 0, 2 * Math.PI); 
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, lw(3), 0, 2 * Math.PI); 
      ctx.fillStyle = '#00ff00';
      ctx.fill();
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

    points.forEach((point, index) => {
      const isDraggingThis = dragState === 'point' && draggedPointIndex === index;
      drawPointMarker(point.x, point.y, isDraggingThis, index + 1);
    });

    // --- MAGNIFIER / LOUPE RENDERING ---
    // Show loupe when dragging a point or tracking new points
    if ((dragState === 'tracking_potential' || dragState === 'point') && mousePos) {
      const rect = canvas.getBoundingClientRect();
      const relX = mousePos.x - rect.left;
      const relY = mousePos.y - rect.top;
      
      // Calculate cursor position in video coordinates
      const videoX = relX / zoom;
      const videoY = relY / zoom;

      // Loupe Settings
      const magZoom = 2; // 2x Magnification
      const r = 60 / zoom; // Screen radius fixed visually
      const offset = 80 / zoom; // Offset above finger

      const loupeX = videoX;
      const loupeY = videoY - offset;

      ctx.save();
      
      // Draw Loupe Circle (Background & Clip)
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, r, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3 / zoom;
      ctx.stroke();
      ctx.clip(); // Clip contents to the circle

      // Draw Magnified Video
      // We want to show a smaller area (source) into the loupe (destination)
      // Destination size = 2 * r
      // Source size = Destination size / magnification
      const destSize = 2 * r;
      const srcSize = destSize / magZoom;
      
      const sX = videoX - srcSize / 2;
      const sY = videoY - srcSize / 2;
      const dX = loupeX - r;
      const dY = loupeY - r;

      if (video.readyState >= 2) {
          ctx.drawImage(video, sX, sY, srcSize, srcSize, dX, dY, destSize, destSize);
      }

      // Draw Crosshair inside Loupe
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 1 / zoom; // Thin line
      ctx.beginPath();
      // Vertical line
      ctx.moveTo(loupeX, dY); 
      ctx.lineTo(loupeX, dY + destSize);
      // Horizontal line
      ctx.moveTo(dX, loupeY); 
      ctx.lineTo(dX + destSize, loupeY);
      ctx.stroke();

      ctx.restore();
    }

  }, [points, videoDims, zoom, origin, originAngle, calibrationPoints, isCalibrating, isScaleVisible, dragState, draggedPointIndex, uncertaintyPx, mousePos]); // Added mousePos to dependency

  // --- 3. TRIGGER RENDER LOOP ---
  useEffect(() => {
    const loop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
        renderFrame(); // Draw new video frame
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      renderFrame();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, renderFrame]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]); 

  // --- 5. POINTER LOGIC (MOUSE + TOUCH) ---
  
  // Helper to extract coordinates from either mouse or touch events
  const getEventPoint = (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    } else if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

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
    
    const { clientX, clientY } = getEventPoint(e);
    const { x, y } = getCanvasCoords(clientX, clientY);
    const hitRadius = 15 / zoom; 

    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
      if (dist < hitRadius) {
        setDragState('point');
        setDraggedPointIndex(i);
        setMousePos({ x: clientX, y: clientY });
        return;
      }
    }

    if (isCalibrating || (isScaleVisible && calibrationPoints.length > 0)) {
      for (let i = 0; i < calibrationPoints.length; i++) {
        const p = calibrationPoints[i];
        const dist = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
        if (dist < hitRadius + 5/zoom) {
          setDragState('calibration');
          setDraggedPointIndex(i);
          setMousePos({ x: clientX, y: clientY });
          return;
        }
      }
    }

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

    if (!isCalibrating && isTracking) {
      setDragState('tracking_potential');
      setMousePos({ x: clientX, y: clientY }); // Ensure position is set immediately for loupe
    }
  };

  const handlePointerMove = (e) => {
    const { clientX, clientY } = getEventPoint(e);

    if (isTracking || dragState) {
        setMousePos({ x: clientX, y: clientY });
    }

    if (!dragState) return;

    const { x, y } = getCanvasCoords(clientX, clientY);

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
        const isOver = clientX >= trashRect.left && clientX <= trashRect.right &&
                       clientY >= trashRect.top && clientY <= trashRect.bottom;
        setIsHoveringTrash(isOver);
      }
    } else if (dragState === 'calibration' && draggedPointIndex !== null) {
      const updatedCalib = [...calibrationPoints];
      updatedCalib[draggedPointIndex] = { x, y };
      setCalibrationPoints(updatedCalib);
    }
  };

  const handlePointerUp = (e) => {
    const { clientX, clientY } = getEventPoint(e);

    if (dragState === 'tracking_potential') {
      const { x, y } = getCanvasCoords(clientX, clientY);
      const time = videoRef.current.currentTime;
      setPoints([...points, { id: Date.now(), x, y, time }]);
      stepForward();
    } else if (dragState === 'point') {
      if (isHoveringTrash) {
        const newPoints = points.filter((_, i) => i !== draggedPointIndex);
        setPoints(newPoints);
      }
      setIsHoveringTrash(false);
      setDraggedPointIndex(null);
    }
    setDragState(null);
  };

  // --- GLOBAL EVENT LISTENERS (Updated for Touch) ---
  useEffect(() => {
    const handleGlobalMove = (e) => handlePointerMove(e);
    const handleGlobalUp = (e) => handlePointerUp(e);
    
    if (dragState || isTracking) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
      // Passive false allows preventDefault if needed, but we handle that via CSS touch-action
      window.addEventListener('touchmove', handleGlobalMove, { passive: false }); 
      window.addEventListener('touchend', handleGlobalUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [dragState, isTracking, draggedPointIndex, points, calibrationPoints, origin, originAngle, zoom, videoDims]); 


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
    link.setAttribute("download", "motion_data.csv");
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
      s.setAttribute("fill", "blue"); 
      s.style.fill = "blue"; 
      s.setAttribute("stroke", "blue");
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
            ctx.fillStyle = "blue";
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
        downloadLink.download = "scientific_graph.png";
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
        </div>
        <div className="flex gap-4">
          
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
                {isHoveringCanvas && isTracking && !dragState && ( <div className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference" style={{ left: mousePos.x, top: mousePos.y }}> <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="2" /> <path d="M20 2 L20 12 M20 28 L20 38 M2 20 L12 20 M28 20 L38 20" stroke="white" strokeWidth="2" /> </svg> </div> )}
                {dragState === 'point' && ( <div className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: mousePos.x, top: mousePos.y }}> <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="13" cy="13" r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" /> </svg> </div> )}
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
                    <canvas ref={canvasRef} 
                        width={Math.floor(videoDims.w * zoom)} 
                        height={Math.floor(videoDims.h * zoom)} 
                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10, touchAction: 'none' }} // Added touchAction: 'none'
                        onMouseDown={handlePointerDown}
                        onTouchStart={handlePointerDown} 
                        onMouseMove={handlePointerMove} // These work for mouse, global listener handles dragging off-canvas
                        onMouseEnter={() => setIsHoveringCanvas(true)} 
                        onMouseLeave={() => setIsHoveringCanvas(false)} 
                        className={`${dragState === 'origin' ? 'cursor-move' : dragState === 'rotate' ? 'cursor-grab' : dragState === 'point' || dragState === 'calibration' ? 'cursor-grabbing' : (isSettingOrigin) ? 'cursor-crosshair' : (isTracking && !dragState) ? 'cursor-none' : 'cursor-default'}`} 
                    />
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
              <div className={`p-4 border-b flex justify-between items-center ${styles.panelHeader} ${styles.panelBorder}`}> <h2 className={`text-sm font-semibold flex items-center gap-2 ${styles.text}`}><Table size={16} /> Data Table</h2> </div>
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
                          {points.length === 0 && ( <tr><td colSpan="4" className={`p-8 text-center ${styles.textSecondary}`}>No data points yet</td></tr> )}
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
                        <Scatter name="Data Points" dataKey={plotY} fill="#3b82f6" />
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
                 <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Calculator /> Curve Fitting</h3>
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
    </div>
  );
}
