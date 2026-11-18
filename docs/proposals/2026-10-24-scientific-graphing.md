# Proposal: scientific graphing for PhysTracker

Date: 2026-10-24. Status: proposal for owner review, not an implementation specification or release approval.

**Recommendation:** develop an approachable PhysTracker graph workspace using Plotly.js for interactive 2D rendering, a separate numerical analysis layer, and a shared figure definition for preview and export. Aim for publication-quality physics plots while retaining a short classroom workflow. Start with a small, reversible feasibility trial before replacing existing charts.

The target is comparable quality for ordinary 2D scientific figures, not complete feature equivalence with every Grace, gnuplot or Veusz capability. Library selection alone does not establish scientific accuracy, typography or device compatibility.

## Research and current application

I inspected nPlot's live desktop layout and its embedded manual. Its useful pattern combines a spreadsheet, visible model choices and a graph. It offers multiple sheets, optional uncertainty columns, point exclusion, transformations, tangent inspection and annotations. Its manual states that the displayed uncertainty bars are not used to weight fits, and axis scaling is largely automatic. Those choices should be reconsidered for PhysTracker's advanced analysis. No iPad or numerical validation of nPlot was performed. [nPlot and manual](https://www.noragulfa.com/nPlot/)

Grace provides a useful precedent for direct graph editing, residuals, constrained/weighted fitting and vector output. Veusz demonstrates configurable scientific figures with labels, multiple panels and export formats including PDF and SVG. Their desktop interfaces are useful references rather than interfaces to reproduce wholesale. [Grace features](https://plasmagate.weizmann.ac.il/Grace/), [Veusz features](https://veusz.github.io/features/)

The current code uses Recharts for motion and spectroscopy. `App.jsx` derives measurements and calls the existing fitting routines. `MotionChart.jsx` displays measured points and fitted curves; `AnalysisPanel.jsx` also owns SVG cloning, restyling and PNG generation. Current models include linear, quadratic and sinusoidal fits. The recent `ExportActions.jsx` flow provides persistent download/open links and has owner acceptance on iPad and PC.

A structural weakness for future growth is that figure appearance is partly defined by the chart and partly rewritten during export. The proposal replaces that duplication with a saved figure definition used by both views. Existing tracking, media coordinates and measurement calculations remain independent of the plotting renderer.

## Technology decision

The assessments below are engineering judgments for this application, informed by the linked documentation; they are not comparative performance benchmarks.

| Option | Strength | Main cost or limitation here | Proposed role |
|---|---|---|---|
| Plotly.js | Browser-oriented scientific charts, error bars, annotations and SVG export | Requires a custom student interface, separate fitting and a PDF conversion path; loading/performance must be measured | Preferred trial candidate |
| Current Recharts | Already integrated; supports SVG chart building | Rich scientific interaction, figure editing and export need substantial application work | Keep as migration baseline/fallback |
| Apache ECharts | Supports both SVG and Canvas rendering | Scientific fitting and the desired figure editor still require application code | Alternative if Plotly fails the trial |
| gnuplot | Strong scientific output, including SVG and Cairo PDF | Running its engine inside the web app needs runtime/server integration and an interaction adapter | Optional script/data export; possible later rendering backend |
| Veusz | Publication-oriented document model and Python embedding | Its documented desktop/Python integration is not a drop-in React renderer | Design reference and optional later desktop handoff |
| Grace | Established scientific editing and analysis model | Desktop X Window/Motif architecture | Workflow reference |

Plotly.js is a standalone JavaScript library under the MIT license. A self-hosted integration does not require adopting its commercial cloud products. Its documented facilities cover horizontal/vertical error bars and text/arrow annotations. We would build the fitting and table UI ourselves. [Plotly.js repository](https://github.com/plotly/plotly.js), [error bars](https://plotly.com/javascript/error-bars/), [annotations](https://plotly.com/javascript/text-and-annotations/)

ECharts' renderer choice is documented; its own guidance emphasizes testing against actual data volume and hardware. [ECharts SVG/Canvas guidance](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/)

gnuplot can generate SVG and PDF through different output terminals; PDF rendering uses Cairo/Pango. A browser port should not be assumed to include those same compiled backends and fonts. Embedding gnuplot remains technically plausible, but would require a separate feasibility exercise. A generated script plus CSV is a smaller first integration. [gnuplot SVG](https://gnuplot.sourceforge.net/docs/loc22928.html), [pdfcairo](https://www.gnuplot.info/docs_6.0/loc21917.html), [available terminals](https://gnuplot.sourceforge.net/docs/Terminals.html)

Veusz exposes a command/embedding API that could support a future export service or desktop project generator. Such a service would add hosting and data-transfer requirements to the current browser-local design. It is unnecessary for the proposed first release. [Veusz API](https://veusz.github.io/docs/manual/)

## Student experience

The ordinary workflow should be: **choose data → choose axes → optionally fit → export**.

Keep the graph prominent and use a compact panel with four labeled tabs: Data, Fit, Appearance and Export. On a tablet, present the same controls in an expandable panel instead of squeezing three desktop columns onto the screen. Controls must work by touch and keyboard, without relying on hover or modifier keys.

Basic controls should include:

- Recorded data from Object A, Object B and COM, with available calibrated units supplied automatically.
- X/Y variable selectors, sensible automatic ranges and a prominent Reset view action.
- A small set of models, equations and a clear indication of whether fitting succeeded.
- Editable title, labels and units, plus a few useful marker/line styles.
- Immediate report-ready output through a guided export panel.

Advanced options should be progressively revealed in the same workspace:

- Multiple compatible datasets and per-series styling; compare objects or experiments.
- Explicit minimum/maximum limits, linear/log scales and major/minor ticks.
- Fit range and reversible exclusions, with excluded points still identifiable.
- Residual plot, parameter estimates and uncertainty information when justified.
- Notes, arrows, reference lines, tangent/slope inspection and region integration.
- Later: aligned panels for position/velocity or spectrum/residual comparisons.

An optional manual table, spreadsheet paste and CSV import would let PhysTracker handle other lab experiments without requiring a video. This is proposed scope, not an existing requirement. Recorded measurements should be linked read-only by default; editing them should use the established tracking review workflow or an explicitly detached copy. Transformations should create derived columns and preserve the original data.

Suggested scientific models after the initial migration: proportional, inverse, inverse-square, power, exponential, Gaussian and damped oscillation. Group models by experiment and explain parameter meaning. Avoid presenting every model at once or automatically declaring a winner from R² alone. Custom equations belong in a later release with restricted expression parsing and clear domain errors.

## What publication quality means

Define observable acceptance criteria instead of relying on a library's default style:

1. Vector SVG output with sharp paths, properly clipped curves, readable symbols, and reproducible geometry.
2. PDF with preserved vectors and verified font handling. A PNG embedded in a PDF is not an acceptable substitute for vector PDF.
3. PNG output at a chosen physical width and pixel resolution; for example, 16 cm at 300 dpi needs approximately 1,890 pixels across. Pixel dimensions, rather than a DPI label alone, determine available detail.
4. A white report theme, controlled type sizes, marker sizes and line weights, sensible significant figures, Greek symbols, superscripts and subscripts.
5. Configurable figure dimensions, margins and legend placement, with no cropped labels or fit lines outside the plot.
6. Distinct marker/line combinations that remain understandable in grayscale.
7. Export preview that uses the same figure settings and shows the actual target layout.

Plotly's browser export API supports SVG and raster formats, but does not list PDF as a native image export. WebGL traces can contribute raster content inside SVG. Use SVG-based 2D scatter/line traces for the publication path and test any performance optimizations separately. [Plotly image export](https://plotly.com/javascript/static-image-export/)

Trial a browser SVG-to-PDF path using svg2pdf.js/jsPDF. The converter supports a subset of SVG and requires additional font registration for characters outside the basic set, so mathematical labels, clipping and fonts are explicit feasibility gates. If it fails those gates, retain SVG/PNG and evaluate another PDF path before advertising PDF support. [svg2pdf.js documentation](https://github.com/yWorks/svg2pdf.js/)

## Scientific analysis and saved figures

Keep numerical work separate from drawing. Initially, pass the existing fit results into the new renderer and verify that both renderers show identical values. Extend numerical methods in later, independently reviewed increments.

Displaying uncertainties and fitting with uncertainties are separate features. Weighted least squares requires a defined meaning for the supplied uncertainty and valid weights. X uncertainty requires an appropriate errors-in-variables method; ordinary Y-weighted fitting must not imply that it handles X errors. Parameter standard errors, confidence bands and prediction intervals must be labeled distinctly and shown only when their assumptions and degrees of freedom support them.

Derived velocity samples can share source measurements, introducing correlations. Their uncertainty treatment needs an explicit model rather than copying position error bars. Linearization changes units and can change the statistical error model; offer it as a transparent transformation, not a silent substitute for direct nonlinear fitting. Manual extreme-slope lines, if added for teaching, must be distinguished from formal confidence intervals.

A saved figure should store a versioned, renderer-independent definition: source dataset IDs, selected variables/units, transformations, exclusions, fit model/settings/results, axes, styles, annotations and export dimensions. Save this alongside existing project information, with defaults for old projects. The recorded measurements remain authoritative. Clearly distinguish linked figures that update with measurements from frozen snapshots intended for a report.

Load the plotting library only when Analysis needs it. Use a suitable partial/custom build and measure download size, memory and redraw time on real iPads. Plotly documents custom trace bundles. Keep long fitting work off the UI thread when measurements show it is necessary. Browser-local computation is the default; complete offline reload support would require separate asset-caching work. [Plotly custom bundles](https://github.com/plotly/plotly.js/blob/main/CUSTOM_BUNDLE.md)

## Delivery stages and acceptance gates

| Stage | Deliverable | Gate before proceeding |
|---|---|---|
| 1. Feasibility trial | An isolated graph page with current motion fits, error bars, a spectrum, labels and SVG/PNG/PDF samples | Owner accepts appearance; real iPad export and touch checks; PDF/font feasibility; measured performance |
| 2. Core integration | Recorded datasets, axis controls, reset view, existing fits, consistent report styles, approved export formats | Matches existing numerical results and saved projects; tracking and spectroscopy regression checks |
| 3. Rich analysis | Residuals, selected new models, validated weighting/uncertainty, reversible exclusions, annotations | Reference-data accuracy checks and classroom usability review for each increment |
| 4. General lab graphing | Optional manual/pasted/CSV datasets, multiple saved figures, aligned panels, gnuplot script/data export | Import validation, project round-trip checks and owner acceptance |

The first trial should include constant velocity, constant acceleration, oscillation and a spectrum. Test edge clipping, zero/negative/log-domain values, long labels, Greek symbols, dense data, repeated export, resize and rotation. Test record counts representative of actual lessons plus larger stress cases; set supported limits from measurements rather than promising arbitrary scale.

Validate new numerical methods using known synthetic data and applicable NIST reference datasets, comparing parameters and residuals with declared tolerances. NIST supplies datasets and certified reference results specifically for numerical accuracy assessment. [NIST StRD](https://www.nist.gov/itl/sed/products-services/statistical-reference-data-sets-strd)

Preserve the existing graph implementation during the trial behind a development switch. Exercise manual/automatic tracking, calibration, project loading, graph clipping, spectroscopy and iPad/PC exports before replacement. Reuse the recently accepted explicit download/open-link behavior. Release only after owner device acceptance; do not equate a passing build with browser acceptance.

The main engineering effort lies in data/figure state, scientific validation, PDF typography and touch interaction—not simply installing a chart package. The trial should determine realistic estimates for later stages. No subscription or plotting server is proposed for the initial browser implementation; normal hosting and maintenance remain.

## Recommended next decision

Approve Stage 1 only: prove a small Plotly-based scientific graph with the existing fit calculations, a proposed student-facing layout and representative export samples. If its output or iPad behavior is unsatisfactory, compare ECharts or a custom SVG path against the same acceptance set before migrating.

This research added only this proposal. The previously implemented welcome-window close button remains a separate local change. No graph implementation, dependency installation, commit or deployment was performed for this proposal.
