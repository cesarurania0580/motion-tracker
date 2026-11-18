# Scientific graphing — Stage 2 integration

Owner accepted Stage 1 preview and exports and authorized Stage 2 on 2026-10-24.

- GI-01: Analysis offers Existing graphs (default) and New graphing. Lazy-load the
  new workspace; no renderer mounts while Tracker is visible. Preserve the legacy
  graph path and project schema. New presentation state is session-only.
- GI-02: Read App's calibrated/rotated/time-adjusted position and velocity outputs
  for the active object/COM. Never write measurements, calibration or tracking
  state. Select axes and time crop locally. Filter missing/nonfinite values;
  never treat null velocity as zero. Retain position uncertainty only for position
  axes. No inferred velocity/acceleration uncertainty.
- GI-03: Acceleration is a new read-only derivative of existing velocity, using
  three-point quadratic differentiation with actual timestamps (one-sided at
  endpoints). Require three distinct finite samples; ambiguous duplicate times
  yield no acceleration. Derive before cropping; explain noise amplification.
  Preserve all existing position, velocity and fitting calculations.
- GI-04: Real spectrum uses spectralRows and existing RGB/luma values, calibrated
  wavelength/distance/pixel modes, selected channel, optional RGB lines and existing
  H/He/Hg reference wavelengths. No synthetic labels or sample annotations.
- GI-05: Share the accepted figure workspace, style controls and SVG/PNG/vector PDF
  exports. Copy data into figure traces; exports use a temporary plot. CSV exports
  current plotted values with honest units. Retain legacy CSV unchanged.
- GI-06: EN/ES, empty/missing-series feedback, accessible controls, scoped CSS,
  real point selection and correct parameter units. Reset view/labels on source,
  axes or object changes. Export captures the current figure even if data updates.
- GI-07: Test adapter units, numerical parity, acceleration, crop behavior, missing
  values, spectrum channels/references and mutation isolation. Run existing tests,
  lint, main and trial builds. Owner reviews PC/iPad live tracking, switching,
  themes, touch, clipping and all exports before classroom release.

No deployment or commit requested. No project-format changes, weighted fitting,
new fit models, external data import or removal of legacy graphs.

## Implementation evidence

105 tests pass, including six Stage 2 adapter/rendering checks. Lint, main build
and separate trial build pass. Plotly remains a separate ~404 KB gzip chunk;
NewGraphing is ~14 KB gzip plus shared fonts and styles. PDF libraries load only
on export. Local main entry, new source module and font return HTTP 200, as does
the main entry on 192.168.100.6:9001. HTTP/build checks do not prove browser behavior.

Owner PC/iPad acceptance remains pending: open a saved experiment, compare legacy
and new values/fits, change active object/COM and calibration, crop and reset, test
missing velocity and acceleration data, check spectrum modes/channels/references,
export SVG/PNG/PDF/CSV, return to Tracker and confirm manual/automatic tracking.
Test both themes and EN/ES. New settings reset on leaving Analysis, switching
engines or objects; they are not saved in project files. No release performed.
