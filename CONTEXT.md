# Project context

PhysTracker is a browser-based physics lab tool used by teachers and students.
Production is https://phystracker.org/; the owner uses GitHub and Netlify.
The configured repository is cesarurania0580/motion-tracker. Netlify's deployed
commit and branch have not been verified in this workspace.

React/Vite render the app; Zustand owns shared state; Recharts renders analysis.
VideoCanvas owns media and coordinate interaction. App derives physics data and
handles project files. All media processing is local to the browser. Autosave
uses localStorage; exported JSON contains measurements/settings, not the video.

## Domain language
- Object A/B: independently measured point series, each with a mass.
- Point: `{id, time, x, y}` in seconds and original media pixels.
- COM: derived mass-weighted center of matching A/B measurements; never directly tracked.
- Calibration: pixels-per-meter scale and origin/rotation; downstream calculations convert points.
- Template: clean image patch centered on the selected target.
- Search radius: candidate region in original video pixels, independent of zoom.
- Detailed tracking: native-pixel local capture with circular structural matching;
  the older downsampled prototype remains available for benchmark comparisons.
- Lost: candidate fails appearance checks; do not record it or adapt the template.
- Automatic tracking: local experimental assistance; measurements require visual inspection.

Known baseline: App.jsx disables lint; no pre-existing automated tests; the local
branch was 13 commits ahead of the last recorded origin/main and had reset/autosave
edits. The prototype had independent loss-detection tests. None establishes full
production equivalence. Existing specs 01–07 describe implemented features and
historical decomposition; their assertions are not test results.
