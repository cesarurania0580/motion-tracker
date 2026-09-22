# Functional Specification: Spectroscopy & Line Profile Analysis Tool

> Current UI (2026-09-19): calibration first, explicit wavelength-specific image
> placement, draggable references, then automatic sampling-line placement with direct
> manipulation and visible width, then exploration. No draw/replace/remove/Next controls.
> Channel selection is in Analysis only. The dated calibration-first revision below
> supersedes the historical checkbox/sampling-first descriptions. Owner review pending.

## 1. Overview & Purpose
The **Spectroscopy & Line Profile Analysis Tool** enables students and educators to perform high-precision pixel intensity profiling across static images or video frames of optical spectra. The tool samples visual data along a user-defined line profile segment and performs perpendicular pixel averaging (Spread) across selected color channels (Luma, Red, Green, Blue) to plot smooth intensity graphs.

---

## 2. User Experience & UI Elements

### Sidebar Panel: Spectroscopy & Line Profile
* **Line Profile Checkbox**: Toggles the display and activation of the Lime-colored dashed line profile overlay on the canvas.
* **Spread Width (px)**: Range slider (typically `1` to `30` pixels) adjusting the perpendicular thickness of the sampling region.
* **Color Channel Selector**: Dropdown menu allowing the user to select the visual channel to sample:
  * **Luma (Intensity)**: Combined luminance value ($0.299R + 0.587G + 0.114B$).
  * **Red**: Pure red channel.
  * **Green**: Pure green channel.
  * **Blue**: Pure blue channel.

### Analysis View: Spectral Profile Tab
* Displays a **ComposedChart** showing pixel intensity on the Y-axis ($0$ to $255$) and the chosen X-axis unit (Pixels, Meters, or Wavelength in nm).
* If the **Luma** channel is selected, the chart overlays three faint background lines showing the individual Red, Green, and Blue intensity distributions to help students analyze overlapping spectral bands.
* **Emission Line Guides**: A sidebar check-list allowing the user to overlay vertical theoretical reference lines directly on the chart:
  * **Hydrogen ($H_2$ Balmer Series)**: $410.2\text{ nm}$ (Violet), $434.0\text{ nm}$ (Blue-Violet), $486.1\text{ nm}$ (Cyan), $656.3\text{ nm}$ (Red).
  * **Helium ($He$ Noble Gas)**: $447.1\text{ nm}$ (Blue), $501.6\text{ nm}$ (Green), $587.6\text{ nm}$ (Yellow), $667.8\text{ nm}$ (Red).
  * **Mercury ($Hg$ Metal Vapor)**: $404.7\text{ nm}$ (Violet), $435.8\text{ nm}$ (Blue), $546.1\text{ nm}$ (Green), $579.0\text{ nm}$ (Yellow).

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `lineProfile`: `"Line Profile" / "Perfil de Línea"`
* `spreadWidth`: `"Spread Width" / "Ancho de Dispersión"`
* `channel`: `"Channel" / "Canal"`
* `lumaChannel`: `"Luma (Intensity)" / "Luma (Intensidad)"`
* `redChannel`: `"Red" / "Rojo"`
* `greenChannel`: `"Green" / "Verde"`
* `blueChannel`: `"Blue" / "Azul"`
* `spectralCalibration`: `"Wavelength Calibration" / "Calibración de Onda"`
* `spectralCalibDesc`: `"Identify two reference markers..." / "Identifique dos marcas de referencia..."`

---

## 4. Technical Architecture & Mathematics

### Offscreen Canvas Sampling
To isolate visual data from UI elements, zooms, or overlays drawn on the active workspace canvas, the sampling engine constructs a temporary offscreen canvas at the media's **native pixel dimensions** ($W_{\text{native}} \times H_{\text{native}}$):
```javascript
const canvas = document.createElement('canvas');
canvas.width = videoDims.w;
canvas.height = videoDims.h;
const ctx = canvas.getContext('2d');
ctx.drawImage(mediaElement, 0, 0, videoDims.w, videoDims.h);
const imgData = ctx.getImageData(0, 0, videoDims.w, videoDims.h);
```

