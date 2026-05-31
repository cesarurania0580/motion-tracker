# Architectural Specification: Monolithic Decomposition & Modularization

## 1. Overview & Purpose
This specification governs the safe, incremental decomposition of the **PhysTracker** single-file monolith (`src/App.jsx` at ~4,000 lines) into a highly structured, modular, and maintainable codebase. The target architecture utilizes a unified **Zustand** global state store to preserve ultra-responsive, zero-latency canvas and chart rendering performance while strictly separating UI views, math utilities, and translation dictionaries.

---

## 2. Directory Structure Map

```
physics-app/
├── specs/                   # Specifications (already populated)
├── src/
│   ├── store/
│   │   └── useStore.js      # Global state store (Zustand hooks & actions)
│   ├── utils/
│   │   ├── physicsMath.js   # Isolated kinematics & numerical solvers
│   │   └── translations.js  # Bilingual EN/ES translation dictionaries
│   ├── components/
│   │   ├── Header.jsx       # Workspace header, mode toggles, media inputs
│   │   ├── VideoCanvas.jsx  # Interactive canvas & pointer drag engines
│   │   ├── Sidebar.jsx      # Collapsible cards (Objects, Origin, Calibration)
│   │   └── AnalysisPanel.jsx# Charts, Curve Fits, and Reference Guides
│   ├── App.jsx              # App layout shell combining components
│   ├── main.jsx             # React entry point
│   └── index.css            # Global CSS styles
```

---

## 3. Incremental Decomposition Stages (Quality Gates)

To ensure that the application remains fully compilable and functional at every point during the migration, the refactoring is broken down into **five discrete, independent phases**. At the end of each phase, we must run `npm run lint` and `npm run build` as a strict Quality Gate before proceeding.

```
[ Phase 1: Utils ] ──> [ Phase 2: Zustand Store ] ──> [ Phase 3: Components Scaffold ] ──> [ Phase 4: App Integration ] ──> [ Phase 5: Verification ]
```

### Phase 1: Utilities Extraction
* **Goal**: Isolate pure javascript functions that do not depend on React state or components.
* **Target Files**:
  * Create `src/utils/translations.js` and move the `TRANSLATIONS` dictionary there.
  * Create `src/utils/physicsMath.js` and move `solveLinearSystem`, `calculateNiceScale`, `projectPointToSegmentT`, and `getDistanceToSegment` there.
* **Quality Gate**: Direct file check and local import validation.

### Phase 2: Scaffolding the Zustand Global Store
* **Goal**: Create `src/store/useStore.js` and declare the global state container.
* **Store Structure**:
  * **State variables**: `language`, `theme`, `objects`, `activeObjId`, `calibrationPoints`, `pixelsPerMeter`, `origin`, `originAngle`, `zeroTime`, `fitModel`, `lineProfile`, `wavelengthCalibration`, `activeClickTarget`, `activeReferenceOverlays`, etc.
  * **Setters & Actions**: `setLanguage`, `setTheme`, `setObjects`, `setActiveObjId`, `setCalibrationPoints`, `setPixelsPerMeter`, `setOrigin`, `setOriginAngle`, `setFitModel`, `setLineProfile`, `setWavelengthCalibration`, `setActiveClickTarget`, etc.
  * **Local Storage Integration**: Initialize state from `localStorage` autosaves and write a middleware hook to automatically sync store changes to `localStorage` just like the current autosave pipeline.
* **Quality Gate**: Compiles successfully with zero warnings.

### Phase 3: Component Separation (One-by-One Extraction)
* **Goal**: Package functional segments of `src/App.jsx` into separate React component files in `src/components/`, substituting local state hooks with Zustand selectors (`const language = useStore(state => state.language)`).
* **Execution Path**:
  * **Step A**: Extract `Header.jsx`
  * **Step B**: Extract `Sidebar.jsx` (and its sub-components: Objects Card, Origin Card, Calibration Card, Overlays Card, Spectroscopy Card)
  * **Step C**: Extract `AnalysisPanel.jsx` (Kinematics ComposedChart, Spectral Profile tab, and Emission Guides)
  * **Step D**: Extract `VideoCanvas.jsx` (Canvas rendering loop `renderFrame` and pointer events)
* **Quality Gate**: Each component compiles and exports cleanly with resolved import lines.

### Phase 4: Shell Integration in `src/App.jsx`
* **Goal**: Overwrite the monolithic `src/App.jsx` to import and mount the newly extracted components: `<Header />`, `<VideoCanvas />`, `<Sidebar />`, and `<AnalysisPanel />` within a clean layout grid.
* **Quality Gate**: Complete monolithic replacement.

### Phase 5: Verification & Walkthrough
* **Goal**: Execute the full manual verification checklist across both video kinematics tracking and optical wavelength snap spectroscopy to confirm 100% feature parity.

---

## 4. Draft of Zustand Store Signatures (`src/store/useStore.js`)

The Zustand store will be initialized and maintained using standard selector hooks:
```javascript
import { create } from 'zustand';

export const useStore = create((set) => ({
  // --- 1. CORE CONFIGURATION ---
  language: 'en',
  theme: 'dark',
  viewMode: 'tracker',
  
  // --- 2. KINEMATICS DATA ---
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
  uncertaintyPx: 10,
  fps: 30,
  
  // --- 3. SPECTROSCOPY DATA ---
  lineProfile: null,
  wavelengthCalibration: null,
  spectralMode: 'pixels',
  activeReferenceOverlays: { h2: false, he: false, hg: false },
  activeClickTarget: null,
  showGuidelines: true,
  
  // --- ACTIONS & MUTATORS ---
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (t) => set({ theme: t }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setObjects: (objs) => set({ objects: objs }),
  setActiveObjId: (id) => set({ activeObjId: id }),
  setCalibrationPoints: (pts) => set({ calibrationPoints: pts }),
  setPixelsPerMeter: (val) => set({ pixelsPerMeter: val }),
  setOrigin: (ori) => set({ origin: ori }),
  setOriginAngle: (angle) => set({ originAngle: angle }),
  setZeroTime: (val) => set({ zeroTime: val }),
  setFitModel: (model) => set({ fitModel: model }),
  setLineProfile: (profile) => set({ lineProfile: profile }),
  setWavelengthCalibration: (calib) => set({ wavelengthCalibration: calib }),
  setSpectralMode: (mode) => set({ spectralMode: mode }),
  setActiveReferenceOverlays: (overlays) => set({ activeReferenceOverlays: overlays }),
  setActiveClickTarget: (target) => set({ activeClickTarget: target }),
  setShowGuidelines: (val) => set({ showGuidelines: val })
}));
```

---

## 5. Acceptance & Compliance Criteria

* **Linter Hygiene**: `npm run lint` must return `0 errors` and `0 warnings` at every phase limit.
* **Bundle Cleanliness**: `npm run build` must generate fully optimized static bundles without compilation failures.
* **Autosave Parity**: Toggling states or marking points, closing the browser window, and reloading must seamlessly restore all tracking coordinates, calibration sticks, and guidelines.
