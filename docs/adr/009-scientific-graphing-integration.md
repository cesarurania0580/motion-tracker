# ADR 009 — Opt-in scientific graphing alongside the legacy renderer

Status: implemented locally; owner integration acceptance pending (2026-10-24).

The owner accepted the Stage 1 trial and its exported files and authorized Stage 2.
Analysis exposes Existing graphs (default) and New graphing. The new module is lazy
loaded and only mounted when selected in Analysis. Plotly and PDF code stay in
separate chunks. A rendering error is contained so the existing view remains usable.

App passes its existing position and velocity outputs as read-only props; only two
props are added at that boundary. All graph controls are local React state. No
tracking callbacks, store setters, project persistence or original-pixel conversions
are imported by the graph workspace. The existing fitCurve routine consumes mapped
finite axis values without modifications. Spectroscopy uses spectralRows plus the
same RGB/luminance definition and shared emission references. The selected source,
axes, crop and model do not update the legacy controls. The graph workspace unmounts
on leaving Analysis, switching engines or changing the object, so temporary settings
reset. Project serialization of presentation choices is deferred.

Acceleration was not an existing output. A pure adapter differentiates existing
velocity with three actual timestamps, using a quadratic interpolant (one-sided
at endpoints), before cropping. Fewer than three or duplicate timestamps produce
no acceleration. Missing component values remain missing; no uncertainty is invented.
This does not improve or replace the upstream velocity estimator. UI explains noise
amplification. Existing position and velocity calculations and legacy CSV stay intact.

Shared figure generation copies values into SVG scatter traces. Preview and exports
use the same figure; export uses an offscreen temporary plot and the accepted font
pipeline. CSV is explicitly the plotted data, with units and blanks for unavailable
uncertainties. Styled labels and graph settings do not rewrite numerical values.

Shared CSS resets are scoped to .graphing-trial to avoid changing the main app after
lazy loading. The paper preview stays light in either app theme; the surrounding app
retains its selected theme. Device layout and interaction still need owner checks.

Validation: 105 tests, lint, main and trial builds; no browser automation. Tests
cover numerical parity, immutable inputs, irregular timestamps, spectrum mapping,
CSV units and bilingual server rendering. Test-only asset loaders were extended
for the newly reachable font/CSS modules; existing welcome assertions are unchanged.
