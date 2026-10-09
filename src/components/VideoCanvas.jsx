import RangeControl from './RangeControl';
import {SPECTRUM_PLACEMENT_TEXT} from '../utils/spectrumWorkflow';
import {mediaFitZoom, nextMediaZoom} from '../utils/mediaFit';
import {dispersionAxis, referencePoints, anchorCalibration, sampleSpectrum, validCalibration} from '../utils/spectroscopy';
import {GUIDE_TEXT} from '../utils/guideText';
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { 
  getDistanceToSegment
} from '../utils/physicsMath';
import { 
  Undo2, SkipBack, Play, Pause, SkipForward, ZoomOut, ZoomIn, 
  Maximize, Trash2, CheckCircle2
} from 'lucide-react';

// --- SUB-COMPONENT: PURE VIDEO PLAYER ---
const PureVideoPlayer = React.memo(({ videoRef, src, onLoadedMetadata, onLoadedData, onEnded, onError, onTimeUpdate, onSeeked }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'translateZ(0)', willChange: 'transform' }}>
      <video 
        ref={videoRef} 
        key={src} 
        src={src} 
        className="block w-full h-full object-fill" 
        onLoadedMetadata={onLoadedMetadata} 
        onLoadedData={onLoadedData} 
        onEnded={onEnded} 
        onError={onError}
        onTimeUpdate={onTimeUpdate} 
        onSeeked={onSeeked}         
        playsInline 
      />
    </div>
  );
});

PureVideoPlayer.displayName = 'PureVideoPlayer';

