# ADR 010 — Independent graph documents and approved Design F

Owner selected design F and requested standard model equations. Implemented locally;
PC/iPad acceptance pending.

The shared GraphWorkspace now presents a figure and worksheet together, with results
and tools below. Video-derived rows remain read-only. Standalone graphing.html uses
an independent component with editable raw string cells; no tracker store, media
or project-file imports. Welcome/header links open another tab to preserve video
work. Main Vite build explicitly includes index.html and graphing.html only, leaving
prototype HTML pages outside the release output.

Raw cells preserve drafts; evaluation omits invalid/incomplete nonempty rows and
reports their count. Empty strings never become numeric zero. Up to 2,000 rows are
accepted. Paste/file import supports 2 or 4 columns (X,Y,±X,±Y), optional headers,
quotes, TSV/CSV/semicolon delimiters and decimal points. Imports validate atomically
before replacing the worksheet. Imported header labels/parenthesized units populate
axis metadata. No expression evaluation, decimal-comma detection or unit conversion.

The separate version-1 phystracker-graph JSON document contains axis metadata, raw
rows and shared graph settings. It does not modify the video project schema. Save
uses existing explicit download/open links. No autosave or server storage; users
must save the graph document to retain work. CSV saves plotted values only. Graph
selection is preview-only and is excluded from exported figures.

Only validated linear/quadratic/sinusoidal routines are exposed. Presentation maps
linear m,b to A,B and sinusoidal B,C to ω,φ. Existing numerical objects and worst-fit
comparison continue using their original parameter keys. Arbitrary user units are
shown as unsimplified ratios (e.g. s²/(m)); dimensional equivalence is not guessed.

Five new tests cover draft/CSV parsing, document validation/round-trip, parameter
notation and standalone SSR. Existing tracking, fitting, export and welcome tests
still pass (115 total); lint, main/trial builds pass. Actual rendering, touch typing,
row/point selection, file saving/reopening and graph exports await owner testing.
