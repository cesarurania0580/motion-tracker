# Minimal graph lab — local experiment

Run from physics-app: `npm run dev -- --host 0.0.0.0 --port 9001 --strictPort`
Open http://localhost:9001/graph-minimal-prototype.html

Single layout, separate from the app and excluded from normal production inputs.
Paste directly into any cell (plain spreadsheet text or HTML tables). Supports
rectangular blocks, optional first-row headers, finite numbers and nonnegative
uncertainties. Import video CSV and choose source X/Y in the same reserved strip.
All imported columns remain editable in one table; X/Y selection and column visibility preserve edits and source values. Export the plotted data
as CSV or figure as PNG/SVG/PDF. Uses existing scientific figure/fitting engine.
Title, labels, units and model remain visible; no expanding editor panels.

Source is saved on disk. Test measurements are in memory: export CSV before closing.
This is intentionally not feature parity: no saved graph documents, transformations,
arbitrary added columns or multiple datasets. CSV imports support 2–32 columns, including all ten current video-export columns; named checkboxes control table visibility. Owner browser acceptance pending,
particularly LibreOffice / Google Docs clipboard, touch paste and small screens.

Uncertainty workflow: blank imported columns start hidden; zeros count as populated.
X/Y uncertainty toggles independently control error bars and plotted CSV uncertainties.
Enabling reveals/reuses or creates a linked blank column beside the quantity.
Fill all prompts for a nonnegative value and overwrites existing measurement rows
only. Hidden columns and disabled error bars never erase stored values. Existing-cell
pastes follow displayed column order. Browser acceptance remains owner-pending.
