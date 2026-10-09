# Technical Specification: Autotracking & Template Matching Engine

## 1. Overview & Purpose
This module provides automated **Object Trajectory Autotracking** in video and static image analysis. By implementing a lightweight, client-side **Template Matching** algorithm combined with **Sub-Pixel Parabolic Refinement**, **Velocity-Based Search Bounding Box Prediction**, and **Dynamic Keyframe Template Evolution**, users can automatically track objects (e.g. balls, carts, pendulums) frame-by-frame with high-frequency responsiveness and sub-pixel precision directly in the browser with zero external dependencies.

---

## 2. User Experience & UI Elements

### Autotracking Sidebar Card
* **Enable Autotracking Toggle**: Activates autotracking mode. When active, manual clicks on the canvas initialize the tracking template instead of placing static points.
* **Tuning Settings Sliders**:
  * **Template Diameter**: Slider ($11\text{px}$ to $41\text{px}$, step $2\text{px}$, default $21\text{px}$) to control the target image signature size.
  * **Search Bounds Radius**: Slider ($20\text{px}$ to $80\text{px}$, step $5\text{px}$, default $40\text{px}$) to control the search window scan radius.
  * **Template Evolution Rate ($\alpha$)**: Slider ($0\%$ to $50\%$, step $5\%$, default $10\%$) to control how fast the template adapts to scaling/lighting changes.
  * **Confidence Cutoff Threshold**: Slider ($50\%$ to $98\%$, step $1\%$, default $85\%$) to control minimum match confidence required before pausing due to tracking loss.
* **Velocity-Based Prediction Checkbox**: Toggles dynamic search window displacement.
* **Current Template Preview Panel**: Displays the active evolving target patch. Includes a **Reset to Initial Keyframe** button.

### Canvas Overlay Graphics
* **Dashed Blue Search Window**: Drawn centered around the predicted object coordinates to show the active scan region.
* **Locked Green Bounding Box**: Drawn centered on the matched coordinates to show a successful tracking lock.
* **Red Bounding Box / Alert**: Displays when the matching confidence falls below the threshold, indicating "Object Lost" status.
* **Trajectory Trail**: Connecting dashed lines and dots showing the historical path of tracked frames.

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `autotracking`: `"Enable Autotracking" / "Habilitar Auto-seguimiento"`
* `templateSize`: `"Template Diameter" / "Diámetro de Plantilla"`
* `searchRadius`: `"Search Bounds Radius" / "Radio de Búsqueda"`
* `evolutionRate`: `"Evolution Rate" / "Tasa de Evolución"`
* `confidenceCutoff`: `"Confidence Cutoff" / "Límite de Confianza"`
* `motionPrediction`: `"Velocity Prediction" / "Predicción de Velocidad"`
* `objectLost`: `"Object Lost! Please re-key template." / "¡Objeto Perdido! Re-ajuste la plantilla."`
* `resetKeyframe`: `"Reset to Keyframe" / "Restablecer Plantilla"`

---

## 4. Technical Architecture & Mathematics

### A. Core Similarity Metric: RGB Square Deviation (RGBSqD)
To locate a template image patch $T$ of dimensions $W \times H$ inside a frame $F$ at a search offset $(x, y)$, we compute the Sum of Squared Differences (SSD) across all RGB channels:

$$SSD(x, y) = \sum_{dx=0}^{W-1} \sum_{dy=0}^{H-1} \left[ \left(R_F(x+dx, y+dy) - R_T(dx, dy)\right)^2 + \left(G_F(x+dx, y+dy) - G_T(dx, dy)\right)^2 + \left(B_F(x+dx, y+dy) - B_T(dx, dy)\right)^2 \right]$$

The raw coordinate offset $(x_{\text{min}}, y_{\text{min}})$ that minimizes $SSD(x, y)$ within the search window is chosen as the raw match.

### B. Sub-Pixel Peak Interpolation
To achieve sub-pixel resolution, we fit two independent 1D parabolas centered at the raw peak $(x_{\text{min}}, y_{\text{min}})$ using the adjacent cost scores:

$$x_{\text{refined}} = x_{\text{min}} - \frac{S_{\text{right}} - S_{\text{left}}}{2 \cdot (S_{\text{right}} - 2S_{\text{center}} + S_{\text{left}})} + \frac{W}{2}$$

$$y_{\text{refined}} = y_{\text{min}} - \frac{S_{\text{down}} - S_{\text{up}}}{2 \cdot (S_{\text{down}} - 2S_{\text{center}} + S_{\text{up}})} + \frac{H}{2}$$

