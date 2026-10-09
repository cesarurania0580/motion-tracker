# Phase 4 — analysis polish

Owner chose to polish the existing layout and approved coordinates-only tooltips.
Owner likes the implemented layout. Follow-up: coordinate cards must appear
immediately at the hovered point, without sliding from a prior position.
Point-hover follow-up: motion coordinates must target real dots directly, with a
12px invisible hit radius and a visible active ring. Remove the axis cursor and
axis-based tooltip selection; virtual fit points and error bars cannot intercept
point interaction. Keyboard focus and touch should reveal the same coordinates.

- ANA-01: Preserve graph-left/controls-right structure. Group axis selectors and
  time range separately, label inputs, provide Show all. Retain existing fit models.
- ANA-02: Motion hover card shows object and unique plotted coordinates only,
  formatted sensibly with units. No duplicate chart-layer entries, internal keys,
  fit values, residuals or uncertainty rows. Ignore virtual fit samples. Use explicit
  high-contrast text in both themes; error bars remain on the plot.
- ANA-03: Brighter axis text and a quieter grid. Keep measured dots and dashed fit
  visibly distinct. Values remain full precision internally; labels use pixels and
  pixels/second when motion is uncalibrated, meters and meters/second when calibrated.
- ANA-04: Model selector, equation and aligned parameters remain prominent. Show
  correct parameter units, distinguish angular frequency from ordinary frequency,
  and add short conditional interpretations with expandable fit/R² help.
- ANA-05: Group export actions and move legend placement to Graph appearance.
  Preserve spectroscopy workflows and export data semantics. EN/ES are synchronized.
- ANA-06: No new fit models, residual plots, fit uncertainty, tracking-quality or
  recovery work in this increment. Existing numerical fitting is unchanged.

Validation: tests for coordinate extraction, duplicate/virtual-layer exclusion,
number formatting, unit mapping and conditional interpretation; existing numerical
tests, lint and build. Owner checks actual hover behavior, themes, EN/ES, time-range
reset, fitting, graph/data export and spectroscopy. Browser acceptance pending.

## Implementation evidence

Coordinates-only motion tooltip selects a real data row, deduplicates selected
axes and ignores virtual fit rows. Fit/error-bar layers are excluded from tooltip
entries. Both themes explicitly set readable card text. Axis/time-range fieldsets,
parameter units and contextual interpretation, expandable help/appearance and
grouped export actions are implemented in EN/ES. Uncalibrated graph labels use
px or px/s; calibrated labels use m or m/s. Data and fitting algorithms are unchanged.

53 tests, lint and production build pass. Five new tests cover payload filtering,
precision formatting, dimensions, conditional interpretation and translation parity.
Existing Browserslist-age and chunk-size build warnings remain. Actual hover,
layout, export and theme acceptance are pending owner browser evaluation.

## Direct point hover follow-up

Installed Recharts ComposedChart supports axis-based tooltip selection only. Its
horizontal selection competes with virtual fit samples; hiding its cursor alone
does not solve point targeting. MotionChart now renders direct point hit targets
(12px radius), a selected-point ring and a stationary coordinate card. It has no
axis Tooltip/cursor. Virtual samples are excluded from scatter data; fit and
error-bar layers do not intercept pointer events. Focus/touch also select a point;
Escape and leaving the chart dismiss the card. Hover rings are removed on export.
The empty-state overlay no longer covers a single available point.

53 tests pass; final lint, build and whitespace checks pass. Browser reproduction
and pointer/touch/focus validation remain owner checks, including dense plots,
fits enabled, edge points and graph export. Existing build warnings remain.

## Empty-state and prerequisite follow-up — 2026-09-20

- ANA-07: With no measured data, show a concise explanation of what Analysis will
  contain and one Return to Tracker action. Defer or disable axis, range, fit,
  appearance and export controls until their prerequisites exist; do not present
  a full configuration surface that cannot yet produce a result.
- ANA-08: Each disabled analysis/export action communicates its prerequisite in
  EN/ES. Export becomes available only when the corresponding graph or data rows
  exist. Failures appear next to the attempted action and retain a recoverable path
  instead of relying on a blocking browser alert.
- ANA-09: Empty, one-point, insufficient-fit-data and valid-fit states each have
  explicit behavior. Model controls and interpretations appear only when the
  selected data can support them; scientific calculations remain unchanged.
- ANA-10: Verify the graph/controls layout and Return to Tracker action at 390px,
  keyboard-only, touch and both themes. Keep coordinates, comparison labels and
  export affordances readable without page-level horizontal scrolling.

Owner validation must cover motion and spectroscopy empty states separately. This
follow-up changes presentation and availability only; it does not redefine fit,
sampling or export mathematics.

## Fit-line boundary repair — 2026-10-08

Clip motion trend lines to both numeric axis boundaries in preview and scientific
PNG export. Keep fit calculations, sampled curve values, equation and R² intact.
Retain SVG clipping definitions when cloning for export. Verify a descending line
crossing the lower boundary and other fit types at all four plot edges; owner
visual preview/export acceptance remains pending.
