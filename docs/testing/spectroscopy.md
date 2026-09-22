> Current checkpoint: [2026-09-19 progress](../progress/2026-09-19.md).
> Latest code checks: 66 tests, lint, build and whitespace checks pass.
> Earlier spectroscopy repairs were reported working. The new calibration-first
> workflow awaits owner browser review; older sampling-first checklists are historical.

# Spectroscopy repair — 2026-09-15

## Objective and reproduced cause

Upload spectrum image, mark two known wavelength positions, place a sampling line,
then plot/export native-pixel intensity against calibrated wavelength.

A Node reproduction called the real store as existing UI handlers did:
setWavelengthCalibration(previous => ({...previous,p1_t:0.25})). The setter stored
the callback itself. Result: typeof calibration was function, wavelength undefined,
and JSON.stringify omitted calibration. Regression test failed with undefined
instead of 486.1 before fixing the setter. It now passes and serializes the values.
This is a code-level reproduction, not confirmation of every owner browser symptom.

Related findings: relative reference fractions changed with sampling-line movement;
graph wavelength indexing used retained row count after clipping; CSV always exported
motion data; PNG applied motion-fit styling/title even on a spectrum.

## Changes

- Functional calibration updates resolve to objects.
- New references use fixed original-image points; two-point projection sets wavelength.
- Legacy endpoint/fraction calibrations are read and anchored before line edits.
- Missing/invalid calibration falls back to pixels without invented wavelengths.
- Three explicit sidebar steps; no motion calibration/FPS dependency.
- Graph and CSV share data; spectral PNG preserves spectral colors and has no motion fit.
- Programmatic selection pauses actual video playback as well as the UI state.

## Code evidence

38 tests pass (7 spectroscopy tests). Synthetic image with two bright columns maps
to 400 and 700 nm in graph rows and CSV. Tests cover reversed/rotated geometry,
line movement, invalid/equal/coincident references, legacy data, clipping, even-width
averaging, and EN/ES keys. Lint and build pass; existing build warnings remain.

## Pending owner browser acceptance

- [ ] Upload a spectrum image, expand Spectroscopy & Line Profile.
- [ ] Enter two real known wavelengths and mark their image positions before a line.
- [ ] Place sampling start/end across the spectrum; View spectrum shows peaks in nm.
- [ ] Move sampling line vertically; reference markers stay fixed.
- [ ] Reposition references using Mark on image; graph calibration updates.
- [ ] Clear or enter invalid calibration; graph uses pixels, not fabricated nm.
- [ ] Change RGB/intensity and width; inspect CSV and PNG exports.
- [ ] Save/reopen project and original image; calibration and line remain correct.
- [ ] Test legacy project, EN/ES, zoom, rotated spectrum, and touch selection.

Limit: a two-point linear calibration assumes approximately linear dispersion. No
absolute radiometric calibration, instrument-response correction, or claimed browser
acceptance. Tests use synthetic image arrays, not an owner-provided spectrum file.

## Reference-guide tilt update
Reference heights no longer determine guide tilt for image calibrations. Both
guides default to vertical, including before the second point is placed. Shared
angle slider and Reset to vertical control also update wavelength projection.
Legacy relative calibration retains its direction when converted.
Validation: 39 tests pass; lint, production build and diff whitespace checks pass.
Browser acceptance pending: place references at different heights; confirm vertical
guides, adjust tilt to match a rotated spectrum, reset, and reload a saved project.

## Element comparison visibility
Confirmed via real-store regression: enabling H/He/Hg left spectralMode='pixels',
while chart reference rendering required wavelength mode. The test failed before
fix and passes after selecting wavelength mode for valid calibration. Recharts'
local ReferenceLine implementation also defaults to discarding out-of-domain
lines; comparison lines now explicitly extend the domain. Uncalibrated controls
are disabled with EN/ES guidance. Labels are inside the plot.
Validation: 40 tests, lint, build and diff checks pass. No browser reproduction
was performed; owner must verify H/He/Hg toggles, narrow-range spectra, labels,
and PNG output. These code findings may not cover every cause of the reported
visual symptom.

## Owner correction: comparison overlays must not change the experiment
Supersedes the automatic mode switch/domain expansion described above. Checkboxes
now only set overlay visibility. ReferenceLine uses ifOverflow='discard', so
out-of-range theoretical lines do not expand the measured chart domain. Users
select wavelength mode explicitly; otherwise a translated message explains why
comparison controls are disabled. Regression exercises all three elements on/off
in all axis modes and confirms calibration, samples, sampling line, units and
computed spectral rows remain unchanged. All 40 tests, lint, build and whitespace
checks pass. Browser acceptance pending: toggle each element on a calibrated
spectrum and confirm the experimental curve and axes remain stationary.

## Analysis color-channel crash
Code reproduction: a hidden 0×0 viewport and 1000×800 image produced zoom=-0.05
and canvas handle radius=-140. Channel edits changed renderFrame, re-running the
image-fit effect while Tracker was display:none; Canvas arc rejects negative
radii. Image fitting now depends only on media/dimensions, and a shared fit helper
rejects hidden, undersized or invalid viewport dimensions for image and video.
Channel selection without a line is disabled and guarded against creating a
partial line object. No media processing algorithm or calibration was changed.
42 tests pass, including hidden viewport rejection and RGB/luma sampling with
unchanged wavelengths; lint, build and whitespace checks pass. Browser crash
confirmation remains pending: switch all channels in Analysis, then return to
Tracker and verify image zoom and sampling line are preserved.

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
Owner screenshot shows rotated theoretical labels overlapping their dotted guides.
Added dx=-10 to the existing ReferenceLine labels. Installed Recharts Text applies
this to the text x coordinate and rotation pivot, shifting labels horizontally.
66 tests, lint, production build and whitespace checks pass; existing bundle-size
and Browserslist warnings remain. No new test for this one-property visual change.
Owner browser confirmation of readability and plot-edge labels remains pending.
