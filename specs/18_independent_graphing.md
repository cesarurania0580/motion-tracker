# Design F and independent graphing workspace

Owner chose F, emphasized graphing without video, requested standard equations,
and authorized implementation.

- GF-01: Shared graph workspace adopts F: graph left, worksheet right, result band
  below and Fit/Appearance/Export controls beneath. Always show data with graph.
  Graph/row selection is linked. Keep existing video renderer and tracking intact.
- GF-02: Standard equations accompany validated linear, quadratic and sinusoidal
  model choices. Map displayed A/B and ω/φ to existing fit parameters; never change
  numerical routines or advertise unimplemented models.
- GF-03: Standalone /graphing.html works with no video/store dependencies. Add links
  from welcome/header in a new tab so tracked work stays open. Enter/edit rows,
  paste TSV/CSV or import CSV, name axes and units, and provide per-row uncertainties.
  Missing/invalid entries must not turn into zeros. Bound input size and show errors.
- GF-04: Save/open a separate versioned graph document including raw rows, labels,
  model and presentation settings. Validate before replacing current data. Keep
  this schema separate from video project files. Reuse Blob export links for iPad.
- GF-05: Shared fit/worst-fit/export work on independent rows as well as video data.
  Do not guess physical dimensions from arbitrary units; display transparent unit
  ratios. Preserve error bars and honest empty/invalid-data states. EN/ES parity.
- GF-06: Test input validation, CSV parsing, document round-trip, symbol mapping,
  numeric parity and app links. Run full suite/lint/main and trial builds. Owner
  checks F layout, PC/iPad input, graph/table selection, save/open and all exports.

No new regression models, automatic unit conversions, multi-sheet documents,
server storage or deployment. Main build includes graphing entry; static prototypes
stay excluded. User layout choice supersedes previous pending design decision.

## Implementation evidence

Shared F layout, persistent-visible worksheet with paginated rows, linked selection,
standard equation choices and parameter-symbol mapping are implemented. Standalone
entry includes editable rows, paste/CSV, metadata, versioned graph save/open and
shared SVG/PNG/PDF/plotted CSV actions. Graph documents are independent of video
projects; data entry and saved states are validated. Nothing is automatically saved.

115 tests, lint, main and trial builds and whitespace checks pass. The main build
contains graphing.html; prototypes remain excluded. HTTP 200 confirmed for local and
Wi-Fi standalone page and source module. No browser automation performed.
Owner checks: no-video entry, type/paste/import X/Y and uncertainties, choose each
model and compare parameters, worst-fit bounds, point/table selection across pages,
save/reopen graph document, all exports, EN/ES and PC/iPad layout. Also recheck video
Analysis → New graphing and existing tracking. No commit/push/deployment.

## Navigation consolidation preview

Owner reports graphing entry crowds the logo and asks how replacing the old graph
window would look. Prepare visual-only graph-integration-prototype.html using F,
actual logo, Tracker / Data & Graphing navigation, and a workspace-local data source
choice. No changes to working navigation or removal of legacy graphs until review.
Preview two contexts: video-derived read-only measurements and an independent sheet.

## Approved navigation implementation

Owner approved replacing the old graph window with Design F. GF-07: logo first,
Tracker / Data & Graphing primary navigation, no Existing/New engine switch.
The graph workspace provides media measurements and independent worksheet sources;
no media is required to enter it. Keep standalone /graphing.html available.
GF-08: switching source or returning to Tracker must retain the independent draft
and graph settings during the session. Tracking canvas stays mounted. Preserve
image spectroscopy, A/B/COM selection, and existing physics calculations.
Welcome offers an in-app entry. Keep legacy renderer code for rollback only.
Validate entry/navigation, EN/ES, worksheet retention, full tests/lint/builds;
PC/iPad browser acceptance remains owner-performed. Palette work is a recommendation
only, pending owner choice; no global recoloring in this increment.

GF-07/08 implementation evidence: 117 tests pass, including in-app no-media entry
without replacing measurements and retaining an already visited pane's children.
Lint/main build/trial build pass; local and Wi-Fi root URLs respond HTTP 200.
Manual worksheet draft/figure retention, responsive layout, PC/iPad tracking and
exports remain pending. No global palette changes or release performed.

## Owner revision: familiar media analysis and visible independent tools

Restore legacy AnalysisPanel as the media-measurement source; retain independent
Design F, no-media entry, same-window switching, and optional standalone tab.
Remove the Existing/New engine choice from media analysis. Keep legacy export and
spectroscopy behavior and calculations. Independent metadata says X label / Y label
(Etiqueta X / Etiqueta Y). Move independent Fit/Appearance/Export/Data buttons above
the figure/table, opening a closable settings panel there. Start with panel closed
so the figure and data are primary. Preserve data/settings through navigation.
Do not recolor the app in this revision. Browser acceptance remains owner-performed.

Revision validation: 119 tests pass, lint and main/trial builds pass (existing bundle
size warnings). Tests cover familiar analysis/export controls, independent tool
placement, label wording, and opening/closing tools without resetting the fit.
Owner PC/iPad visual acceptance remains pending; no deployment or palette change.

## Owner revision: Design A for the Independent worksheet tab

Apply the approved A structure only to the embedded independent worksheet: wide
figure on the left, Fit/Appearance/Export/Data inspector on the right, Fit initially
open, and a compact results strip below the figure. Keep editable data below the
figure/results so entry and imports remain available. Stack responsively on narrow
screens. Preserve the media AnalysisPanel, standalone entry layout, all numerical
routines, exports, graph document format and draft retention. No palette changes.

Design A validation: 119 tests, lint and both builds pass. SSR checks distinguish
embedded A (Fit open, worksheet available) from standalone F. Browser layout checks
remain pending. No media-analysis changes or release.

## Compact worksheet and palette test bench

Owner requests narrower independent worksheet cells and ±ΔX / ±ΔY uncertainty
notation. Keep editable numeric columns compact without shrinking touch targets;
wrap long headings, allow horizontal scrolling, preserve precision and data format.
Use matching uncertainty notation in entry help and uniform uncertainty controls.
Prepare a separate HTML prototype comparing three light-blue app-wide palettes in
Tracker, media Analysis, and independent Design A contexts. Retain logo, object
colors and semantic status accents. Palette changes are preview-only; no global
recoloring or deployment. English/Spanish parity, URL-selectable palettes and views.

Compact worksheet / palette-bench evidence: 119 existing tests pass, lint and both
builds pass; whitespace checks pass. Prototype inline JavaScript parses. PC and Wi-Fi
palette-prototype.html return HTTP 200. Numeric columns use 104px cells with 88px
inputs; row controls retain 44px targets and long headings wrap. Independent entry
help and shared uncertainty labels use ±ΔX/±ΔY. Three preview-only blue palettes,
three screen contexts, EN/ES and sample dialog are implemented. Browser visual
acceptance is pending. Prototype is excluded from production build entry points.

## Dark palette comparison

Owner selected Classic blue for light mode and requests dark alternatives. Extend
only the disposable palette bench with three dark variants, a light/dark comparison
selector, and dark graph previews. Preserve access to all prior light variants,
mark Classic blue as selected light direction. Actual app themes remain unchanged.

## Accepted Workbench revision

Owner selected functional Workbench A (spec 21), superseding the earlier embedded
Design A arrangement. Independent tab now places data left, graph right, explicit
persistent axes above and fit below. Standalone F and familiar media analysis stay.
All prior tools remain available. See spec 21 for schema extension and 139-test
validation; browser acceptance is pending.