where:
* $S_{\text{center}} = SSD(x_{\text{min}}, y_{\text{min}})$
* $S_{\text{left}} = SSD(x_{\text{min}}-1, y_{\text{min}})$ and $S_{\text{right}} = SSD(x_{\text{min}}+1, y_{\text{min}})$
* $S_{\text{up}} = SSD(x_{\text{min}}, y_{\text{min}}-1)$ and $S_{\text{down}} = SSD(x_{\text{min}}, y_{\text{min}}+1)$

### C. Search Bounds Center Displacement (Velocity-Based Prediction)
If prediction is active and preceding coordinates exist, the search bounds center $(CX_{\text{pred}}, CY_{\text{pred}})$ is shifted to accommodate high-speed motion:

$$\vec{v}_t = \frac{\vec{x}_t - \vec{x}_{t-1}}{\Delta t}$$

$$\vec{x}_{\text{pred}} = \vec{x}_t + \vec{v}_t \cdot \Delta t$$

### D. Dynamic Template Evolution
On each successful frame tracking step, the template pixels are blended with the matched frame patch at evolution rate $\alpha$:

$$T_{i} = (1 - \alpha) \cdot T_{i-1} + \alpha \cdot M_i$$

where $M_i$ is the newly matched pixel array at frame $i$.

---

## 5. UI Canvas Integration & Flow Orchestration

### Decoupled Frame Processing Loop
To prevent the tracker from creating a feedback loop by matching its own canvas overlays, rendering is strictly decoupled into two consecutive phases:

1. **Clean Render Phase (`drawCleanFrame`)**: Draw only the clean media frame (video or static image) at its correct centered aspect ratio using letterboxing/pillarboxing coordinates.
2. **Pixel Capturing & Evaluation**:
   ```javascript
   // 1. Draw clean image frame
   drawCleanFrame();
   // 2. Extract clean pixels (no overlays)
   const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
   // 3. Evaluate template matching in search window
   const result = matchTemplate(frameData, activeTemplate, searchBox, size, size);
   ```
3. **Overlay Graphics Phase (`drawSimulatedFrame`)**: Draw the tracked coordinates, trails, and active bounding box borders on top of the clean frame to present visual feedback to the user.

### Stepping Loop Sequence
* **Real-time Play Loop**: Advances the video by `1 / fps` asynchronously, waits for the HTML5 video `seeked` event, executes the clean frame capture, runs the matching loop, updates the coordinates, redraws the overlays, and loops until video ends or matching confidence falls below the threshold.
* **Manual Frame Step**: Sets the `isSteppingTrack` flag and advances the video currentTime by `1 / fps`, triggering the same async matching evaluation once.

---

## 6. Local integration increment (supersedes broad draft scope above)

Status: local integration implemented; automated and browser smoke checks passed.
Owner acceptance and broader regression validation pending; not released.
Owner: Cesar. The owner approved local integration and spec-driven organization.

### Acceptance requirements
- AT-01: development-only opt-in controls; production builds omit the feature.
- AT-02: select A or B, pause video, click a target to capture clean pixels and
  record one seed point. COM and static images cannot start automatic tracking.
- AT-03: Step tracks once after decoding the next configured-FPS frame; Run repeats;
  Pause cancels pending work. Only one seek can be in flight.
- AT-04: rejected matches append no point and do not evolve the template. Lost state
  requires selecting a target again. Retain accepted points.
- AT-05: output uses original media pixels and frame timestamps; zoom must not alter
  measurements. Re-tracking a frame replaces that object's same-frame point.
- AT-06: media/object/FPS/view changes, scrubbing, manual tracking or calibration
  cancel work; stale callbacks cannot write points to another object or project.
- AT-07: existing graphs, CSV, JSON, autosave and COM consume automatic points with
  the existing schema; no media/template data added to persistent state.
- AT-08: English and Spanish labels, instructions, status and controls; adjustable
  template diameter, search radius, evolution, cutoff and motion prediction, with
  template preview. Defaults match the standalone prototype.
- AT-09: retain existing manual workflows with automatic mode off. No deployment
  occurs in this increment. Recovery instructions and a verified backup exist.

### Scope boundaries
Video only, one object per run. The prototype remains available separately.
Static-image autotracking, simultaneous A/B runs, workers, adaptive FPS detection,
and automatic production release are deferred. The original spec's speed and
precision claims are goals, not established measurements.

