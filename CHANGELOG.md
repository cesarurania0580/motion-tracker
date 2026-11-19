# Changelog

## 1.3.1 — 2026-11-18

- Added keyboard shortcuts for manual tracking: Space records a point and advances one frame, the arrow keys or `,` and `.` step frames, and Backspace removes the last point and returns to its frame. Space plays or pauses the video outside manual tracking.
- Fixed the video moving when entering the scale distance on a zoomed, panned video.
- Changed the default point-location uncertainty from 10 px to 5 px. Saved work and project files keep their stored value.

## 1.3.0 — 2026-11-17

- Added Advanced graphing with editable spreadsheet data, selection, paste, fill, undo, scientific equations, and graph/data exports.
- Added power, exponential and logarithmic fits, uncertainty controls, worst-fit bounds, and transfer of video measurements into graphing.
- Added measurement uncertainty guidance, reversible analysis tools, and compatible video CSV imports.
- Updated light/dark styling, welcome navigation, and X-before-Y graph selectors.
- Improved timeline scrubbing with coordinated seeks and guards that preserve one-frame tracking advancement.
- Kept existing project loading and original-media coordinate units; synchronized English and Spanish controls.

## 1.2.0 — 2026-09-13

- Added automatic video tracking with native-pixel circular templates, adjustable search and adaptation settings, motion prediction, and loss diagnostics. Manual tracking remains available from the same toolbar control.
- Added live template adjustments while paused, explicit reselect/default actions, and a shared object-specific Clear Data control.
- Improved sinusoidal curve fitting with least-squares estimation and kept full precision during calculations.
- Reorganized analysis settings and optional overlays; fixed the scale-tool binding and project-reset handling.
- Added specifications, tests, and a reproducible rocket-video benchmark. Existing project measurement format remains compatible.

## Earlier releases

PhysTracker 1.1.0 introduced spectroscopy, wavelength calibration, and static-image analysis. Earlier project history is available in the repository's Git commits and specifications.
