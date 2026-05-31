import { create } from 'zustand';

// Attempt to restore saved state from localStorage
const getInitialState = () => {
  const defaultState = {
    // UI/General Configuration
    language: 'en',
    theme: 'dark',
    viewMode: 'tracker',
    isMenuOpen: false,
    showAboutModal: false,
    logoError: false,
    hasRestoredData: false,

    // Kinematics State
    objects: [
      { id: 'A', name: 'Object A', color: '#ef4444', points: [], mass: 1 },
      { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
    ],
    activeObjId: 'A',
    isCalibrating: false,
    calibrationPoints: [],
    pixelsPerMeter: null,
    showInputModal: false,
    realDistanceInput: "1.0",
    isScaleVisible: true,
    isSettingOrigin: false,
    origin: null,
    originAngle: 0,
    zeroTime: true,
    fitModel: 'none',
    legendPosition: 'top-left',
    uncertaintyPx: 10,
    fps: 30,
    cropStart: '',
    cropEnd: '',
    currentFrameIndex: 0,
    isTracking: false,
    reticlePos: null,
    zoom: 1.0,
    videoDims: { w: 0, h: 0 },
    dragState: null,
    draggedPointIndex: null,
    isHoveringTrash: false,
    isHoveringCanvas: false,
    mousePos: { x: 0, y: 0 },

    // Video/Timeline State
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    error: null,
    videoSrc: null,
    imageSrc: null,
    imageObj: null,

    // Graph State
    plotX: 'time',
    plotY: 'x',

    // Spectroscopy & Overlays State
    protractor: null,
    tapeMeasure: null,
    showVelocityVectors: false,
    showAccelerationVectors: false,
    vectorScale: 1.0,
    lineProfile: null,
    wavelengthCalibration: null,
    spectralMode: 'pixels',
    analysisChartMode: 'kinematics',
    spectralData: [],
    activeReferenceOverlays: { h2: false, he: false, hg: false },
    activeClickTarget: null,
    showGuidelines: true,
  };

  try {
    const savedData = localStorage.getItem('physTracker_autosave');
    if (savedData) {
      const data = JSON.parse(savedData);
      const restored = { ...defaultState };

      // Migrate / restore objects
      if (data.objects) {
        restored.objects = data.objects.map(o => ({
          ...o,
          mass: o.mass !== undefined ? o.mass : 1
        }));
        if (data.activeObjId) restored.activeObjId = data.activeObjId;
      } else if (data.points) {
        restored.objects = [
          { id: 'A', name: 'Object A', color: '#ef4444', points: data.points, mass: 1 },
          { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
        ];
      }

      // Check if we restored any tracking data to set hasRestoredData
      const hasPoints = (data.objects && data.objects.some(o => o.points.length > 0)) || (data.points && data.points.length > 0);
      if (hasPoints) {
        restored.hasRestoredData = true;
      }

      // Restore other fields if present
      if (data.calibrationPoints) restored.calibrationPoints = data.calibrationPoints;
      if (data.pixelsPerMeter) restored.pixelsPerMeter = data.pixelsPerMeter;
      if (data.origin) restored.origin = data.origin;
      if (data.originAngle) restored.originAngle = data.originAngle;
      if (data.zeroTime !== undefined) restored.zeroTime = data.zeroTime;
      if (data.fitModel) restored.fitModel = data.fitModel;
      if (data.uncertaintyPx) restored.uncertaintyPx = data.uncertaintyPx;
      if (data.viewMode) restored.viewMode = data.viewMode;
      if (data.language) restored.language = data.language;
      if (data.fps) restored.fps = data.fps;
      if (data.cropStart !== undefined) restored.cropStart = data.cropStart;
      if (data.cropEnd !== undefined) restored.cropEnd = data.cropEnd;
      if (data.protractor !== undefined) restored.protractor = data.protractor;
      if (data.tapeMeasure !== undefined) restored.tapeMeasure = data.tapeMeasure;
      if (data.showVelocityVectors !== undefined) restored.showVelocityVectors = data.showVelocityVectors;
      if (data.showAccelerationVectors !== undefined) restored.showAccelerationVectors = data.showAccelerationVectors;
      if (data.vectorScale !== undefined) restored.vectorScale = data.vectorScale;
      if (data.lineProfile !== undefined) restored.lineProfile = data.lineProfile;
      if (data.wavelengthCalibration !== undefined) restored.wavelengthCalibration = data.wavelengthCalibration;
      if (data.spectralMode !== undefined) restored.spectralMode = data.spectralMode;
      if (data.activeReferenceOverlays !== undefined) restored.activeReferenceOverlays = data.activeReferenceOverlays;
      if (data.showGuidelines !== undefined) restored.showGuidelines = data.showGuidelines;

      return restored;
    }
  } catch (e) {
    console.error("Failed to parse autosave data", e);
  }

  return defaultState;
};

const useStore = create((set, get) => ({
  ...getInitialState(),

  // SETTERS & MUTATORS
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setViewMode: (viewMode) => set({ viewMode }),
  setIsMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
  setShowAboutModal: (showAboutModal) => set({ showAboutModal }),
  setLogoError: (logoError) => set({ logoError }),
  setHasRestoredData: (hasRestoredData) => set({ hasRestoredData }),

  setObjects: (objectsInput) => {
    const nextObjects = typeof objectsInput === 'function'
      ? objectsInput(get().objects)
      : objectsInput;
    set({ objects: nextObjects });
  },
  
  setActiveObjId: (activeObjId) => set({ activeObjId }),
  
  setIsCalibrating: (isCalibrating) => set({ isCalibrating }),
  setCalibrationPoints: (calibrationPointsInput) => {
    const nextPoints = typeof calibrationPointsInput === 'function'
      ? calibrationPointsInput(get().calibrationPoints)
      : calibrationPointsInput;
    set({ calibrationPoints: nextPoints });
  },
  
  setPixelsPerMeter: (pixelsPerMeter) => set({ pixelsPerMeter }),
  setShowInputModal: (showInputModal) => set({ showInputModal }),
  setRealDistanceInput: (realDistanceInput) => set({ realDistanceInput }),
  setIsScaleVisible: (isScaleVisible) => set({ isScaleVisible }),
  
  setIsSettingOrigin: (isSettingOrigin) => set({ isSettingOrigin }),
  setOrigin: (origin) => set({ origin }),
  setOriginAngle: (originAngle) => set({ originAngle }),
  
  setZeroTime: (zeroTime) => set({ zeroTime }),
  setFitModel: (fitModel) => set({ fitModel }),
  setLegendPosition: (legendPosition) => set({ legendPosition }),
  setUncertaintyPx: (uncertaintyPx) => set({ uncertaintyPx }),
  setFps: (fps) => set({ fps }),
  
  setCropStart: (cropStart) => set({ cropStart }),
  setCropEnd: (cropEnd) => set({ cropEnd }),
  
  setCurrentFrameIndex: (currentFrameIndex) => set({ currentFrameIndex }),
  setIsTracking: (isTracking) => set({ isTracking }),
  setReticlePos: (reticlePos) => set({ reticlePos }),
  setZoom: (zoom) => set({ zoom }),
  setVideoDims: (videoDims) => set({ videoDims }),
  
  setDragState: (dragState) => set({ dragState }),
  setDraggedPointIndex: (draggedPointIndex) => set({ draggedPointIndex }),
  setIsHoveringTrash: (isHoveringTrash) => set({ isHoveringTrash }),
  setIsHoveringCanvas: (isHoveringCanvas) => set({ isHoveringCanvas }),
  setMousePos: (mousePos) => set({ mousePos }),
  
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setError: (error) => set({ error }),
  setVideoSrc: (videoSrc) => set({ videoSrc }),
  setImageSrc: (imageSrc) => set({ imageSrc }),
  setImageObj: (imageObj) => set({ imageObj }),
  
  setPlotX: (plotX) => set({ plotX }),
  setPlotY: (plotY) => set({ plotY }),
  
  setProtractor: (protractor) => set({ protractor }),
  setTapeMeasure: (tapeMeasure) => set({ tapeMeasure }),
  setShowVelocityVectors: (showVelocityVectors) => set({ showVelocityVectors }),
  setShowAccelerationVectors: (showAccelerationVectors) => set({ showAccelerationVectors }),
  setVectorScale: (vectorScale) => set({ vectorScale }),
  
  setLineProfile: (lineProfile) => set({ lineProfile }),
  setWavelengthCalibration: (wavelengthCalibration) => set({ wavelengthCalibration }),
  setSpectralMode: (spectralMode) => set({ spectralMode }),
  setAnalysisChartMode: (analysisChartMode) => set({ analysisChartMode }),
  setSpectralData: (spectralData) => set({ spectralData }),
  setActiveReferenceOverlays: (activeReferenceOverlays) => set({ activeReferenceOverlays }),
  setActiveClickTarget: (activeClickTarget) => set({ activeClickTarget }),
  setShowGuidelines: (showGuidelines) => set({ showGuidelines }),

  // Proxy actions to manipulate points state of the active object cleanly
  setPoints: (newPointsInput) => {
    const activeObjId = get().activeObjId;
    if (activeObjId === 'COM') return; // COM points are derived
    const objects = get().objects;
    const nextObjects = objects.map(obj => {
      if (obj.id !== activeObjId) return obj;
      const nextPoints = typeof newPointsInput === 'function'
        ? newPointsInput(obj.points)
        : newPointsInput;
      return { ...obj, points: nextPoints };
    });
    set({ objects: nextObjects });
  },

  // Reset state to default
  resetProject: () => {
    set({
      objects: [
        { id: 'A', name: 'Object A', color: '#ef4444', points: [], mass: 1 },
        { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
      ],
      activeObjId: 'A',
      calibrationPoints: [],
      pixelsPerMeter: null,
      origin: null,
      originAngle: 0,
      zeroTime: true,
      fitModel: 'none',
      cropStart: '',
      cropEnd: '',
      protractor: null,
      tapeMeasure: null,
      showVelocityVectors: false,
      showAccelerationVectors: false,
      vectorScale: 1.0,
      lineProfile: null,
      wavelengthCalibration: null,
      spectralMode: 'pixels',
      activeReferenceOverlays: { h2: false, he: false, hg: false },
      showGuidelines: true,
      hasRestoredData: false,
      currentFrameIndex: 0,
      currentTime: 0,
      isPlaying: false,
      videoSrc: null,
      imageSrc: null,
      imageObj: null,
      spectralData: [],
      error: null
    });
    localStorage.removeItem('physTracker_autosave');
  }
}));

// Setup auto-saving subscription
useStore.subscribe((state) => {
  const stateToSave = {
    objects: state.objects,
    activeObjId: state.activeObjId,
    calibrationPoints: state.calibrationPoints,
    pixelsPerMeter: state.pixelsPerMeter,
    origin: state.origin,
    originAngle: state.originAngle,
    zeroTime: state.zeroTime,
    fitModel: state.fitModel,
    uncertaintyPx: state.uncertaintyPx,
    viewMode: state.viewMode,
    language: state.language,
    fps: state.fps,
    cropStart: state.cropStart,
    cropEnd: state.cropEnd,
    protractor: state.protractor,
    tapeMeasure: state.tapeMeasure,
    showVelocityVectors: state.showVelocityVectors,
    showAccelerationVectors: state.showAccelerationVectors,
    vectorScale: state.vectorScale,
    lineProfile: state.lineProfile,
    wavelengthCalibration: state.wavelengthCalibration,
    spectralMode: state.spectralMode,
    activeReferenceOverlays: state.activeReferenceOverlays,
    showGuidelines: state.showGuidelines
  };
  try {
    localStorage.setItem('physTracker_autosave', JSON.stringify(stateToSave));
  } catch (e) {
    console.error("Failed to write to autosave", e);
  }
});

export { useStore };