### State and interaction
Off → Select target → Ready → Running → Ready/Paused, Lost, Ended or Error.
Changing template size or scrubbing requires selecting again. Pausing an in-flight
seek invalidates the target to prevent resuming from an unmeasured frame.
Calibration and manual tools take priority and turn automatic mode off.
Use the panel's Step/Run controls for automatic measurement; normal transport is
navigation and invalidates the automatic target.

### Verification
Evidence, manual scenarios and unchecked release gates live in
`docs/testing/autotracking.md`. Numerical regressions live in `tests/`.


### Open owner feedback — next session

AT-BUG-001: The integrated tracker stops around the third frame on the test video,
then tracks well after a second click. The standalone prototype does not show this
initial interruption. Investigation is explicitly deferred until the next session.
See `docs/testing/autotracking.md` for observations, unknowns and reproduction plan.
Do not treat the earlier smoke checks as proof of prototype/integration parity.

## 7. Tracking mode UI revision — local evaluation

Owner approved replacing the separate automatic toggle with the existing toolbar
tracking icon opening Manual tracking / Automatic tracking choices. Keep the
trigger icon-only; provide a translated tooltip and accessible name indicating
mode. User performs browser tests; implementation validation is code-only here.

- AT-UI-01: local toolbar icon opens two labeled mode choices; show selected mode.
  Support keyboard focus, arrow navigation, Escape, outside-click dismissal.
- AT-UI-02: Manual activates existing manual tracking and cancels automatic work.
  Automatic prepares target selection, never starts recording merely by choosing
  the mode. Selecting the already-active mode does not reset its target.
- AT-UI-03: provide Stop tracking in the menu when a mode is active, so either mode
  can be exited without changing another tool. COM disables the trigger; automatic
  choice requires video and is unavailable for static images.
- AT-UI-04: automatic controls appear in the right sidebar below FPS/Mass, with
  status, Step, Run/Pause, expandable sliders and template preview. Remove the
  standalone toggle and experiment strip above the video. Keep controls visible
  and the data table accessible in the existing scroll layout.
- AT-UI-05: retain development-only gating and existing measurement/cancellation
  behavior. No algorithm, target-preview-before-selection or deployment changes.

Implementation: share one video ref and one autotracking hook in App, passing the
same controller to Header, Sidebar and VideoCanvas. UI components must not create
separate tracking sessions. User browser acceptance is pending.

## 8. Live tracking adjustments and sidebar organization

Owner approved implementation; browser acceptance is owner-run.
- AT-UI-06: heading above controls is Analysis Settings (active object); Data Table
  heading belongs directly above measurements. Overlay Tools and Spectroscopy
  are independent disclosures, initially collapsed unless their tools are active.
  Collapsing controls never disables tools. Show active-tool counts in summaries.
- AT-UI-07: while Ready/paused, template diameter recaptures clean pixels at the
  selected location on the current settled frame and resizes the template box.
  Radius/prediction update the search box without discarding the template.
  Cutoff/evolution preserve the selection. Adjustments never write measurements.
- AT-UI-08: Pause completes the currently decoding frame (including its valid
  measurement) then stops with the selection retained. No further seek starts.
  Settings stay disabled until this frame settles; target loss still requires
  re-selection. Mode switches/navigation still abort immediately.
- AT-UI-09: Reselect object clears the target only, retaining settings and data.
  Restore defaults resets the sliders and refreshes a valid selected target;
  neither action deletes or rewrites measurements. If a resized patch is invalid
  (edge/low texture), remain in automatic mode and require a new selection.

This supersedes section 6's rule requiring re-selection after every setting
change/pause. Pre-selection pointer-following boxes remain outside this increment.


## 9. General settings and shared data clearing

Owner approved this refinement, superseding the expandable sliders in AT-UI-04.
- AT-UI-10: Blur Size / Uncertainty appears directly below Mass (below FPS for
  COM), before automatic tracking controls.
- AT-UI-11: automatic sliders and target preview are directly visible when that
  mode is selected, with no disclosure required. Running/pausing disables edits.
- AT-UI-12: one shared Clear A data / Clear B data button sits at the right of the
  Data Table heading, available in both tracking modes, disabled for empty data,
  and hidden for COM. Clear only the active object's measurements. Abort pending
  automatic work and clear its target before clearing points, preserving tracking
  options and remaining in automatic selection mode. Never append a stale result.