### Perpendicular Spread Math
Let the line profile segment be defined by endpoints $P_1(x_1, y_1)$ and $P_2(x_2, y_2)$ in native coordinates.
1. The direction vector $\vec{D} = (dx, dy) = (x_2 - x_1, y_2 - y_1)$ has length $L = \sqrt{dx^2 + dy^2}$.
2. The unit direction vector is $\hat{u} = (ux, uy) = (dx/L, dy/L)$.
3. The unit perpendicular normal vector is $\hat{n} = (nx, ny) = (-uy, ux)$.
4. The line is sampled at $N = \lfloor L \rfloor$ discrete steps. For each step $i \in \{0, 1, \dots, N\}$, the central coordinate $C_i$ along the line is:
   $$C_i = P_1 + \left(i \cdot \frac{L}{N}\right) \cdot \hat{u}$$
5. For a spread width $W$ (pixels) and radius $K = \lfloor W / 2 \rfloor$, the perpendicular sampling coordinates $S_{i, k}$ are:
   $$S_{i, k} = C_i + k \cdot \hat{n}, \quad \text{for } k \in \{-K, \dots, K\}$$
6. The RGB values are fetched from the image data array at each coordinate $S_{i, k}$, averaged across the $2K + 1$ samples, and Luma is computed as:
   $$\text{Luma} = 0.299R + 0.587G + 0.114B$$

---

## 5. State Persistence
* `lineProfile`: `{ p1: {x, y}, p2: {x, y}, spread: number, channel: string }` (or `null` if disabled).
* `activeReferenceOverlays`: `{ h2: boolean, he: boolean, hg: boolean }` (emission line overlays visibility states).

## Repair increment

Sampling/math now live in src/utils/spectroscopy.js for deterministic tests.
Each sample retains native x/y and exact distance, so clipping cannot stretch the
wavelength axis. Spread uses the requested count of samples (including even widths),
and intensity/RGB means retain fractional precision. Invalid/zero-length lines
produce no rows. Spectral export uses the same rows and effective axis units as
the graph. Camera pixel intensity is reported on a 0–255 scale, not physical flux.
The Sidebar uses SpectroscopyPanel: reference marking is possible before a line,
line placement uses two clicks, and View spectrum explicitly selects spectral
analysis. Legacy wavelength calibration remains readable; see spec 02 amendment.

SP-08: H, He and Hg controls only toggle theoretical overlays. They never change
axis units, calibration, measured data or chart domain. Enable comparisons only
with valid calibration and a wavelength axis; otherwise explain the prerequisite.
Reference lines outside the current experimental range are omitted, without
expanding the domain. In-range lines retain their known wavelengths. Comparison
labels are inside the plot and retained in PNG. Browser validation remains pending.

SP-09: Changing spectral channels in Analysis must not refit the hidden media
canvas or produce nonpositive zoom. Image auto-fit depends on media dimensions,
not channel/overlay renders. Unmeasurable viewports preserve existing zoom for
both images and video. Disable channel selection until a sampling line exists.
Verify hidden/undersized viewport calculations and per-channel intensity values;
owner browser validation remains pending.

## Owner-approved guided workflow — 2026-09-19

Replace the stacked configuration with three persistent expandable step headers:
Select spectrum → Calibrate wavelengths → Explore spectrum. One step is open at
a time; completion never forces navigation. Sampling comes first, with width/channel
under Adjust sampling. Calibration shows two reference rows with placement state,
Reposition actions, specific validation, and optional guide alignment. Continue in
pixels bypasses calibration without deleting it. Explore shows the actual intended
axis units and opens the graph. Graph offers Edit sampling / calibration, Compare
elements and Export spectrum. Use existing help popovers for nonessential explanations.
Changing steps cancels pending placement, preserves completed work, and stores no
workflow UI state in project files. Preserve numerical behavior and EN/ES parity.
Acceptance: sample and redraw, calibrate/reposition, targeted invalid feedback,
pixel-only exploration, return from graph, state preservation, keyboard/touch and
visual review by owner. Code checks do not establish browser acceptance.

## Guided spectroscopy workflow — 2026-09-19

Implemented Select spectrum → Calibrate wavelengths → Explore spectrum, with
persistent step headers and one expanded region. Completion never auto-advances.
Sampling width/channel and guide alignment are optional disclosures; secondary
explanations use the shared help boxes. References show Mark/Reposition and placement
state; validation names the next missing/invalid wavelength or position.
Continue in pixels preserves existing calibration. Explore summarizes the intended
units and opens the graph only when samples exist. The graph offers Edit sampling /
calibration, Compare elements and Export spectrum. Step changes cancel unfinished
placement while preserving sampled data and calibration. Workflow state is transient
and excluded from project/autosave fields. All new labels support EN/ES.

