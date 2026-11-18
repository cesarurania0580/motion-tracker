# Functional minimal graphing layout bench

Owner requests working alternatives inspired by nPlot, especially explicit X/Y
column selection. Build three local layouts in an isolated HTML bench, following
the existing prototype-entry convention. This is deliberately separate from the
working graph module so unsaved experiments and accepted layouts remain untouched.

A Workbench: editable data left, graph right, compact fit/result region.
B Graph studio: top command ribbon, prominent graph, full-width data dock.
C Lab notebook: data then figure vertically, persistent narrow analysis sidebar.

All three use the same in-memory dataset and existing fit/figure/export functions.
Support multiple named columns, choose X/Y and corresponding uncertainties, edit,
add/remove/exclude rows, CSV/paste (including video export), standard fit equations,
worst linear bounds, reversible transforms, appearance and SVG/PNG/PDF/plotted CSV.
Keep core controls visible; advanced options use disclosure. EN/ES, compact numeric
cells and responsive stacking. Switch via URL ?variant=A/B/C and bottom switcher;
keyboard navigation must not intercept editing. Surface active axes/model/state.
No autosave or store dependency. No production entry or changes to Tracker.

Validation: existing tests/lint/build required; bundle the bench to a temporary
folder for syntax/build verification. Owner checks actual browser/device interactions.
No prototype-specific test scaffolding or browser automation. Verdict pending.

Implemented isolated `/graph-functional-prototype.html?variant=A/B/C` with common
in-memory state; layouts differ structurally and share production numerical/export
helpers. Initial example has time/position/velocity and matching uncertainties;
uncertainty columns can be revealed. Real CSV/paste, edits, axes, fits, bounds,
transforms, figure appearance, point selection, zoom/pan and exports are connected.
Source/axes/model counts are visible; a state disclosure supports review.

Validation: 135 existing tests pass, lint and normal main build pass. Separate Vite
bench build to /tmp succeeds. PC and Wi-Fi bench URLs return HTTP 200. Existing
bundle-size / browser-data / MediaInfo warnings remain. No browser automated and
no visual/device/export interaction acceptance claimed. Bench is not a normal
production build input. Owner verdict pending; no app redesign or deployment.

## Owner acceptance and integration

Owner selected Workbench A and explicitly approved applying it only to the
Independent worksheet tab. Implement a production workbench using shared figure,
fit, worksheet and import/export components, not the throwaway page. Data stays on
the left, axes above the graph, fit below it. Keep save/open, reasons for exclusions,
repeat summaries, transforms, uncertainties and scientific exports available through
progressive disclosure. Add persistent X/Y column choices and retain all imported
video columns for reselection; save column mapping with source data. Old graph files
must still open. Standalone /graphing.html retains its current layout, and video
AnalysisPanel/Tracker are unchanged. Test axes/uncertainty mapping, saved documents,
layout isolation and existing regressions. Local owner review before release.

Integration evidence: embedded StandaloneGraphing now selects Workbench layout;
media AnalysisPanel and standalone F layout stay in place. Worksheet is left, X/Y
selectors above the right-hand figure, result strip and fit tools below. Visible
Appearance/Export shortcuts keep those actions discoverable. Compact source cells,
optional uncertainty/reason columns and collapsible labels/advanced tools preserve
existing features. Multiple source quantities and associated error choices persist
in additive graph-document `sheet` metadata; all video columns survive import and
axis reselection. Old two/four-column files remain compatible. Generic 3/5–12-column
tables can be imported, and extra columns can be created. Units follow chosen axes.

139 tests pass (including actual upload → axes reselection → saved-source checks,
uncertainty remapping without loss, old documents, layout isolation and tracking
regressions). Lint, main and trial builds pass with existing warnings. No browser
automation, commit or deployment. Owner must review PC/iPad layout, focus, graph
exports and source retention. Prototype remains a reference during acceptance;
A is selected, B/C are not candidates for integration.

## Workbench clarity revision

Owner requests named per-column visibility checkboxes, less space above the table,
and removal of the top-right standalone-tool link. Add compact named checkboxes
above the table; hiding affects only table presentation and associated uncertainty
cells, not source values, axes, fits, CSV or graph documents. Keep visibility through
axis/source navigation within the session, resetting for a newly loaded dataset.
Move file/edit/advanced controls to a wrapping toolbar above the whole workbench;
advanced panels expand only on demand. Table starts with column controls and data.
Remove the standalone navigation link from GraphingPanel (keep existing standalone
URL accessible to old bookmarks). Preserve EN/ES and touch/focus affordances.

Clarity revision evidence: named quantity visibility controls are above the table,
with independent existing uncertainty/reason toggles. Visibility state is owned by
the worksheet parent so changing graph axes does not restore hidden table columns.
Controls now form a compact wrapping full-workspace toolbar; labels/paste/advanced
sections expand only on request. Removed the introductory subtitle in embedded mode
and the GraphingPanel standalone link. Original standalone URL remains available.
141 tests pass including hide/show cell rendering without data/axes mutation,
visibility retention, toolbar placement and link removal. Lint/main and trial
builds pass. No browser automation or deployment; owner PC/iPad review pending.

