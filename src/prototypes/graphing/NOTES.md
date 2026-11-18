# Graphing trial — Stage 1

Question: can an SVG-based Plotly figure, existing PhysTracker fitting, and local
SVG/PNG/vector-PDF export provide the proposed scientific graphing experience?
Owner approved the specific isolated trial on 2026-10-24. This is a feasibility
implementation, not a set of alternative layouts or a production replacement.

Run from the physics-app directory:

    npm run dev:graph-trial

Open http://localhost:9001/graph-trial.html. On the owner's current Wi-Fi network,
open http://192.168.100.6:9001/graph-trial.html. The server binds to all interfaces;
this address may change if the PC obtains a different DHCP address.

Build separately with `npm run build:graph-trial`; output is dist-graph-trial,
which is ignored. The normal build remains the existing main app. The server
also serves the main app at / for convenience. Neither trial entry nor trial
code imports App, useStore or project persistence. Its state is memory-only.

## Implemented

- Constant velocity, constant acceleration, oscillation and synthetic emission
  spectrum samples, plus an optional 5,001-point spectrum stress case.
- Existing fitCurve routines and parameter-unit helpers; a table, direct point
  selection, model choices, RMSE and R². No new fitted scientific model.
- Editable plain-text labels, symbols, colour, font/point sizes, grid, legend,
  uncertainty display, annotations and auto/manual axes with pan/zoom/reset.
- One figure definition for fixed paper dimensions in preview/export. The preview
  scales the paper to the available screen space; device interaction needs review.
- SVG with embedded regular/bold Liberation Sans fonts, scaled PNG, and a trial
  vector PDF path using svg2pdf/jsPDF and registered font data. No raster PDF fallback.
- Existing ExportActions download/open links, EN/ES text, keyboard-operable tabs,
  responsive controls, and measured browser draw/export timings when exercised.

Pinned dependencies: plotly.js-basic-dist-min 4.1.2, jspdf 4.2.1, svg2pdf.js 2.8.1
(check package.json for authoritative versions). Liberation Sans font binaries
are bundled unmodified with their SIL OFL license in src/components/graphing/fonts/LICENSE.

## Evidence and limits

Code-level validation: 99 tests pass, including five new numerical/figure tests;
all existing tracking/export/project tests pass. Lint, main build and trial build
pass. The main app retains assets index-Jcituzq9.js and index-DmQK2J9A.css from
before this trial. No browser acceptance is inferred from these results.

Trial build measurement: Plotly's separate chunk is approximately 1.21 MB / 404 KB
gzip; the initial trial JS is approximately 237 KB / 77 KB gzip. The two uncompressed
font files total approximately 825 KB. PDF/conversion libraries are dynamically
imported on PDF export. These are build sizes, not measured iPad performance.

No local browser automation was performed under the repository's owner-testing
rule. Saved PDF font fidelity, SVG portability, clipping, pixel output and browser
timing are pending actual browser/device checks. PNG target pixel counts shown in
the UI are approximate: rounding the 96-dpi layout can change output by a pixel.
The trial reports actual exported byte sizes and elapsed times after export.

The dense sample is a stress fixture, not a claim of supported performance.
Fonts currently use full TTF files; investigate size reduction only after the
feasibility decision. Offline reload, imported data, weighted fitting, logarithmic
axes, residual panels and project integration are not implemented in this stage.
Error bars are display-only and do not imply statistical confidence intervals.

## Owner acceptance checklist

1. Open each sample on PC and iPad. Inspect axis labels, symbols, fitted curves and
   equation/parameter text. Switch EN/ES and rotate the iPad.
2. Select points, pan and zoom, then Reset view. Confirm the selected coordinates
   correspond to the intended point, including when paper is scaled on a tablet.
3. In Appearance, select Manual ranges and restrict the lower Y boundary of the
   constant-velocity example (for example x: 0–3, y: −4–0). Check curve clipping.
4. Edit labels to include λ, α, m/s², negative numbers and a reasonably long title.
   Export SVG, PNG and PDF. Open each file and compare positions, labels and clipping.
   Confirm the PDF remains sharp when enlarged and includes all special characters.
5. Try 16 × 10 cm and 20 × 13 cm, and repeat exports. On iPad, use the persistent
   Save file/Open file links if the first automatic download does not start.
6. Select the spectrum's dense-data option and note Last draw/Last export readings.
   Report the iPad model/browser alongside timings rather than treating PC results
   as representative of the iPad.

Verdict: awaiting owner review. After the trial answers the question, either absorb
its validated design into a separately reviewed integration or remove it. Do not
ship this trial directly as the replacement Analysis workspace.

## Stage 2 follow-up

Owner accepted the Stage 1 preview and exported files on PC/iPad. The shared
workspace, renderer, exports, fonts and scoped stylesheet now live in
`src/components/graphing/`; this sample entry still runs independently. Stage 2
adds a separately selectable real-data workspace in Analysis. The historical
asset hashes above describe the pre-integration build, not the current main build.
See spec 16 and ADR 009 for integration boundaries and pending owner checks.
