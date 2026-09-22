# Technical Specification: Core Kinematics Tracker & Calibration Scale

## 1. Overview & Purpose
The **Core Kinematics Tracker & Calibration Scale** represents the foundational engine of PhysTracker. It governs media uploading (video and static images), frame-accurate time synchronization, coordinate translation, spatial calibration (defining pixels-per-meter scale), coordinate axis rotation, and metadata export (CSV data downloads and high-resolution SVG-to-PNG graph exports).

---

## 2. User Experience & UI Elements

### Workspace Canvas Overlay Controls
* **Add Calibration Scale**: Places two green handles on the canvas. The user aligns them with a known distance (e.g. a meter stick) and inputs the physical length in meters to establish the scale factor.
* **Add Origin**: Places a blue cartesian axis origin marker. The user can drag the center to position the $(0,0)$ point, and drag the rotate handle (at the edge of the x-axis) to rotate the coordinate system.
* **Media Controller Panel**: Contains Play/Pause, Step Forward (next frame), Step Backward (previous frame) buttons, and a seeking slider. Disabled with a dimmed overlay in static image mode.

### Export Controls Panel
* **Export CSV**: Triggers a direct download of a comma-separated value spreadsheet containing tracked times, positions, and uncertainties.
* **Export PNG Graph**: Renders the active Recharts kinematics graph onto a high-quality SVG element and downloads it as a publication-ready raster PNG image.

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `setDistance`: `"Set Distance (m)" / "Establecer Distancia (m)"`
* `origin`: `"Origin" / "Origen"`
* `rotate`: `"Rotate" / "Rotar"`
* `exportCSV`: `"Export CSV" / "Exportar CSV"`
* `exportGraph`: `"Export Graph (PNG)" / "Exportar Gráfico (PNG)"`
* `time`: `"Time (s)" / "Tiempo (s)"`
* `xPos`: `"X Position (m)" / "Posición X (m)"`
* `yPos`: `"Y Position (m)" / "Posición Y (m)"`

---

## 4. Technical Architecture & Mathematics

### Time Step Synchronization
For video tracking, the time $t_i$ corresponding to frame index $i$ is calculated dynamically using the user-defined frame rate (FPS):
$$t_i = \frac{i}{\text{fps}}$$
For static images, playback is disabled and a constant dummy duration of $0.033\text{ s}$ is applied.

### Spatial Scale Calibration
When the user defines a known distance $D_{\text{phys}}$ (in meters) between two canvas markers $K_1(x_1, y_1)$ and $K_2(x_2, y_2)$:
1. The pixel distance $D_{\text{px}}$ is calculated:
   $$D_{\text{px}} = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
2. The calibration scale factor $S_{\text{px/m}}$ (pixels per meter) is computed:
   $$S_{\text{px/m}} = \frac{D_{\text{px}}}{D_{\text{phys}}}$$

### Coordinate Transform (Translation & Rotation)
Let a tracked point be recorded at canvas coordinates $P_{\text{canvas}}(x, y)$. If the custom origin is placed at $O(x_o, y_o)$ with a rotation angle $\theta$ (in radians):
1. **Translate**: Shift coordinates relative to the origin:
   $$\Delta x = x - x_o$$
   $$\Delta y = -(y - y_o) \quad \text{(inverting the vertical canvas axis where y goes down)}$$
2. **Rotate**: Apply a 2D rotational transform:
   $$x_{\text{calibrated}} = \frac{\Delta x \cdot \cos(\theta) - \Delta y \cdot \sin(\theta)}{S_{\text{px/m}}}$$
   $$y_{\text{calibrated}} = \frac{\Delta x \cdot \sin(\theta) + \Delta y \cdot \cos(\theta)}{S_{\text{px/m}}}$$

---

## 5. Metadata Export Pipelines

### CSV Generation
Generates a structured string separating raw position tracking data from derived central-difference velocity coordinates:
```javascript
const headers = ["Time (s)", "X (m)", "Y (m)", "Uncertainty (m)"];
const rows = positionData.map(row => `${row.time},${row.x},${row.y},${row.error}`);
```

### SVG-to-PNG Graph Export
1. Selects the Recharts container SVG element: `document.querySelector("#motion-chart .recharts-surface")`.
2. Clones the SVG element and injects a solid white background rect to prevent transparency issues.
3. Converts text, gridlines, and path styles into standard vector formats.
4. Serializes the SVG into a Data URL: `"data:image/svg+xml;utf8," + encodeURIComponent(svgString)`.
5. Loads the URL into an in-memory HTML5 Image element, draws it onto an offscreen canvas at high resolution, and triggers a download of a raster `.png` image.

## 6. Calibration regression acceptance

- CAL-01: App event handlers reference declared bindings. The no-undef regression
  check must run even while App's historical general lint-disable remains.
- CAL-02: With media loaded and no scale set, Set Scale displays a green bar with
  two draggable handles and Enter Distance. It must not throw a runtime error.
- CAL-03: Moving either handle updates the bar; saving a positive real distance
  establishes pixels per meter. Hide/Show Scale changes visibility without
  losing calibration. Activating calibration cancels automatic tracking.

Regression: missing `setIsSettingOrigin` binding aborted scale initialization
before endpoints were created. Present in the pre-integration local commit
98ed63e as well as the initial integration. Fix: restore the Zustand binding.
Validation evidence: `docs/testing/autotracking.md`, calibration follow-up section.

## 7. Guided preparation and accessible manipulation follow-up — 2026-09-20

- CAL-04: A new video remains in a preparation state until the user confirms FPS.
  Scale/origin can remain available for expert access, but the recommended next
  action and tracking controls must not imply readiness before confirmation.
- CAL-05: After FPS confirmation, allow an explicit calibrated-distance path or a
  continue-in-pixels path. Positioning axes is optional unless the experiment needs
  a custom origin/orientation. Readiness and unit labels must reflect the chosen path.
- CAL-06: Scale endpoints, origin and rotation handles are keyboard focusable or
  have equivalent labeled numeric coordinate controls. Arrow movement, direct entry
  and pointer dragging update the same native-media state and announce changes in
  EN/ES. Visible focus and non-color state cues are required.
- CAL-07: Video transport and tracking/object controls are absent or disabled with
  an explanation before video media exists. They remain absent for still images.

Validate a new video from upload through FPS confirmation, pixel-only/calibrated
branches, axes adjustment and first point using pointer, keyboard and touch. Preserve
coordinate transforms, stored project compatibility and all existing regression math.

## Video timing trial implementation

CAL-04 now uses a blocking confirmation dialog after video decode, with background
MediaInfo detection, editable CFR suggestion, manual fallback and explicit VFR
rejection. Saved FPS remains the default on restore; mismatch is explained and an
edit requires acknowledgment. Review frame rate in the sidebar reopens this dialog.
Points retain their original media timestamps; FPS controls frame stepping and
identification. No slow-motion rescaling or VFR timestamp engine is implemented.
See ADR 008 and the Phase 2 section of spec 10. CAL-05 remains pending.

Owner revision supersedes VFR rejection: variable-rate videos are accepted using
their average FPS. The dialog offers familiar presets and Other, with no decimal
entry required for common rates. Saved/detected precision is retained internally
when its matching preset is accepted. See spec 10's approachable FPS revision.

Owner acceptance: UI/UX Phase 2 is complete. CAL-05's additional explicit scale/pixel
choice and proposed axes progression are dropped. Preserve existing scale, axes
and tracking behavior; earlier CAL-05 pending status is superseded. Keyboard/numeric
manipulation remains future accessibility work.
