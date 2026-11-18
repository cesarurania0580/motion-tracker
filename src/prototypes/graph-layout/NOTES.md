# Graph layout prototype

Question: which distribution of graph, controls and results suits PhysTracker?
Owner explicitly requested a separate HTML test with no graph functionality.
Standalone root entry follows graph-trial.html; no imports of the real app.

Run `npm run dev -- --host 0.0.0.0 --port 9001` and open
`/graph-layout-prototype.html?variant=A` (or B/C). Reuse the running server on 9001.
Only the layout switcher and EN/ES toggle work. Arrow keys cycle layouts. Every
layout uses the same static illustrative position-time data and linear bounds.

A: large canvas plus right inspector; axis controls above the graph.
B: full-width graph with command strip and three lower control sections.
C: guided notebook with left task progression, figure/caption and inline results.

The page is excluded from the normal Vite build, including its switcher. It has
no storage, graph processing, exports, network libraries or production styles.
Main app redesign is not part of this change. No browser automation performed.
Owner verdict: pending. Absorb the selected design and remove this comparison
once the distribution is approved. Review on PC and iPad in portrait/landscape.

## Additional simultaneous data/graph layouts

Owner requested three more options inspired by nPlot's worksheet/graph workflow.
D: spreadsheet workbench, with a narrow fit-model rail between data and graph.
E: broad graph above a full-width data dock, with compact interpretation at right.
F: balanced figure/worksheet panes, with an interpretation/export-size band below.

All six remain selectable at ?variant=A/B/C/D/E/F. D–F display the same six rows as
the graph, including uncertainties. The static third-row selection corresponds to
the ring around t=2.00 s, y=2.80 m. It is a visual illustration, not interaction.
EN/ES, tablet arrangements and phone stacking are included; owner appearance review
remains pending. nPlot reference reviewed: https://www.noragulfa.com/nPlot/ .
No new production graph features or dependencies were added for this follow-up.

## Decision

Owner selected F: simultaneous graph and worksheet, with results beneath. The real
shared workspace now adopts this structure; standalone graphing is at /graphing.html.
The owner also requested standard equations beside model names. Keep these mockups
only for implementation comparison until PC/iPad acceptance, then remove them.

## Integrated navigation preview

Owner asked whether to replace the old graph view and reported the independent
entry crowds the logo. graph-integration-prototype.html shows the actual logo with
Tracker / Data & Graphing navigation, F layout and a local data-source selector.
Video and independent modes can be previewed; values and controls are illustrative.
The working header, renderer switch and standalone route are unchanged. Proposed
consolidation requires owner acceptance; retain standalone direct access. The
prototype entry is excluded from the main build. Syntax, 115 tests, lint and build
pass; local/Wi-Fi page returns HTTP 200. Visual appearance remains owner-reviewed.
