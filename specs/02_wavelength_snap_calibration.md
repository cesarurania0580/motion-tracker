# Technical Specification: 2-Point Laser Snap Calibration & Projection Guidelines

> Current interaction (2026-09-19): calibration is spectroscopy step 1. Enter a
> positive wavelength before Locate Reference; show the value and reference number
> in an instruction over the image, plus active-button styling and crosshair. Markers
> are draggable in calibration; Reposition remains available. Reference colors match
> the sidebar. Numerical calibration rules are unchanged. Latest workflow review pending.

## 1. Overview & Purpose
This module provides **Arbitrary 2-Point Laser/Scale Wavelength Calibration** and **Vertical Alignment Guidelines** for the spectroscopy analysis suite. It decouples the optical sampling boundaries (defined by line profile endpoints $P_1$ and $P_2$) from the physical reference calibration points ($R_1$ and $R_2$), permitting users to calibrate a setup using scale markings or laser dots that extend *outside* the active spectrum sampling line.

---

## 2. User Experience & UI Elements

### Wavelength Calibration Side Card
* **Ref 1 & Ref 2 Inputs**: Text fields enabling the user to input the physical known wavelengths (in nm, default `400` and `700` respectively).
* **🎯 Snap to Click Buttons**: Places the canvas in snapping mode:
  * A pulsing yellow status banner appears at the top of the workspace: *"🎯 Click on Reference 1 (laser dot/peak) on the image..."*.
  * The canvas cursor turns into a high-precision crosshair.
  * Clicking anywhere on the canvas projects that point onto the line profile, updating Reference 1 ($t_1$) or Reference 2 ($t_2$) instantly.
* **Position Sliders**: High-precision range inputs (0% to 100%) adjusting the reference fractions ($t_1, t_2$) manually along the segment.
* **Show Guidelines Checkbox**: Toggles vertical dashed projection lines (Cyan for Ref 1, Red for Ref 2) passing through $R_1$ and $R_2$ across the full height of the canvas to ease scale/laser alignment.

---

## 3. Translation Dictionary Keys (`TRANSLATIONS`)
* `ref1Wavelength`: `"Ref 1 Wavelength (nm)" / "Onda Referencia 1 (nm)"`
* `ref2Wavelength`: `"Ref 2 Wavelength (nm)" / "Onda Referencia 2 (nm)"`
* `clickToSnap`: `"🎯 Snap to click" / "🎯 Fijar con clic"`
* `positionOnLine`: `"Position on line" / "Posición en la línea"`
* `snappingPrompt`: `"🎯 Click on Reference 1..." / "🎯 Haga clic en la Referencia 1..."`
* `snappingPrompt2`: `"🎯 Click on Reference 2..." / "🎯 Haga clic en la Referencia 2..."`
* `showGuidelines`: `"Show Guidelines" / "Mostrar Guías"`

---

## 4. Technical Architecture & Mathematics

### Point-to-Segment Projection
Click coordinate inputs $C(cx, cy)$ are projected onto the infinite line containing the segment $P_1(ax, ay) \to P_2(bx, by)$.
1. The segment direction vector is $\vec{V} = P_2 - P_1 = (bx - ax, by - ay)$.
2. The coordinate offset vector is $\vec{W} = C - P_1 = (cx - ax, cy - ay)$.
3. The fractional parameter $t$ along the segment is computed as:
   $$t = \frac{\vec{W} \cdot \vec{V}}{\|\vec{V}\|^2} = \frac{wx \cdot vx + wy \cdot vy}{vx^2 + vy^2}$$
4. **Clamping Isolation**:
   * **Click-to-Snap**: Clamping is **disabled** (`clamp = false`). This permits $t < 0.0$ or $t > 1.0$, enabling correct calibration using markings or laser dots that extend beyond the physical boundaries of the drawn line profile segment.
   * **On-Canvas Dragging**: Clamping is **enabled** (`clamp = true`), returning:
     $$t_{\text{clamped}} = \max(0.0, \min(1.0, t))$$
     This guarantees calibration handles remain physically bound within the drawn line profile segment boundaries when dragged.

### Generalized Linear Wavelength Mapping
The wavelength $w(t)$ at any fractional coordinate $t \in [0.0, 1.0]$ along the line profile segment is mapped using:
$$w(t) = w_1 + \frac{t - t_1}{t_2 - t_1} \cdot (w_2 - w_1)$$
where:
* $t_1, t_2$ are the fractional offsets ($p1\_t, p2\_t$) of the reference points.
* $w_1, w_2$ are the known reference wavelengths ($p1\_wl, p2\_wl$).

If $t_1 = 0.0$ and $t_2 = 1.0$ (defaults), this simplifies directly to the original end-to-end mapping:
$$w(t) = w_1 + t \cdot (w_2 - w_1)$$
maintaining 100% backward compatibility with previous project files!

---

## 5. State Persistence & UI Drawing
* `wavelengthCalibration`: `{ p1_wl: number, p2_wl: number, p1_t: number, p2_t: number }` (or `null` if uncalibrated).
* `showGuidelines`: `boolean` (toggles dashed vertical rendering at $x = r_1\_x$ and $x = r_2\_x$ across the canvas height).

## Repair and student workflow (supersedes relative-reference editing)

Objective: upload spectrum image → enter two known wavelengths and mark their
image positions → place a sampling line → inspect/export intensity by wavelength.
New calibrations store p1_point/p2_point in native image pixels plus
coordinateMode='image'. References stay fixed when the sampling line moves.
Projection onto the reference-to-reference direction defines the linear wavelength
axis. This assumes approximately linear dispersion, not absolute spectrometer
response. Legacy p1_t/p2_t and endpoint-only projects remain readable; editing the
line freezes legacy reference positions first. Missing, coincident, nonpositive or
equal-wavelength references cannot produce a calibrated graph.

SP-01: updater callbacks yield serializable objects (regression reproduced).
SP-02: references can be placed before a sampling line; selection cancels other tools.
SP-03: line placement/movement never moves image-anchored references.
SP-04: blank/invalid calibration shows pixels and a corrective message, not default nm.
SP-05: sampling uses native media pixels; clipped samples retain original distances.
SP-06: View spectrum opens the spectral chart; CSV contains spectral rows, and PNG
uses a spectrum title without motion-fit annotations. EN/ES instructions and touch
controls are required. User browser acceptance remains pending.

## Explicit reference-guide tilt
SP-07: Image-reference guides default to canvas-vertical (0 degrees), independent
of differing reference heights. A shared -90 to +90 degree slider and reset to
vertical control rotate both parallel guides around their fixed reference points.
Positive angles tilt the top toward the right. Wavelengths use projection onto
the perpendicular dispersion axis, matching the guides; reject reference
separation below one pixel on that axis. Store guideAngleDeg in calibration.
Legacy relative references retain their previous projection until converted,
including preserving their angle during conversion. Test default unequal heights,
explicit tilt, degenerate projection, and serialization. Browser acceptance pending.