Owner browser acceptance: verify control order, immediate slider visibility,
clear during an automatic seek, empty-table state, A/B isolation, and COM hiding
in EN/ES. Code checks do not establish browser acceptance.

## 10. Detailed local matching and rocket benchmark

Objective: match or exceed Tracker's useful tracking continuity and accuracy;
continuity alone is not evidence of correct measurements. No production release.

- AT-DT-01: capture template/search patches from native decoded pixels, preserving
  original-media coordinates and zoom independence. Avoid a full-resolution
  full-frame exhaustive search; crop clean pixels around the selected/predicted
  region. Sliders now specify original-video pixels, with clear EN/ES labels.
- AT-DT-02: rank candidates by normalized luminance structure with color checking;
  reject flat/weak and separated ambiguous matches. Preserve last accepted session
  on rejection and never append predicted points as if measured.
- AT-DT-03: evolve only accepted matches and softly tether to the original patch,
  replacing the immutable-keyframe hard rejection rule. Keep explicit reasons and
  confidence for losses. Prediction positions the search only, not measurements.
- AT-DT-04: replay spaceX.mp4 (1080×1920, 30 fps) from a documented black-band seed
  through clouds and frame exit. Compare baseline interruptions, annotated sample
  errors, run latency and false matches. Also retain disappearing-target tests and
  replay the falling-ball video. Tracker-relative accuracy remains owner acceptance
  until the corresponding Tracker coordinates/keyframe are available.

Baseline reproduced before changes: seed at frame 360 (12 s), native position
(545.5,1381.5), old 11-analysis-pixel patch, default remaining options. Stop at frame
470 (15.6667 s), RGB score 99.895, adaptive correlation .9035, original correlation
.6442 (below .65). Offline FFmpeg scaling differs from browser resampling.


### Detailed-engine defaults and implementation

This section supersedes downsampling/SSD defaults in earlier historical sections.
Default diameter 21 native pixels (11–61); search radius 40 (10–100); evolution
20%; original-template tether 5% (0–25%); minimum normalized-structure match 75%
(50–98%). The new percentage is correlation ×100, not the former RGB score and
not a probability. These two scales are not interchangeable.

The mask is circular, with its diameter shown on the video and in the preview.
Each candidate uses normalized luminance correlation, contrast ratio .25–4 and
RGB similarity >=50. The best must exceed the user cutoff and beat a separated
runner-up by at least 3 percentage points. Separation is at least max(3,size/2)
pixels. Compare all candidates for small searches; above 8 million estimated
pixel comparisons, sample a coarse grid then refine eight separated basins at
native-pixel spacing. Include search boundaries. Subpixel offsets are limited
to ±0.5 pixels around an interior maximum. Preserve rejected-session immutability.

Update the original native-size template with accepted pixels only, using the
configured evolution followed by soft tethering. No hard original-correlation
cutoff remains. New loss messages distinguish weak, ambiguous and outside-region
results; they do not imply that a low score is proof of physical disappearance.

Direct template width/height controls, acceleration prediction, multiple
keyframes, retrying a failed frame, and display-canvas high-DPI changes are not
included in this increment. The implementation remains development-only.


## 11. Production release preparation

Owner reports successful browser tracking on free fall, simple harmonic motion,
collisions and other videos, and requests commit/deployment preparation. The
production project is Netlify phystracker, ID
693b704b-36e3-447b-a640-36ec78a24923, custom domain phystracker.org.

AT-REL-01: remove development-only controls and hook gating so the production
bundle contains the same tracking engine/menu/settings accepted locally. Preserve
manual mode. Existing historical development-only requirements are superseded.
AT-REL-02: keep scratch files, videos, build outputs and backups out of the release
commit. Include existing tested component refactor, calibration/reset fixes,
curve-fitting correction, specs, tests and benchmark evidence.
AT-REL-03: verify current remote branch and Netlify published commit/build settings,
retain rollback reference, run test/lint/build, then review a production preview
before publishing. No live deployment is implied by local build success.

## Local-network HTTP compatibility — 2026-10-08

Automatic point recording must work when crypto.randomUUID is unavailable on a
plain HTTP LAN origin. Preserve point-ID uniqueness and format compatibility using
getRandomValues as a fallback; IDs are identifiers, not authentication secrets.
Keep capture, template matching, settings, coordinate units and frame stepping
unchanged. Regression must exercise the actual recording handler without randomUUID.
Owner LAN browser validation remains required.
