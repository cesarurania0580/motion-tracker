# Local evaluation: measurement uncertainty and student analysis

Owner authorizes local evaluation only, not production release.

- MU-01: Rename pixel slider to point-location uncertainty, explain estimation from
  repeated selection, blur and resolution. Default is a starting estimate, not accuracy.
- MU-02: Optional reference-length (m), each scale-endpoint (native px), and timestamp
  (s) uncertainty fields. Blank means unknown; explicit zero means assumed exact.
  Preserve old project files; persist optional fields in autosave and project JSON.
- MU-03: Conservative first-order position bound: location/ppm + |coordinate| times
  relative scale bound (dL/L + 2 endpoint/D). Origin and orientation treated fixed;
  parallax, lens distortion, mass uncertainty and tracking bias require discussion.
  Report partial estimates when calibration terms are missing. Propagate velocity
  stencil location terms and common scale term separately. Timing is per timestamp;
  unknown or excessive timing and uneven endpoint spacing leave velocity errors absent.
  Keep all existing positions, velocities and tracking algorithms unchanged.
- MU-04: Familiar video graph supports opt-in worst acceptable linear fits using
  plotted uncertainties or explicit overrides. Both slope and intercept bounds use
  all rectangles. Export includes lines; never represent these as confidence intervals.
- MU-05: Independent sheet supports reversible justified exclusions, reversible
  axis transformations and repeated-measurement summaries with source provenance.
  Missing uncertainty stays missing. Reject domains that cross a singularity.
- MU-06: Show values with uncertainty-aware rounding while retaining full precision
  internally and in numerical CSV. Copy plotted media measurements to independent
  worksheet explicitly, with replacement confirmation and provenance.
- MU-07: EN/ES parity, numeric and document compatibility tests; full tests/lint/main
  and trial builds. Browser/device acceptance by owner remains pending.

## Implementation and evidence — 2026-10-26

Implemented MU-01–06 locally. Budget is under Controls → Measurement settings;
video linear Fit now exposes maximum/minimum lines plus slope/intercept uncertainty.
Intercept extrema optimize feasible envelopes across the entire slope interval,
including cases where extrema are not at the extreme-gradient lines. Geometric
bounds remain an opt-in aid, not confidence intervals or an IB assessment guarantee.

Independent worksheet preserves original rows while applying square, reciprocal,
square-root or natural-log transforms to either axis. Domain-crossing rows are
reported and omitted. Exclusions require a reason and can be undone. Repeat helper
stores readings/instrument floor in row provenance. Graph documents retain these
additive fields and accept earlier version-1 documents. Plotted CSV contains active
transformed values; graph documents preserve the source and reasons. Explicit video
copy confirms replacement, uses the selected axes/crop and records its uncertainty
budget. Full video CSV now uses one table, actual m/px units and separate bounds.

131 tests pass, including actual App numerical invariance, restored-video budget
retention, worksheet controls/document retention, nonlinear interval domains,
instrument floors and interior intercept extrema. Lint and main/trial builds pass;
existing bundle-size, browser-data-age and MediaInfo runtime-URL warnings remain.
No browser automation, commit, push or deployment. Local root responds HTTP 200.

Owner acceptance pending: PC/iPad input, error bars, min/max line clipping in preview
and PNG, graph SVG/PDF/PNG, graph/project save/open, exclusions and transforms,
copy-to-worksheet replacement confirmation, manual/automatic tracking regression.
Known limits: first-order propagation with fixed origin/orientation; scale terms are
common across points, not statistical weights. Timing input is a timestamp bound,
not an FPS calibration estimate. Unequal-spacing endpoint velocity errors are not
supplied; acceleration and COM mass-uncertainty propagation remain unavailable.
Use a justified explicit bound when an unmodeled contribution matters.

## Owner-reported regressions: hover feedback and video CSV reimport

- Restore gentle, distinct hover feedback across playback, toolbar, sidebar and
  graphing actions. Preserve selected states, semantic colors, keyboard focus,
  disabled behavior and reduced-motion preference. No playback logic changes.
- Recognize current ten-column motion export and earlier multi-section motion CSV.
  Preview X/Y selection before replacing independent worksheet; map their matching
  uncertainty columns, preserve missing bounds and units. Keep 2/4-column imports.
  Cancel or invalid input preserves worksheet. Test actual App export → importer.

Regression repair evidence: reproduced the exact current export rejection (`columns`)
and added a failing actual App download → standalone upload test before wiring the
fix. Current and legacy video CSV now offer a non-destructive axis-selection panel,
with row-count/missing-value preview and cancellation. Uncertainties follow their
chosen quantity; units and unknown bounds survive. Generic 2/4-column parsing stays
compatible. 135 tests, lint and main/trial builds pass; browser acceptance pending.
Root cause: the export schema was expanded without extending the importer contract.
The new end-to-end component-handler test guards that boundary.