export default function VideoCanvas({ points, videoRef, autotracking, pointReview }) {
  // Zustand Store Selectors
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const activeObjId = useStore((state) => state.activeObjId);
  const objects = useStore((state) => state.objects);
  const isTracking = useStore((state) => state.isTracking);
  const reticlePos = useStore((state) => state.reticlePos);
  const setReticlePos = useStore((state) => state.setReticlePos);
  const zoom = useStore((state) => state.zoom);
  const setZoom = useStore((state) => state.setZoom);
  const videoDims = useStore((state) => state.videoDims);
  const setVideoDims = useStore((state) => state.setVideoDims);
  const dragState = useStore((state) => state.dragState);
  const setDragState = useStore((state) => state.setDragState);
  const draggedPointIndex = useStore((state) => state.draggedPointIndex);
  const setDraggedPointIndex = useStore((state) => state.setDraggedPointIndex);
  const isHoveringTrash = useStore((state) => state.isHoveringTrash);
  const setIsHoveringTrash = useStore((state) => state.setIsHoveringTrash);
  const setIsHoveringCanvas = useStore((state) => state.setIsHoveringCanvas);
  const mousePos = useStore((state) => state.mousePos);
  const setMousePos = useStore((state) => state.setMousePos);
  const videoSrc = useStore((state) => state.videoSrc);
  const imageSrc = useStore((state) => state.imageSrc);
  const imageObj = useStore((state) => state.imageObj);
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const duration = useStore((state) => state.duration);
  const setDuration = useStore((state) => state.setDuration);
  const currentTime = useStore((state) => state.currentTime);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const setError = useStore((state) => state.setError);
  const protractor = useStore((state) => state.protractor);
  const setProtractor = useStore((state) => state.setProtractor);
  const tapeMeasure = useStore((state) => state.tapeMeasure);
  const setTapeMeasure = useStore((state) => state.setTapeMeasure);
  const showVelocityVectors = useStore((state) => state.showVelocityVectors);
  const showAccelerationVectors = useStore((state) => state.showAccelerationVectors);
  const vectorScale = useStore((state) => state.vectorScale);
  const lineProfile = useStore((state) => state.lineProfile);
  const setLineProfile = useStore((state) => state.setLineProfile);
  const wavelengthCalibration = useStore((state) => state.wavelengthCalibration);
  const setWavelengthCalibration = useStore((state) => state.setWavelengthCalibration);
  const activeClickTarget = useStore((state) => state.activeClickTarget);
  const setActiveClickTarget = useStore((state) => state.setActiveClickTarget);
  const showGuidelines = useStore((state) => state.showGuidelines);
  const setSpectralData = useStore((state) => state.setSpectralData);
  const pixelsPerMeter = useStore((state) => state.pixelsPerMeter);
  const setPixelsPerMeter = useStore((state) => state.setPixelsPerMeter);
  const isCalibrating = useStore((state) => state.isCalibrating);
  const setIsCalibrating = useStore((state) => state.setIsCalibrating);
  const calibrationPoints = useStore((state) => state.calibrationPoints);
  const setCalibrationPoints = useStore((state) => state.setCalibrationPoints);
  const showInputModal = useStore((state) => state.showInputModal);
  const setShowInputModal = useStore((state) => state.setShowInputModal);
  const realDistanceInput = useStore((state) => state.realDistanceInput);
  const setRealDistanceInput = useStore((state) => state.setRealDistanceInput);
  const isScaleVisible = useStore((state) => state.isScaleVisible);
  const setIsScaleVisible = useStore((state) => state.setIsScaleVisible);
  const origin = useStore((state) => state.origin);
  const setOrigin = useStore((state) => state.setOrigin);
  const originAngle = useStore((state) => state.originAngle);
  const setOriginAngle = useStore((state) => state.setOriginAngle);
  const isSettingOrigin = useStore((state) => state.isSettingOrigin);
  const setIsSettingOrigin = useStore((state) => state.setIsSettingOrigin);
  const currentFrameIndex = useStore((state) => state.currentFrameIndex);
  const setCurrentFrameIndex = useStore((state) => state.setCurrentFrameIndex);
  const fps = useStore((state) => state.fps);
  const hasRestoredData = useStore((state) => state.hasRestoredData);
  const setPoints = useStore((state) => state.setPoints);
  const uncertaintyPx = useStore((state) => state.uncertaintyPx);

  // Local DOM Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const trashRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoCallbackRef = useRef(null);

  // Interaction tracking refs
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lineProfileStartRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const currentTimeRef = useRef(0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const isDark = theme === 'dark';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const activeObjectColor = useMemo(() => {
    if (activeObjId === 'COM') return '#a855f7';
    return (objects || []).find((o) => o.id === activeObjId)?.color || '#ef4444';
  }, [objects, activeObjId]);

  const styles = {
    bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panel: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm',
    panelBgOnly: isDark ? 'bg-slate-800' : 'bg-white',
    panelBorder: isDark ? 'border-slate-700' : 'border-slate-200',
    input: isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    workspaceBg: isDark ? 'bg-black/50' : 'bg-slate-200',
  };

  // --- UNIFIED RENDER LOOP (CANVAS-FIRST APPROACH) ---
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || (!video && !imageObj && !hasRestoredData)) return;
    if (videoDims.w === 0 && !hasRestoredData) return;

    const ctx = canvas.getContext('2d');
    
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0); 
    ctx.clearRect(0, 0, videoDims.w, videoDims.h);

    // 1. DRAW VIDEO OR IMAGE FRAME
    if (imageObj) {
      ctx.drawImage(imageObj, 0, 0, videoDims.w, videoDims.h);
    } else if (video && video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, videoDims.w, videoDims.h);
    } else if (hasRestoredData) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, videoDims.w || 800, videoDims.h || 600);
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
      ctx.fillStyle = `${activeObjectColor}26`;
      ctx.fill();
      ctx.lineWidth = lw(1);
      ctx.strokeStyle = `${activeObjectColor}4D`;
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
      if (isDragging) return;
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = lw(2);
      ctx.strokeStyle = '#00ff00'; 
      ctx.arc(x, y, lw(20), 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x - lw(5), y); ctx.lineTo(x + lw(5), y);
      ctx.moveTo(x, y - lw(5)); ctx.lineTo(x, y + lw(5));
      ctx.stroke();
      
      ctx.restore();
    };
    
    const drawReticle = (x, y, isDragging) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, lw(30), 0, 2 * Math.PI);
      ctx.lineWidth = lw(2);
      ctx.strokeStyle = isDragging ? '#fbbf24' : '#4ade80';
      ctx.fillStyle = isDragging ? 'rgba(251, 191, 36, 0.1)' : 'rgba(74, 222, 128, 0.1)'; 
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x - lw(50), y); ctx.lineTo(x + lw(50), y);
      ctx.moveTo(x, y - lw(50)); ctx.lineTo(x, y + lw(50));
      ctx.lineWidth = lw(1.5);
      ctx.strokeStyle = isDragging ? '#fbbf24' : '#4ade80';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(x, y, lw(3), 0, 2 * Math.PI);
      ctx.fillStyle = isDragging ? '#fbbf24' : '#4ade80';
      ctx.fill();
      
      if (!isDragging) {
        ctx.fillStyle = '#4ade80';
        ctx.font = `bold ${lw(14)}px sans-serif`;
        ctx.fillText(t.tapToFire, x + lw(35), y - lw(35));
      }
      ctx.restore();
    };

    if (origin) {
      ctx.save(); 
      ctx.translate(origin.x, origin.y);
      ctx.rotate(originAngle);
      const length = Math.max(videoDims.w, videoDims.h) * 2;
      
      const axisColor = '#FF4444';
      const axisWidth = lw(2);

      ctx.beginPath();
      ctx.strokeStyle = axisColor; 
      ctx.lineWidth = axisWidth; 
      
      ctx.moveTo(-length, 0); ctx.lineTo(length, 0);
      ctx.moveTo(0, length); ctx.lineTo(0, -length);
      ctx.stroke();
      
      const arrowSize = lw(12);
      ctx.fillStyle = axisColor;
      
      ctx.beginPath();
      ctx.moveTo(length, 0);
      ctx.lineTo(length - arrowSize, -arrowSize/2);
      ctx.lineTo(length - arrowSize, arrowSize/2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -length);
      ctx.lineTo(-arrowSize/2, -length + arrowSize);
      ctx.lineTo(arrowSize/2, -length + arrowSize);
      ctx.fill();
      
      ctx.beginPath();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = lw(2);
      ctx.arc(0, 0, lw(10), 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.fillStyle = axisColor;
      ctx.arc(0, 0, lw(3), 0, 2 * Math.PI);
      ctx.fill();
      
      const handleDist = lw(100); 
      ctx.beginPath(); 
      ctx.arc(handleDist, 0, lw(6), 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 68, 68, 0.2)'; 
      ctx.strokeStyle = axisColor; 
      ctx.fill(); 
      ctx.stroke();
      
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

    points.forEach((point, index) => {
      const isDraggingThis = dragState === 'point' && draggedPointIndex === index;
      drawPointMarker(point.x, point.y, isDraggingThis, index + 1);
    });
    
    if (isTracking && reticlePos && activeObjId !== 'COM') {
      drawReticle(reticlePos.x, reticlePos.y, dragState === 'reticle' || dragState === 'reticle_move_jump');
    }

    // Tape Measure
    if (tapeMeasure) {
      ctx.save();
      const { p1, p2 } = tapeMeasure;

      ctx.beginPath();
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = lw(2.5);
      ctx.setLineDash([5, 5]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

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

    // Protractor
    if (protractor) {
      ctx.save();
      const { v, a, b } = protractor;

      ctx.beginPath();
      ctx.strokeStyle = '#c084fc';
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

      const dxA = a.x - v.x;
      const dyA = a.y - v.y;
      const dxB = b.x - v.x;
      const dyB = b.y - v.y;

      const angleA = Math.atan2(dyA, dxA);
      const angleB = Math.atan2(dyB, dxB);
      let diff = angleB - angleA;
      
      while (diff < 0) diff += 2 * Math.PI;
      const angleDeg = (diff * 180) / Math.PI;

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

    // Line Profile
    if (lineProfile) {
      ctx.save();
      const { p1, p2, spread } = lineProfile;

      if (spread > 1) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          const nx = -(dy / len) * (spread / 2);
          const ny = (dx / len) * (spread / 2);

          ctx.beginPath();
          ctx.moveTo(p1.x+nx,p1.y+ny);ctx.lineTo(p2.x+nx,p2.y+ny);
          ctx.lineTo(p2.x-nx,p2.y-ny);ctx.lineTo(p1.x-nx,p1.y-ny);ctx.closePath();
          ctx.fillStyle='rgba(163,230,53,0.16)';ctx.fill();
          ctx.beginPath();
          ctx.strokeStyle = isDark ? 'rgba(163, 230, 53, 0.25)' : 'rgba(132, 204, 22, 0.35)';
          ctx.lineWidth = lw(1);
          ctx.moveTo(p1.x + nx, p1.y + ny);
          ctx.lineTo(p2.x + nx, p2.y + ny);
          ctx.moveTo(p1.x - nx, p1.y - ny);
          ctx.lineTo(p2.x - nx, p2.y - ny);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(p1.x + nx, p1.y + ny);
          ctx.lineTo(p1.x - nx, p1.y - ny);
          ctx.moveTo(p2.x + nx, p2.y + ny);
          ctx.lineTo(p2.x - nx, p2.y - ny);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = lw(2);
      ctx.setLineDash([6, 4]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const drawHandle = (p, isDragging, label) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, lw(7), 0, 2 * Math.PI);
        ctx.fillStyle = isDragging ? '#a3e635' : '#84cc16';
        ctx.fill();
        ctx.lineWidth = lw(2);
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.fillStyle = '#84cc16';
        ctx.font = `bold ${lw(11)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, p.x, p.y - lw(12));
      };

      drawHandle(p1, dragState === 'line_p1', 'P1');
      drawHandle(p2, dragState === 'line_p2', 'P2');


      ctx.restore();
    }

    // Wavelength references are fixed image points, independent of the sampling line.
    const refs=referencePoints(wavelengthCalibration,lineProfile);
    ctx.save();
    refs.forEach((point,index)=>{
      if(!point)return;
      const color=index===0?'#22d3ee':'#f87171';
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=lw(2);
      if(showGuidelines) {
        const axis=dispersionAxis(wavelengthCalibration,lineProfile);
        const extent=Math.hypot(videoDims.w,videoDims.h);
        ctx.setLineDash([lw(4),lw(4)]);ctx.beginPath();
        ctx.moveTo(point.x-axis.y*extent,point.y+axis.x*extent);
        ctx.lineTo(point.x+axis.y*extent,point.y-axis.x*extent);ctx.stroke();ctx.setLineDash([]);
      }
      ctx.beginPath();ctx.arc(point.x,point.y,lw(6),0,2*Math.PI);ctx.stroke();
      ctx.font=`bold ${lw(12)}px sans-serif`;ctx.fillText(`R${index+1}`,point.x+lw(8),point.y-lw(8));
    });
    ctx.restore();

    // DRAW DYNAMIC KINEMATIC VECTORS

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

  }, [videoRef, points, videoDims, zoom, origin, originAngle, calibrationPoints, isCalibrating, isScaleVisible, dragState, draggedPointIndex, uncertaintyPx, reticlePos, isTracking, hasRestoredData, activeObjectColor, t, activeObjId, protractor, tapeMeasure, showVelocityVectors, showAccelerationVectors, vectorScale, pixelsPerMeter, lineProfile, imageObj, wavelengthCalibration, showGuidelines, isDark]);

  const sampleLineIntensity = useCallback(() => {
    const video = videoRef.current;
    if ((!video && !imageObj) || !lineProfile || videoDims.w === 0) {setSpectralData([]);return;}
    
    const canvas = document.createElement('canvas');
    canvas.width = videoDims.w;
    canvas.height = videoDims.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      if (imageObj) {
        ctx.drawImage(imageObj, 0, 0, videoDims.w, videoDims.h);
      } else if (video) {
        ctx.drawImage(video, 0, 0, videoDims.w, videoDims.h);
      }
    } catch {
      return; 
    }
    
    try {
      const imgData=ctx.getImageData(0,0,videoDims.w,videoDims.h);
      setSpectralData(sampleSpectrum(imgData,lineProfile));
      useStore.setState({spectralError:false});
    } catch {
      setSpectralData([]);
      useStore.setState({spectralError:true});
    }

  }, [videoRef, lineProfile, videoDims, imageObj, setSpectralData]);

  // Sync sampling on video updates or line profile changes
  useEffect(() => {
    sampleLineIntensity();
  }, [currentTime, lineProfile, sampleLineIntensity]);

  // Programmatic tool selection must stop the actual video as well as its UI state.
  useEffect(()=>{if(!isPlaying)videoRef.current?.pause();},[isPlaying,videoRef]);

  // --- TRIGGER RENDER LOOP (FRAME SYNC) ---
  useEffect(() => {
    const videoEl = videoRef.current;

    const performRender = () => {
      renderFrame();
    };

    const onVideoFrame = (now, metadata) => {
      if (videoEl && !videoEl.paused) {
        setCurrentTime(metadata.mediaTime);
        performRender();
        videoCallbackRef.current = videoEl.requestVideoFrameCallback(onVideoFrame);
      }
    };

    const loopFallback = () => {
      if (videoEl && !videoEl.paused) {
        setCurrentTime(videoEl.currentTime);
        performRender();
        animationFrameRef.current = requestAnimationFrame(loopFallback);
      }
    };

    if (isPlaying && videoEl) {
      if ('requestVideoFrameCallback' in videoEl) {
        videoCallbackRef.current = videoEl.requestVideoFrameCallback(onVideoFrame);
      } else {
        animationFrameRef.current = requestAnimationFrame(loopFallback);
      }
    } else {
      performRender();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoCallbackRef.current && videoEl && 'cancelVideoFrameCallback' in videoEl) {
        videoEl.cancelVideoFrameCallback(videoCallbackRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoCallbackRef.current && videoEl && 'cancelVideoFrameCallback' in videoEl) {
        videoEl.cancelVideoFrameCallback(videoCallbackRef.current);
      }
    };
  }, [videoRef, isPlaying, renderFrame, setCurrentTime]);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
    }
  }, [videoRef, videoSrc]);

  useEffect(() => {
    if (isTracking && !reticlePos && videoDims.w > 0) {
      setReticlePos({ x: videoDims.w / 2, y: videoDims.h / 2 });
    }
  }, [isTracking, videoDims, reticlePos, setReticlePos]);

  useEffect(() => {
    if (imageObj && videoDims.w > 0 && scrollContainerRef.current) {
      const w = videoDims.w;
      const h = videoDims.h;
      const fitScale=mediaFitZoom(w,h,scrollContainerRef.current.clientWidth,scrollContainerRef.current.clientHeight);
      if(fitScale!==null)setZoom(fitScale);
    }
  }, [imageObj, videoDims, setZoom]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // --- POINTER LOGIC (Replaces Mouse Logic) ---
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

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    if(pointReview.status==='correcting') {
      e.preventDefault();pointReview.place({x,y});return;
    }
    if(pointReview.selection) {pointReview.cancel();return;}
    if (activeClickTarget) {
      e.preventDefault();
      const store=useStore.getState();
      if(activeClickTarget==='r1' || activeClickTarget==='r2') {
        const index=activeClickTarget==='r1'?1:2;
        setWavelengthCalibration(prev=>({...anchorCalibration(prev,lineProfile),coordinateMode:'image',[`p${index}_point`]:{x,y}}));
        setActiveClickTarget(null);
      } else if(activeClickTarget==='spectrum_p1') {
        useStore.setState({spectralLineStart:{x,y},activeClickTarget:'spectrum_p2'});
      } else if(activeClickTarget==='spectrum_p2' && store.spectralLineStart) {
        if(Math.hypot(x-store.spectralLineStart.x,y-store.spectralLineStart.y)<1)return;
        const next={p1:store.spectralLineStart,p2:{x,y},spread:lineProfile?.spread || 5,channel:lineProfile?.channel || 'luma'};
        setLineProfile(next);
        store.setSpectralMode(validCalibration(store.wavelengthCalibration,next)?'wavelength':'pixels');
        useStore.setState({activeClickTarget:null,spectralLineStart:null,analysisChartMode:'spectroscopy'});
      }
      return;
    }
    if (autotracking.enabled) { e.preventDefault(); autotracking.select(x,y); return; }
    
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    const hitRadius = (isTouch ? 45 : 15) / zoom; 
    const reticleHitRadius = (isTouch ? 80 : 60) / zoom; 

    let isInteractiveTarget = false;
    let newDragState = null;

    const ui=useStore.getState();
    if(ui.sidebarTab==='tools' && ui.sidebarViews.tools==='spectroscopy' && ui.spectrumStep==='calibrate') {
      const refs=referencePoints(wavelengthCalibration,lineProfile);
      const hit=refs.findIndex(point=>point && Math.hypot(x-point.x,y-point.y)<hitRadius);
      if(hit>=0) {
        e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
        setDragState(`spectral_ref_${hit+1}`);useStore.getState().setIsPlaying(false);return;
      }
    }

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
          break;
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

    // 5. Origin Setting Mode
    if (isSettingOrigin) {
      isInteractiveTarget = true;
    }

    if (isInteractiveTarget) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      
      if (isSettingOrigin) {
        if (newDragState) {
          setIsSettingOrigin(false);
        } else {
          useStore.setState({axesConfirmed:true});
          setOrigin({ x, y });
          setOriginAngle(0); 
          setIsSettingOrigin(false); 
          setDragState(null); 
        }
      }
    } else {
      if (isTouch) {
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
    if (isTracking || dragState) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
    
    if (!dragState) return;

    if (dragState === 'pan') {
      if (scrollContainerRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
        scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
      }
      return;
    }
    
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (dragState === 'spectral_ref_1' || dragState === 'spectral_ref_2') {
      const index=dragState==='spectral_ref_1'?1:2;
      setWavelengthCalibration(prev=>({...anchorCalibration(prev,lineProfile),coordinateMode:'image',
        [`p${index}_point`]:{x:Math.max(0,Math.min(videoDims.w-1,x)),y:Math.max(0,Math.min(videoDims.h-1,y))}}));
    } else if (dragState === 'tape_p1') {
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
    } else if (dragState === 'line_body') {
      const dx = x - lineProfileStartRef.current.click.x;
      const dy = y - lineProfileStartRef.current.click.y;
      setLineProfile({
        ...lineProfile,
        p1: { x: lineProfileStartRef.current.p1.x + dx, y: lineProfileStartRef.current.p1.y + dy },
        p2: { x: lineProfileStartRef.current.p2.x + dx, y: lineProfileStartRef.current.p2.y + dy }
      });
    } else if (dragState === 'origin') {
      useStore.setState({axesConfirmed:true});
      setOrigin({ x, y });
    } else if (dragState === 'rotate' && origin) {
      const dx = x - origin.x;
      const dy = y - origin.y;
      useStore.setState({axesConfirmed:true});
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
      setReticlePos({ 
        x: x + dragOffsetRef.current.x, 
        y: y + dragOffsetRef.current.y 
      });
    } else if (dragState === 'reticle_move_jump') {
      setReticlePos({ x, y });
    }
  };

  const handlePointerUp = (e) => {
    if (dragState) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (dragState === 'reticle') {
      const dist = Math.sqrt(Math.pow(e.clientX - dragStartRef.current.x, 2) + Math.pow(e.clientY - dragStartRef.current.y, 2));
      
      if (dist < 10 && activeObjId !== 'COM') {
        const time = videoRef.current ? videoRef.current.currentTime : 0;
        setPoints([...points, { id: points.length, x: reticlePos.x, y: reticlePos.y, time }]);
        stepForward();
      }
    } else if (dragState === 'point') {
      if (isHoveringTrash && activeObjId !== 'COM') {
        const newPoints = points.filter((_, i) => i !== draggedPointIndex);
        setPoints(newPoints);
      }
      setIsHoveringTrash(false);
      setDraggedPointIndex(null);
    }
    
    setDragState(null);
  };

  // Timeline Event Handlers
  const submitCalibrationLocal = () => {
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

  const cancelCalibrationLocal = () => { 
    setCalibrationPoints([]); 
    setIsCalibrating(false); 
    setShowInputModal(false); 
  };

  const undoLastPoint = () => setPoints(prev => prev.slice(0, -1));

  const stepForward = useCallback(() => { 
    if (imageObj) return;
    if (videoRef.current) { 
      videoRef.current.pause(); 
      setIsPlaying(false); 
      
      const frameDuration = 1 / fps;
      const nextIndex = currentFrameIndex + 1;
      const targetTime = (nextIndex * frameDuration) + (frameDuration / 2); 
      
      if (targetTime <= videoRef.current.duration) {
        setCurrentFrameIndex(nextIndex);
        videoRef.current.currentTime = targetTime;
        setCurrentTime(targetTime);
      }
    } 
  }, [videoRef, fps, currentFrameIndex, imageObj, setIsPlaying, setCurrentFrameIndex, setCurrentTime]);

  const stepBackward = useCallback(() => { 
    if (imageObj) return;
    if (videoRef.current) { 
      videoRef.current.pause(); 
      setIsPlaying(false); 
      
      const frameDuration = 1 / fps;
      const prevIndex = Math.max(0, currentFrameIndex - 1);
      const targetTime = (prevIndex * frameDuration) + (frameDuration / 2); 
      
      setCurrentFrameIndex(prevIndex);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    } 
  }, [videoRef, fps, currentFrameIndex, imageObj, setIsPlaying, setCurrentFrameIndex, setCurrentTime]);

  const handleSeeked = useCallback(() => {
    if (imageObj) return;
    if (videoRef.current) {
      const t_val = videoRef.current.currentTime;
      setCurrentTime(t_val);
      renderFrame();
    }
  }, [videoRef, renderFrame, imageObj, setCurrentTime]);

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
    } catch { 
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
      setCurrentFrameIndex(Math.floor(time * fps + 0.001));
    }
  };

  const formatTime = (t_val) => {
    const m = Math.floor(t_val / 60);
    const s = Math.floor(t_val % 60);
    const ms = Math.floor((t_val % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleVideoLoaded = useCallback(() => { 
    if (videoRef.current && scrollContainerRef.current) {
      setDuration(videoRef.current.duration); 
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      if (w > 0 && h > 0) {
        setVideoDims({ w, h });
        const fitScale=mediaFitZoom(w,h,scrollContainerRef.current.clientWidth,scrollContainerRef.current.clientHeight);
        if(fitScale!==null)setZoom(fitScale);
        
        setTimeout(() => renderFrame(), 100);
      }
    } 
  }, [videoRef, renderFrame, setDuration, setVideoDims, setZoom]);

  const changeZoom = (direction) => {
    const viewport = scrollContainerRef.current;
    if (!viewport) return;
    const fit = mediaFitZoom(videoDims.w, videoDims.h, viewport.clientWidth, viewport.clientHeight);
    setZoom(current => nextMediaZoom(current, direction, fit));
    if (direction === 'fit' && fit !== null) {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    }
  };

  const handleVideoEnded = useCallback(() => setIsPlaying(false), [setIsPlaying]);
  const handleVideoError = useCallback(() => setError((GUIDE_TEXT[language] || GUIDE_TEXT.en).videoError), [setError, language]);
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const t_val = videoRef.current.currentTime;
      setCurrentTime(t_val);
      if (isPlaying) {
        setCurrentFrameIndex(Math.floor(t_val * fps + 0.001));
      }
    }
  }, [videoRef, fps, isPlaying, setCurrentTime, setCurrentFrameIndex]);

  const videoElement = useMemo(() => (
    <PureVideoPlayer 
      videoRef={videoRef} 
      src={videoSrc}
      onLoadedMetadata={handleVideoLoaded} 
      onLoadedData={handleLoadedData}
      onEnded={handleVideoEnded} 
      onError={handleVideoError}
      onTimeUpdate={handleTimeUpdate}
      onSeeked={handleSeeked} 
    />
  ), [videoRef, videoSrc, handleVideoLoaded, handleLoadedData, handleVideoEnded, handleVideoError, handleTimeUpdate, handleSeeked]);

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${styles.bg} relative`}>
      {(activeClickTarget==='r1' || activeClickTarget==='r2') && <div role="status" className="absolute top-2 left-2 right-2 z-40 pointer-events-none flex justify-center">
        <div className="rounded-xl border border-cyan-400/60 bg-slate-900/95 text-white px-4 py-2 text-sm shadow-lg flex flex-wrap items-center gap-2 pointer-events-auto">
          <span>{(SPECTRUM_PLACEMENT_TEXT[language] || SPECTRUM_PLACEMENT_TEXT.en).instruction.replace('{n}',activeClickTarget==='r1'?1:2).replace('{value}',wavelengthCalibration?.[activeClickTarget==='r1'?'p1_wl':'p2_wl'])}</span>
          <button type="button" className="min-h-11 underline px-2" onClick={()=>useStore.setState({activeClickTarget:null,spectralLineStart:null})}>{t.cancel}</button>
        </div>
      </div>}
      {/* MOVED TRASH ICON HERE - FIXED OVERLAY */}
      <div 
        ref={trashRef} 
        aria-hidden={dragState !== 'point'}
        className={`absolute top-8 right-6 z-50 p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${dragState === 'point' ? 'opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-4 pointer-events-none'} ${isHoveringTrash ? 'bg-red-900/90 border-red-500 scale-110 text-white' : styles.panel}`}
      > 
        <Trash2 size={32} /> 
        <span className="text-xs font-bold mt-2"> {t.dropToDelete} </span> 
      </div>
      
      {/* Heads-Up "Enter Distance" Button for Calibration */}
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

        
        {dragState === 'point' && ( 
          <div className="fixed z-[100] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: mousePos.x, top: mousePos.y }}> 
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"> 
              <circle cx="13" cy="13" r="4" fill={activeObjectColor} stroke="white" strokeWidth="1.5" /> 
            </svg> 
          </div> 
        )}
        {dragState === 'calibration' && ( 
          <div className="fixed z-[100] w-12 h-12 rounded-full border-4 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: mousePos.x, top: mousePos.y }}> 
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> 
          </div> 
        )}
        
        {showInputModal && ( 
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border p-6 rounded-xl shadow-2xl z-50 w-80 text-center ${styles.panel}`}>
            <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>{t.setRealDistance}</h3>
            <div className="flex items-center justify-center gap-2 mb-6"> 
              <input 
                type="number" 
                value={realDistanceInput} 
                onChange={(e) => setRealDistanceInput(e.target.value)} 
                className={`rounded px-3 py-2 w-24 text-center focus:outline-none focus:border-cyan-600 text-lg ${styles.input}`}
                autoFocus 
              /> 
              <span className={`font-semibold text-lg ${styles.textSecondary}`}>m</span> 
            </div>
            <div className="flex gap-3 justify-center"> 
              <button onClick={cancelCalibrationLocal} className={`px-4 py-2 rounded transition ${styles.buttonSecondary}`}>{t.cancel}</button> 
              <button onClick={submitCalibrationLocal} className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-semibold transition">{t.save}</button> 
            </div> 
          </div> 
        )}

        {(videoSrc || imageSrc) ? (
          <div 
            className="relative shadow-2xl origin-top-left bg-black mt-10 flex-none mx-auto" 
            ref={containerRef} 
            style={{ width: Math.floor(videoDims.w * zoom), height: Math.floor(videoDims.h * zoom) }}
          >
            {videoSrc && videoElement}
            {pointReview.selection && <div aria-hidden="true" className="absolute rounded-full border-2 border-yellow-400 pointer-events-none z-20"
              style={{left:pointReview.selection.point.x*zoom-12,top:pointReview.selection.point.y*zoom-12,width:24,height:24}} />}
            {autotracking.enabled && autotracking.target && autotracking.status!=='lost' && <div aria-hidden="true"
              className="absolute border border-dashed border-cyan-400 pointer-events-none z-20"
              style={{left:(autotracking.target.searchX-autotracking.target.radiusX)*zoom,
                top:(autotracking.target.searchY-autotracking.target.radiusY)*zoom,
                width:autotracking.target.radiusX*2*zoom,height:autotracking.target.radiusY*2*zoom}} />}

            {autotracking.enabled && autotracking.target && <div aria-hidden="true"
              className={`absolute rounded-full border-2 ${autotracking.status==='lost'?'border-red-400':'border-green-400'} pointer-events-none z-20`}
              style={{left:(autotracking.target.x-autotracking.target.width/2)*zoom,
                top:(autotracking.target.y-autotracking.target.height/2)*zoom,
                width:autotracking.target.width*zoom,height:autotracking.target.height*zoom}} />}

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
                touchAction: 'none'
              }} 
              onPointerDown={handlePointerDown} 
              onPointerMove={handlePointerMove} 
              onPointerUp={handlePointerUp} 
              onPointerCancel={handlePointerUp} 
              onMouseEnter={() => setIsHoveringCanvas(true)} 
              onMouseLeave={() => setIsHoveringCanvas(false)} 
              className={`${activeClickTarget || pointReview.status==='correcting' ? 'cursor-crosshair' : dragState === 'origin' ? 'cursor-move' : dragState === 'rotate' ? 'cursor-grab' : dragState === 'pan' ? 'cursor-grabbing' : dragState === 'point' || dragState === 'calibration' ? 'cursor-grabbing' : (isSettingOrigin) ? 'cursor-crosshair' : (isTracking && !dragState) ? 'cursor-default' : 'cursor-default'}`}
            />
          </div>
        ) : ( 
          <div className={`w-full text-center mt-20 ${styles.textSecondary}`}>{t.uploadPrompt}</div>
        )}
      </div>

      <div className={`video-transport min-h-20 border-t flex flex-wrap items-center justify-center gap-2 px-2 shrink-0 z-30 ${styles.panel}`}>
        <button 
          onClick={undoLastPoint} 
          disabled={points.length === 0 || activeObjId === 'COM'} 
          className={`p-3 rounded-full transition disabled:opacity-30 ${styles.buttonSecondary}`} 
          title={t.undoLast} aria-label={t.undoLast}
        > 
          <Undo2 size={20} /> 
        </button>
        {!imageSrc && <><div className={`flex items-center gap-4 px-6 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'} ${imageObj ? 'opacity-40 pointer-events-none' : ''}`}>
          <button onClick={() => {pointReview.cancel(); autotracking.navigate(); stepBackward();}} disabled={!!imageObj} className={`p-2 rounded-full transition active:scale-90 active:bg-cyan-600 active:text-white ${styles.buttonSecondary}`} title={t.prevFrame} aria-label={t.prevFrame}> <SkipBack size={20} /> </button>
          <button onClick={() => {pointReview.cancel(); autotracking.navigate(); togglePlay();}} disabled={!!imageObj} className="p-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-full transition shadow-lg shadow-cyan-900/20" title={t.playPause} aria-label={t.playPause}> {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />} </button>
          <button onClick={() => {pointReview.cancel(); autotracking.navigate(); stepForward();}} disabled={!!imageObj} className={`p-2 rounded-full transition active:scale-90 active:bg-cyan-600 active:text-white ${styles.buttonSecondary}`} title={t.nextFrame} aria-label={t.nextFrame}> <SkipForward size={20} /> </button>
        </div>
        <div className="flex-1 min-w-40 max-w-xl mx-2 flex items-center gap-2">
          <span className={`text-xs font-mono w-12 text-right ${styles.textSecondary}`}>{formatTime(currentTime)}</span> 
          <RangeControl
            aria-label={language==='es'?'Posición del video':'Video position'}
            min="0" 
            max={duration || 100} 
            step="0.01" 
            value={currentTime} 
            onChange={(e) => {pointReview.cancel(); autotracking.navigate(); handleSeek(e);}}
            disabled={!!imageObj} 
            className="flex-1 min-w-0"
          /> 
          <span className={`text-xs font-mono w-12 ${styles.textSecondary}`}>{formatTime(duration)}</span> 
        </div>
        </>}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}> 
          <button onClick={() => changeZoom('out')} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.zoomOut} aria-label={t.zoomOut}> <ZoomOut size={18} /> </button>
          <span className={`text-sm font-mono w-12 text-center ${styles.textSecondary}`}>{Math.round(zoom * 100)}%</span> 
          <button onClick={() => changeZoom('in')} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.zoomIn} aria-label={t.zoomIn}> <ZoomIn size={18} /> </button>
          <div className={`w-px h-6 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div> 
          <button onClick={() => changeZoom('fit')} className={`p-2 rounded-full ${styles.buttonSecondary}`} title={t.resetView} aria-label={t.resetView}> <Maximize size={18} /> </button>
        </div>
      </div>
    </div>
  );
}
