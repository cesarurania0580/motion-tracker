# Worst acceptable linear fits and layout comparison

Owner requested worst-fit analysis and a separate HTML design-only comparison.

- WF-01: Opt-in in New graphing → Fit → Linear. Keep least-squares results unchanged.
  Determine minimum/maximum signed gradients among straight lines intersecting every
  selected point's axis-aligned uncertainty rectangle. Identify worst by maximum
  absolute difference from the best-fit gradient; report Δm=max deviations and
  percent only when best slope is nonzero. Not a confidence interval.
- WF-02: Use supplied per-point uncertainties or explicitly entered uniform X/Y
  values in plotted units. Missing X means treated as exact (state this). Missing Y
  prevents analysis; zero allowed if another nonzero uncertainty exists. Never infer
  velocity/acceleration uncertainties or silently change recorded measurements.
- WF-03: Validate all points, not just endpoints. Report unavailable/infeasible or
  unbounded cases; never draw fabricated bounds. Handle negative and zero slopes,
  repeated X and asymmetric data. Show if least-squares line misses any rectangle.
- WF-04: Error bars and max/min lines share preview and SVG/PNG/PDF figure generation,
  clipping, distinguishable line styles and legend labels. CSV includes explicitly
  selected uncertainties when this mode is active. All input changes are local.
- WF-05: EN/ES; tests with hand-calculated bounds, interior constraints, X errors,
  negative slopes, degenerate/infeasible cases, immutable data and exported traces.
- UI-01: A separate graph-layout-prototype.html (owner explicitly requests HTML,
  overriding skill preference for production-route variants), three structurally
  different static layouts in app context. Shared illustrative graph/data/results;
  no graph actions, uploads, downloads or app/store dependencies. Only variant and
  language switching works. URL ?variant=A/B/C and bottom switcher; responsive.
- UI-02: Main build does not include the prototype entry. No production redesign
  until owner chooses. Record selection as pending; no browser automation.

Research: Times Edu linked article recommends worst acceptable lines but gives a
misleading half-difference between best and worst. Hachette/John Allum's Tools and
Inquiries guide (2023), pp.19–20, uses maximum distance from best to extreme values.
Use the latter explicitly, without claiming universal IA grading requirements.
https://times.edu.vn/en/ib/ib-physics-ia-structure/
https://www.hachettelearning.com/getmedia/033b7e9b-00f5-4815-ad6e-1c4119a9e6a6/ib-physics-tools-and-inquiries-guide.pdf

## Implementation evidence

Worst-fit calculation and uniform uncertainty inputs are implemented in the shared
workspace's Linear Fit controls, opt-in. The unchanged ordinary least-squares fit
is used for comparison; max/min signed gradients are computed from all rectangle
constraints, split into positive/negative slope branches. Bounds are solved around
translated coordinates; their intercept is chosen within the feasible interval.
Missing/invalid, infeasible and unbounded outcomes are explicit. X defaults to exact
only with the displayed explanation; Y must be supplied. No automatic propagation
of derivative uncertainties or nonlinear worst curves is claimed.

Shared figure adds distinct dotted/dash-dot max/min traces and forces uncertainty
bars visible while enabled. CSV includes entered uncertainties only in this mode.
No store, tracking logic, project schema or legacy renderer change was made here.
Five new numerical/figure tests pass; full suite 110 tests, lint, main/trial builds
and whitespace checks pass. The HTML prototype's inline JS passes syntax check;
its entry is not in the normal build. Actual iPad/PC interaction, saved graph
clipping/legends and layout appearance remain owner checks. No browser automated.

Owner review: `/graph-layout-prototype.html?variant=A` (also B/C), EN/ES toggle.
Functional feature: main app → Analysis → New graphing → Fit → Linear → Show maximum
and minimum gradients. Select or enter justified uncertainties. Confirm all three
exports contain the bounds; inspect negative gradients and a deliberately infeasible
case. Layout choice pending. No commit, push or deployment.

## Additional layout request

Owner requests three further static designs inspired by nPlot, with data table and
plot simultaneously visible. Add D/E/F to the existing comparison, preserving
A/B/C (explicitly requested six total overrides the prototype skill's usual cap).
D: spreadsheet, narrow model rail and graph; E: graph over a full-width data dock;
F: graph and worksheet in two balanced panes with results below. Same illustrative
six points, uncertainties and static selected point in each. No editing/fitting
functionality added; EN/ES and responsive layout. Main application unchanged.
