# 011 — One graphing destination, two data sources

2026-10-24. Owner approved the navigation preview and requested implementation.

Replace the primary legacy Analysis destination with the shared Design F workspace.
Keep the logo first and name the two destinations Tracker / Data & Graphing.
Workspace-local source selection separates linked media measurements from the
independent worksheet. Both sources use the existing shared graph components.
Standalone graphing.html remains a separate entry. This supersedes ADR 009's opt-in
engine switch and ADR 010's new-tab-only access from the main app.

Mount each source lazily on first use and retain it thereafter under a hidden pane,
so navigation does not discard worksheet drafts or figure settings. Keep the tracker
canvas mounted as before. This retains some memory after visiting both sources;
Plotly's existing resize observer restores presentation after a hidden pane reopens.
Independent worksheet state does not enter the video project schema. A/B/COM linked
views reset on object change as before. Legacy AnalysisPanel remains unreferenced
for rollback; it is not a second advertised engine.

Global palette changes remain a proposal, not part of this navigation change.

## Revision after owner evaluation

Owner prefers the earlier interface for video-derived measurements. Restore
AnalysisPanel for the media source and remove its old Existing/New switch. Keep
independent graphing under the same navigation and optional standalone tab. Move
independent tools above the figure/table, with a closable settings panel; this
supersedes the default-F-for-media decision above. Physics/export implementations
remain unchanged. Source-specific interfaces are intentional: focused media analysis
versus general editable worksheet.
