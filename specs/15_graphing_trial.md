# Scientific graphing — Stage 1 feasibility trial

Owner approved Stage 1 of `docs/proposals/2026-10-24-scientific-graphing.md` on
2026-10-24. This is an isolated engineering trial of the proposed single layout,
not a production replacement or a request for alternative UI designs.

- GRAPH-01: Separate trial HTML entry and build output, with in-memory sample data.
  Never mount App, touch project storage, or mutate recorded measurements.
- GRAPH-02: Four labeled synthetic experiments: constant velocity, constant
  acceleration, oscillation and an emission spectrum. Reuse fitCurve unchanged
  for linear/quadratic/sinusoidal models. Spectrum has no inferred fit.
- GRAPH-03: One figure definition drives an SVG-based Plotly preview and exports.
  Show uncertainty bars explicitly as display-only; fits remain unweighted.
- GRAPH-04: Data/Fit/Appearance/Export controls in EN/ES, usable on narrow screens.
  Include sample selection, read-only data, model selection, label/style controls,
  error-bar toggle, axis auto/manual ranges, a reset action and selected-point
  inspection. Surface experiment and numerical result state.
- GRAPH-05: Export SVG, PNG and trial vector PDF at chosen physical dimensions.
  Include a bundled licensed font for Greek text and mathematical symbols.
  Preserve explicit download/open links for iPad. Report failures visibly.
- GRAPH-06: Record measured preparation/render/export durations where available.
  Include a larger spectrum sample for device trials; do not imply desktop
  measurements establish iPad performance.
- GRAPH-07: Numerical parity and deterministic figure checks, existing regression
  suite, lint, main build and separate trial build. Owner tests iPad and PC touch,
  resizing, clipping, readable symbols/fonts, saved files and appearance. PDF
  fidelity and browser performance remain pending until actually inspected.

No commit, push, deployment, production graph migration, new regression model,
weighted fitting, custom equations or external data import is included.

## Implementation evidence — 2026-10-24

Trial implementation is available at `/graph-trial.html` via
`npm run dev:graph-trial`. Numerical/figure checks and the existing regression
suite pass (99 tests); lint, main build and separate trial build pass. The main
build retains its pre-trial JavaScript/CSS asset hashes. HTTP checks returned 200
for the trial page, source modules, bundled font and Wi-Fi interface. These checks
do not establish browser interaction or export fidelity. GRAPH-04 through GRAPH-07
retain owner PC/iPad appearance, touch, clipping and saved-file acceptance gates.
See `src/prototypes/graphing/NOTES.md` for measurements and the review checklist.