64 tests, lint, build and whitespace checks pass. Tests cover calibration feedback,
translation parity, step cancellation/preservation, persistence exclusion, one expanded
step and uncalibrated graph availability. Existing numerical spectroscopy tests pass.
Owner browser review remains pending: draw/replace, reference placement/reposition,
alignment, pixel-only flow, graph return, keyboard/touch and layout/animation.
Existing build-size and Browserslist warnings remain. No deployment or push.

## Owner revision: calibration first — 2026-09-19

Supersedes sampling-first guidance. Start with Calibrate wavelengths, then Adjust
sampling line, then Explore spectrum. Require a positive wavelength before locating
each reference; show a highlighted locating button, crosshair and on-image instruction
containing the entered wavelength. Reference colors/numbers match image markers;
markers support dragging and Reposition. Opening sampling creates a centered line
only if absent; preserve existing lines on reopening. Show width immediately and
fill its sampling band. Remove draw/replace/remove and repeated Next actions.
Color channel already exists in Analysis: remove only the sidebar duplicate.
Headers show completion and a temporary next-step cue plus text, respecting reduced
motion; never force auto-navigation. Keep explicit pixel-only bypass and existing
calibration/data intact. Owner evaluates visual interaction after code checks.

## Calibration-first spectroscopy refinement

Owner requested calibration before sampling. Color-channel selection was verified
in Analysis and remains there; removed only its sidebar duplicate. The panel now
starts with wavelength entry and explicit Locate Reference buttons, disabled with
an explanation until values are positive. Active placement highlights the action,
shows the entered wavelength over the image and uses the existing crosshair.
Reference labels match cyan/red canvas markers, which now support direct dragging
in the calibration view; Reposition remains available.

Opening Adjust sampling line creates a centered native-pixel line only if absent,
preserving any existing endpoints, width and channel. Width is immediately visible
and the canvas paints a translucent sampling band. Removed draw/replace/remove
line and repeated Next buttons. Headers show completion, a three-cycle cyan cue
(respecting reduced motion), and explicit next-step text. Sampling activation pauses
playback/manual tracking and invalidates automatic acquisition before adjustment.
Pixel-only bypass and existing Analysis controls remain available.

66 tests, lint, build and whitespace checks pass. Coverage includes line creation
and preservation, calibration preservation, bilingual labels, section order,
placement prompt content and removal of redundant controls. Owner browser testing
of placement, reference dragging, line handles/band and cues remains pending.
Existing bundle-size/Browserslist warnings remain. No deployment or push.

## Comparison-label spacing — 2026-09-20

Move the vertical theoretical emission labels 10 screen pixels to the left of
their existing position so dotted guides do not run through the text. Preserve
wavelength positions, label content, colors, axis domain and exported labels.
Owner acceptance: compare elements in the spectrum graph and confirm wavelength
labels are readable beside their dotted lines, including near plot edges.

## UI/UX accessibility and localization follow-up — 2026-09-20

- SP-10: Preserve the distinct H/He/Hg comparison hues approved by the owner. In
  light mode, use darker variants or a neutral high-contrast label treatment so
  small text reaches a 4.5:1 contrast target while dotted guides remain visually
  associated with their labels. Keep dash patterns and element names so color is
  never the only distinction.
- SP-11: Translate every student-facing comparison term in EN/ES, including series
  descriptions and color names. Chemical symbols and wavelengths remain scientific
  identifiers; descriptions around them use the selected interface language.
- SP-12: Provide keyboard-operable and numeric alternatives for locating/repositioning
  both wavelength references and for placing/moving the sampling line. Announce the
  active handle, native-image coordinate, wavelength where available and completed
  action through translated status text.
- SP-13: Keep theoretical labels inside the plot and readable at domain edges, at
  390px and in exported images. Label offsets must not change wavelength positions,
  measured data, axis domains or comparison colors.

Owner checks both themes, EN/ES, keyboard/touch, overlapping measured peaks and
theoretical lines near both plot edges. Automated contrast calculations and export
inspection support but do not replace the visual/browser review.