## Minimal bench revision — 2026-10-26

Owner requests a separate, functional single-screen experiment: direct spreadsheet
paste into cells, visible title/axis labels/units, compact import/export and model
selection. No graph-document controls, expanding panels or production UI changes.
Use existing fitting/figure/export engine. Preserve clipboard rectangular placement,
reject invalid/negative uncertainties atomically, support video CSV axis selection.
Acceptance: owner tests LibreOffice/Docs paste, editing, labels, fits, exports and
small-screen layout later. Prototype data are in memory; source survives restart.

Minimal bench implementation: `/graph-minimal-prototype.html`, dedicated React entry
and styles, shared scientific engine. Direct cell paste supports HTML tables/TSV,
optional headers and atomic block validation. Four editable columns; video CSV
imports expose compact source-axis selectors. No production component changes.
Validation: 141/141 tests passed; ESLint passed; production build and separate
minimal-entry build passed. Existing bundle-size/MediaInfo warnings remain.
Browser appearance, clipboard compatibility and touch export acceptance pending owner.

### Minimal bench column visibility

Add four compact, initially checked X/Y/±ΔX/±ΔY checkboxes above the table.
Visibility is presentation-only: preserve underlying column indices for editing and
rectangular paste, all data, fits and exports. Allow all columns to be hidden and
restored. Keep controls accessible, localized and wrapping on narrow screens.
Acceptance: toggling each column hides header/cells and restores existing values;
no change to graph calculations or exports. Owner browser check pending.

Implemented visibility controls using independent presentation state and original
column indices. Validation: 141 existing tests, lint and both production and
separate minimal bench builds pass. Owner visual acceptance remains pending.

### Minimal bench full CSV table correction

Owner supplied a current ten-column video CSV. Reproduction: parser retains all
fields but the minimal bench projects them to four table columns, and editing then
discards the source selector. Fix by keeping one complete editable table, dynamic
column names/visibility, and separate X/Y selections with linked uncertainties.
Preserve blank uncertainties and original numeric strings; axis changes and hiding
must not discard source columns or overwrite edits. Generic numeric CSV and direct
paste remain supported. Verify supplied file and regression fixtures without browser.

Full-column correction evidence: supplied `motion_data_A (2).csv` preserves all ten
headers and fourteen rows byte-for-byte at the parsed cell level, including blank
velocity/time uncertainties. Time versus X/Y/Vx/Vy each produces fourteen points.
Regression captures former four-column projection; tests cover full precision,
wide tables, malformed input, uncertainty mapping and edits across axis switches.
145 tests pass; lint, production build and dedicated minimal bench build pass.
Browser checks remain owner-pending. Existing production graph UI is unchanged.

### Minimal uncertainty workflow

Approved: hide wholly blank columns on import (zero is populated), retain all data
and visibility checkboxes. X/Y uncertainty toggles reuse or create a linked empty
column, reveal it beside its quantity, and independently enable error bars/exports.
Imported populated uncertainty columns enable automatically. Toggle off preserves
values. Fill-all accepts finite nonnegative values for existing measurement rows,
leaves trailing empty rows blank, and cancels without changes. EN/ES parity;
regressions cover visibility, creation/reuse, axis mapping, fill and preservation.

Implementation evidence: import visibility is based on nonblank cells, not numeric
truthiness, so zero remains visible. Uncertainty enablement is stored per quantity;
axis changes retain that choice. Linked columns are reused or appended without
invented measurements; presentation orders them beside the associated quantity.
Paste into existing cells follows visible column order. Whole-sheet import retains
source order and strings. Fill-all validates before mutation, skips blank rows and
uses a compact native prompt that states existing values will be replaced.
148 tests pass; lint, production build and isolated minimal build pass. Owner
browser/touch acceptance remains pending; current production app unchanged.

### Minimal bench typography polish

Approved: locally bundled Inter UI font, 14px controls/labels, 13px tabular table
numbers, secondary text at least 12px with stronger contrast, and slightly taller
inputs/rows. Keep column widths and scientific graph/export fonts unchanged.
Scope is the standalone minimal test bench only. Owner visual acceptance pending.

Typography implemented with locally bundled Inter variable font and its license;
no external font service required. UI uses 14px labels/controls, 13px tabular numeric
cells and 12px secondary text; 40px inputs and 36px table rows. Scientific figure
settings are unchanged. 148 tests, lint, production and minimal-entry builds pass.
Visual acceptance pending owner; no browser automation or deployment.

### Local app adoption

Owner approved minimal worksheet in local app. Route Independent worksheet to the
approved shared minimal component; suppress test header, inherit app language and
retain draft when navigating. Preserve video/image AnalysisPanel and copy-to-sheet
transfer (labels, units, uncertainties). Keep standalone bench and older graphing
URL available. Scope: local only, no commit/push/deploy. Scope CSS to worksheet.

Local adoption implemented via shared minimal component with embedded/language/seed
props, preserving RetainedPane navigation lifecycle and original AnalysisPanel.
Regression verifies Spanish embedded UI, absence of duplicate header and transferred
numeric strings, labels, units and enabled uncertainties. Owner visual review pending.
Validation: 149 tests, lint, production build and dedicated bench build pass.

