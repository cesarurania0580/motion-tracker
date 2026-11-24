import {emptyBudget,cleanBudget} from '../utils/measurementUncertainty.js';
import {initialSamplingLine} from '../utils/spectrumWorkflow.js';
import {anchorCalibration} from '../utils/spectroscopy.js';
import { create } from 'zustand';
import {scaleBarInView, currentMediaView} from '../utils/mediaView.js';
import {readStartup, readRecovery, writeAutosave, clearWork, hasWork} from '../utils/sessionPersistence.js';

const validDistance = value => Number.isFinite(value) && value > 0;

const createDefaultState = () => ({
    // UI/General Configuration
    language: 'en',
    theme: 'dark',
    viewMode: 'tracker',
    isMenuOpen: false,
    showAboutModal: false,
    logoError: false,
    hasRestoredData: false,
    saveStatus: 'idle',
    fpsConfirmed: false,
    axesConfirmed: false,
    spectrumInteractionVersion: 0,
    spectrumStep: 'calibrate',
    spectrumUsePixels: false,
    autoFineOpen: false,
    imageTask: null,
    sidebarTab: 'controls',
    sidebarViews: {controls:'root', tools:'root'},
    pointEditHistory: {},

    // Kinematics State
    objects: [
      { id: 'A', name: 'Object A', color: '#ef4444', points: [], mass: 1 },
      { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
    ],
    activeObjId: 'A',
    isCalibrating: false,
    calibrationPoints: [],
    pixelsPerMeter: null,
    scaleDistance: null,
    scaleEditBackup: null,
    showInputModal: false,
    realDistanceInput: "1.0",
    isScaleVisible: true,
    isSettingOrigin: false,
    origin: null,
    originAngle: 0,
    zeroTime: true,
    fitModel: 'none',
    legendPosition: 'top-left',
    uncertaintyPx: 5,
    measurementBudget: emptyBudget(),
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
    spectralError: false,
    spectralLineStart: null,
    activeReferenceOverlays: { h2: false, he: false, hg: false },
    activeClickTarget: null,
    showGuidelines: true,
    recoverySavedAt: null,
});

// Fields written by autosave. Navigation, pointer and status fields stay out.
const PERSISTED_KEYS = ['objects','activeObjId','calibrationPoints','pixelsPerMeter','scaleDistance','origin',
  'originAngle','zeroTime','fitModel','uncertaintyPx','measurementBudget','viewMode','language','fps','cropStart',
  'cropEnd','protractor','tapeMeasure','showVelocityVectors','showAccelerationVectors','vectorScale','lineProfile',
  'wavelengthCalibration','spectralMode','activeReferenceOverlays','showGuidelines'];
// Recovering work keeps the student's current language and the welcome navigation.
const RECOVERED_KEYS = [...PERSISTED_KEYS.filter(key => key !== 'viewMode' && key !== 'language'),
  'axesConfirmed','realDistanceInput','hasRestoredData'];

// Builds state from a saved autosave, tolerating older save shapes.
const applySaved = (base, data) => {
  const restored = { ...base };

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

  if (hasWork(data)) restored.hasRestoredData = true;

  // Restore other fields if present
  if (data.calibrationPoints) restored.calibrationPoints = data.calibrationPoints;
  if (data.pixelsPerMeter) restored.pixelsPerMeter = data.pixelsPerMeter;
  if (validDistance(data.scaleDistance)) {
    restored.scaleDistance = data.scaleDistance;
    restored.realDistanceInput = String(data.scaleDistance);
  }
  if (data.origin) {restored.origin = data.origin; restored.axesConfirmed = true;}
  if (data.originAngle) restored.originAngle = data.originAngle;
  if (data.zeroTime !== undefined) restored.zeroTime = data.zeroTime;
  if (data.fitModel) restored.fitModel = data.fitModel;
  if (Number.isFinite(data.uncertaintyPx) && data.uncertaintyPx>=0) restored.uncertaintyPx = data.uncertaintyPx;
  restored.measurementBudget = cleanBudget(data.measurementBudget);
  // Start each app load in Tracker behind the welcome dialog. Restore data,
  // but leave navigation to the welcome choices or the in-session tabs.
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
};

const getInitialState = () => {
  const defaultState = createDefaultState();
  try {
    const {data, prefs, recoverySavedAt} = readStartup();
    const base = {...defaultState, recoverySavedAt, ...(typeof prefs?.language === 'string' ? {language: prefs.language} : {})};
    return data ? applySaved(base, data) : base;
  } catch (e) {
    console.error("Failed to read saved session", e);
    return defaultState;
  }
};

const useStore = create((set, get) => ({
  ...getInitialState(),

  selectImageTask: (imageTask) => {
    if(![null,'spectrum','measure'].includes(imageTask))return;
    const state=get();
    set({imageTask,viewMode:'tracker',isPlaying:false,isTracking:false,
      isCalibrating:false,isSettingOrigin:false,activeClickTarget:null,spectralLineStart:null,
      sidebarTab:'tools',sidebarViews:{...state.sidebarViews,tools:imageTask==='spectrum'?'spectroscopy':imageTask==='measure'?'overlays':'root'}});
  },
  setSpectrumStep: (spectrumStep) => {
    if(!['sample','calibrate','explore'].includes(spectrumStep))return;
    const state=get();
    const line=spectrumStep==='sample' && !state.lineProfile && (state.imageObj || state.videoSrc)
      ? initialSamplingLine(state.videoDims) : null;
    set({spectrumStep,activeClickTarget:null,spectralLineStart:null,
      ...(spectrumStep==='sample'?{spectrumInteractionVersion:state.spectrumInteractionVersion+1,isPlaying:false,isTracking:false,isCalibrating:false,isSettingOrigin:false,showInputModal:false}:{}),
      ...(line?{lineProfile:line}:{}),
    });
  },
  // Session-only navigation: excluded from autosave and project serialization.
  navigateSidebar: (tab, view) => {
    const state=get();
    const allowed={controls:['root','automatic','measurement'],data:['root'],tools:['root','overlays','spectroscopy']};
    if(!allowed[tab] || (view!==undefined && !allowed[tab].includes(view)))return;
    const sidebarViews=view===undefined?state.sidebarViews:{...state.sidebarViews,[tab]:view};
    const leavingSpectrum=tab!=='tools' || sidebarViews.tools!=='spectroscopy';
    const cancelPlacement=leavingSpectrum && ['r1','r2','spectrum_p1','spectrum_p2'].includes(state.activeClickTarget);
    set({sidebarTab:tab,sidebarViews,...(cancelPlacement?{activeClickTarget:null,spectralLineStart:null}:{})});
  },

  // SETTERS & MUTATORS
  setLanguage: (languageInput) => {
    const nextLanguage = typeof languageInput === 'function'
      ? languageInput(get().language)
      : languageInput;
    set({ language: nextLanguage });
  },
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
    const pointEditHistory={...get().pointEditHistory};
    for(const obj of get().objects) {
      if(nextObjects.find(next=>next.id===obj.id)?.points!==obj.points)delete pointEditHistory[obj.id];
    }
    set({ objects: nextObjects, pointEditHistory });
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
  setScaleDistance: (scaleDistance) => set({ scaleDistance: validDistance(scaleDistance) ? scaleDistance : null }),

  // Opens calibration for a new scale, or for correcting the existing one.
  // An edit keeps the placed endpoints and the last distance, and Cancel restores them.
  startScaleEdit: () => {
    const state=get();
    if(!state.videoSrc && !state.imageSrc)return;
    const editing=Boolean(state.pixelsPerMeter) && state.calibrationPoints.length===2;
    set({
      isCalibrating:true, isSettingOrigin:false, isTracking:false, reticlePos:null,
      isScaleVisible:true, showInputModal:false, activeClickTarget:null,
      scaleEditBackup:editing?{calibrationPoints:state.calibrationPoints}:null,
      // A new bar appears inside the part of the media the student is looking at.
      calibrationPoints:editing?state.calibrationPoints:scaleBarInView(currentMediaView(),state.videoDims),
      ...(validDistance(state.scaleDistance)?{realDistanceInput:String(state.scaleDistance)}:{}),
    });
  },
  // Returns false when the distance or endpoints cannot define a scale.
  applyScale: (metersInput) => {
    const state=get(), meters=Number.parseFloat(metersInput);
    const [p1,p2]=state.calibrationPoints;
    if(!validDistance(meters) || !p1 || !p2)return false;
    const distPx=Math.hypot(p2.x-p1.x,p2.y-p1.y);
    if(!(distPx>0))return false;
    set({pixelsPerMeter:distPx/meters, scaleDistance:meters, realDistanceInput:String(meters),
      isCalibrating:false, showInputModal:false, isScaleVisible:true, scaleEditBackup:null});
    return true;
  },
  cancelScaleEdit: () => {
    const backup=get().scaleEditBackup;
    set({calibrationPoints:backup?backup.calibrationPoints:[], isCalibrating:false, showInputModal:false, scaleEditBackup:null});
  },
  resetScale: () => set({pixelsPerMeter:null, scaleDistance:null, calibrationPoints:[], isCalibrating:false,
    showInputModal:false, isScaleVisible:true, scaleEditBackup:null}),
  
  setIsSettingOrigin: (isSettingOrigin) => set({ isSettingOrigin }),
  setOrigin: (origin) => set({ origin }),
  setOriginAngle: (originAngle) => set({ originAngle }),
  
  setZeroTime: (zeroTime) => set({ zeroTime }),
  setFitModel: (fitModel) => set({ fitModel }),
  setLegendPosition: (legendPosition) => set({ legendPosition }),
  setUncertaintyPx: (uncertaintyPx) => set({ uncertaintyPx }),
  setFps: (fps) => set({ fps, fpsConfirmed: false }),
  setFpsConfirmed: (fpsConfirmed) => set({ fpsConfirmed }),
  
  setCropStart: (cropStart) => set({ cropStart }),
  setCropEnd: (cropEnd) => set({ cropEnd }),
  
  setCurrentFrameIndex: (currentFrameIndex) => set({ currentFrameIndex }),
  setIsTracking: (isTracking) => set({ isTracking }),
  setReticlePos: (reticlePos) => set({ reticlePos }),
  setZoom: (zoomInput) => {
    const nextZoom = typeof zoomInput === 'function'
      ? zoomInput(get().zoom)
      : zoomInput;
    set({ zoom: nextZoom });
  },
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
  setVideoSrc: (videoSrc) => set(state => ({
    videoSrc, fpsConfirmed: videoSrc === state.videoSrc ? state.fpsConfirmed : false,
    pointEditHistory: videoSrc===state.videoSrc?state.pointEditHistory:{},
    ...(videoSrc && videoSrc!==state.videoSrc ? {
      sidebarTab:'controls', sidebarViews:{...state.sidebarViews,controls:'measurement'},
      activeClickTarget:null, spectralLineStart:null,
    } : {}),
  })),
  setImageSrc: (imageSrc) => set(state=>({ imageSrc, pointEditHistory:imageSrc===state.imageSrc?state.pointEditHistory:{} })),
  setImageObj: (imageObj) => set({ imageObj }),
  
  setPlotX: (plotX) => set({ plotX }),
  setPlotY: (plotY) => set({ plotY }),
  
  setProtractor: (protractor) => set({ protractor }),
  setTapeMeasure: (tapeMeasure) => set({ tapeMeasure }),
  setShowVelocityVectors: (showVelocityVectors) => set({ showVelocityVectors }),
  setShowAccelerationVectors: (showAccelerationVectors) => set({ showAccelerationVectors }),
  setVectorScale: (vectorScale) => set({ vectorScale }),
  
  setLineProfile: (input) => set(state => ({ lineProfile: typeof input === 'function' ? input(state.lineProfile) : input, wavelengthCalibration: anchorCalibration(state.wavelengthCalibration,state.lineProfile) })),
  setWavelengthCalibration: (input) => set(state => ({ wavelengthCalibration: typeof input === 'function' ? input(state.wavelengthCalibration) : input })),
  setSpectralMode: (spectralMode) => set({ spectralMode }),
  setAnalysisChartMode: (analysisChartMode) => set({ analysisChartMode }),
  setSpectralData: (spectralData) => set({ spectralData }),
  setActiveReferenceOverlays: (activeReferenceOverlays) => set({activeReferenceOverlays}),
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
    set({ objects: nextObjects, pointEditHistory:{...get().pointEditHistory,[activeObjId]:[]} });
  },

  // A review operation must still target the exact point that was selected.
  editPoint: (objectId, index, expectedPoint, position) => {
    const state=get(), object=state.objects.find(obj=>obj.id===objectId);
    if(objectId==='COM' || state.activeObjId!==objectId || !object || !Number.isInteger(index) || index<0 || index>=object.points.length || object.points[index]!==expectedPoint)return false;
    if(position!==null && (!Number.isFinite(position.x) || !Number.isFinite(position.y)))return false;
    const before=object.points;
    const after=position===null?before.filter((_,i)=>i!==index):before.map((point,i)=>i===index?{...point,x:position.x,y:position.y}:point);
    const history=state.pointEditHistory[objectId] || [];
    set({objects:state.objects.map(obj=>obj===object?{...obj,points:after}:obj),
      pointEditHistory:{...state.pointEditHistory,[objectId]:[...history,{before,after}].slice(-50)}});
    return true;
  },
  undoPointEdit: () => {
    const state=get(), id=state.activeObjId, history=state.pointEditHistory[id] || [];
    const edit=history.at(-1), object=state.objects.find(obj=>obj.id===id);
    if(!edit || !object || object.points!==edit.after)return false;
    set({objects:state.objects.map(obj=>obj===object?{...obj,points:edit.before}:obj),
      pointEditHistory:{...state.pointEditHistory,[id]:history.slice(0,-1)}});
    return true;
  },

  setMeasurementBudget: value => set({measurementBudget:cleanBudget(value)}),

  // Opt-in restore of the previous session's work, offered by the welcome dialog.
  recoverPreviousWork: () => {
    let data=null;
    try {data=readRecovery();} catch (e) {console.error("Failed to read recovery copy", e);}
    if(!data){set({recoverySavedAt:null});return false;}
    const restored=applySaved(createDefaultState(),data);
    set({...Object.fromEntries(RECOVERED_KEYS.map(key=>[key,restored[key]])),hasRestoredData:true,recoverySavedAt:null});
    return true;
  },

  // Reset state to default
  resetProject: () => {
    if (typeof window !== 'undefined') {
      window.isResetting = true;
    }
    set({
      pointEditHistory: {},
      objects: [
        { id: 'A', name: 'Object A', color: '#ef4444', points: [], mass: 1 },
        { id: 'B', name: 'Object B', color: '#3b82f6', points: [], mass: 1 }
      ],
      activeObjId: 'A',
      uncertaintyPx: 5,
      measurementBudget: emptyBudget(),
      calibrationPoints: [],
      pixelsPerMeter: null,
      scaleDistance: null,
      scaleEditBackup: null,
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
      error: null,
      recoverySavedAt: null,
    });
    clearWork();
    // Later work in this session is autosaved again (Start new experiment does not reload).
    if (typeof window !== 'undefined') window.isResetting = false;
  }
}));

// Only persisted fields trigger a write: pointer movement and status updates do not.
let lastSavedFields;
useStore.subscribe((state) => {
  if (typeof window !== 'undefined' && window.isResetting) {
    return;
  }
  const stateToSave = Object.fromEntries(PERSISTED_KEYS.map(key => [key, state[key]]));

  const fields = Object.values(stateToSave);
  if (lastSavedFields && fields.every((value, index) => value === lastSavedFields[index])) return;
  // Set before publishing status to avoid a recursive subscription write.
  lastSavedFields = fields;
  try {
    writeAutosave(stateToSave);
    if (state.saveStatus !== 'saved') useStore.setState({ saveStatus: 'saved' });
  } catch (e) {
    console.error("Failed to write to autosave", e);
    if (state.saveStatus !== 'error') useStore.setState({ saveStatus: 'error' });
  }
});

export { useStore };
