# Guided spectroscopy workflow

Status: implemented locally; owner evaluation pending.

The owner approved calibration first, followed by direct sampling-line adjustment
and exploration. This supersedes the initial sampling-first iteration.
Three step headers remain visible and only one opens. Navigation never auto-advances
when measurements change, avoiding interruptions during adjustment. Pixel-only
exploration remains available and never clears wavelength calibration.

The store owns transient step and axis-preference UI state; project serialization
is unchanged. Step navigation cancels unfinished image placement synchronously.
Existing sampling, calibration, comparison and CSV mathematics are reused.
The graph provides a direct route back to the Tools spectroscopy configuration.
Specific calibration feedback is derived from the same validity rules as the
numerical implementation. Requirements and evidence are in spec 01.

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