### Advanced graphing transfer, table copy and models — 2026-10-27

Rename embedded independent worksheet Advanced graphing (EN/ES). Copy active object's
full measured time/position/velocity table plus available uncertainty columns directly
from video analysis; preserve source and units, omit virtual samples, and select the
current plotted axes. Transfer is a snapshot, not a live edit of tracking measurements.
Confirm replacement of existing advanced worksheet. Keep familiar video fits unchanged.

Add optional cell-selection mode, rectangular selection by pointer/Shift+arrows,
Ctrl/Cmd+C and Copy cells action yielding plain TSV in visible column order, including
blank cells. Native single-cell text editing/copy remains available outside selection
mode. No headers in selected-cell copy. Handle clipboard failures explicitly.

Advanced-only models: power y=A x^B, exponential y=A exp(Bx), logarithmic y=A ln(x)+B.
Power/exponential use linear least squares in log(y), disclose that fit method and
require positive y (and positive x for power). Logarithmic requires positive x;
y can have either sign. No silent dropping of out-of-domain data. Report RMSE/R² in
original y units; invalid-domain samples in preview/export must produce gaps rather
than infinities. All prior fit options retain their implementation.

Implemented full active-object transfer as an isolated table seed, bilingual advanced
navigation and optional selection/copy. Advanced models reside in a separate adapter;
legacy model registry and algorithms unchanged. Log-fit method uses paper-relative
figure note so it remains visible under manual axis ranges. Regression coverage:
known inverse-square/decay/log coefficients, domain/degeneracy, original-scale metrics,
clipped finite curve gaps, source isolation/units, actual transfer button, actual
selection/clipboard handlers and actual fit-selector/domain-error rendering.
159 tests, lint and production build pass; isolated bench build also passes.
Browser clipboard/touch, visual fit/export and end-to-end video review pending owner.

### Fit control sizing polish

Owner screenshot shows an excessively stretched fit selector. Keep visible keyboard
focus, cap the model field at 28rem, allow shrinking within the available panel and
wrap neighbouring controls. Align controls with the selector rather than its label.
No fitting or data changes. Browser layout acceptance remains owner-pending.
Fit field now uses a bounded flexible basis with min-width:0 and width-constrained
select; adjacent checkbox/button align to control baseline and wrap. Focus retained.
159 tests, lint and production build pass; owner visual review pending.

### Spreadsheet interaction and themed fill dialog

Approved: retain absolute uncertainties only. Replace selection mode with click,
drag/Shift-click range selection; Enter/double-click edit; paste a scalar across the
selection, block paste from its top-left; clear and undo table changes. Hidden
columns untouched; uncertainty values finite/nonnegative; invalid blocks rejected
atomically. Add Copy, Fill selection, Clear and Undo actions for touch users.
Replace native fill prompt with themed accessible dialog, selected cells or whole
uncertainty column, label/unit context, Cancel/Apply and explicit validation.
Keep CSV import/header handling and all graph/data behavior intact.

Implemented shared EditableTable with single selection/edit model, parent-level paste
handler and validated pure pasteCells operation. Scalar broadcast, rectangular block
paste, clearing, Copy/Fill/Edit buttons and up to 40 cell-edit undo snapshots are
supported. Imported datasets/schema changes reset history. Hidden columns excluded.
Table cells use pointer range selection and keyboard selection; Edit cell supports
touch without requiring double-click. Whole header tables still import at first cell.
Absolute-only fill dialog includes focus management/trap, Escape/Cancel, row-scope
choice and inline validation. No percentage option or sensor assumption added.
164 tests, lint and build pass. Tests cover actual selection-paste-copy-undo handlers,
editing, fill/undo, dialog validation/EN/ES, growth, blanks and atomic invalid blocks.
Browser PC/iPad clipboard, editing and dialog visual acceptance pending owner.

### Scientific table and equation typography

Approved: decimal-separator alignment without rounding/adding zeros; preserve raw
editing/copy/export values, blanks, signs and scientific notation. Keep Inter for
UI/table numbers. Bundle KaTeX and math fonts locally for model/result equations;
model dropdown shows localized model names and a typeset equation below. Generate
TeX only from controlled model templates and numeric parameters. No fit algorithm
changes. Validate decimal parsing and all seven model/result renderings.

Implemented local KaTeX 0.19.1 with bundled math fonts, HTML+MathML output and trusted
commands disabled. Localized model-name selector, model equation, fitted coefficients,
RMSE/R² and worst-fit gradient results use controlled TeX templates. Inter UI intact.
Numeric view aligns integer/decimal/fraction/exponent segments; original cell input
strings stay untouched for editing, clipboard and CSV. Column width accommodates
precision rather than rounding or inventing zeros. Non-numeric/blank cells retain
normal editing. KaTeX license included under public/licenses.
167 tests, lint and production build pass. Coverage includes number reconstruction,
scientific notation, source/copy fidelity, all model/result TeX rendering and unchanged
fit values. Owner PC/iPad visual acceptance pending; no browser automation or deploy.
