# Throwaway functional graph layouts

Question: which arrangement makes data → explicit X/Y column selection → model →
figure easiest, while keeping advanced tools discoverable?

Run with the existing `npm run dev -- --host 0.0.0.0 --port 9001 --strictPort`.
Open `/graph-functional-prototype.html?variant=A` (also B or C, optional `lang=es`).
Current running dev server is reused. New HTML entry follows previous local bench
convention and is excluded from the normal production build inputs. Switcher is
DEV-only; no application store/autosave dependency. All editing is in memory.

A: table beside graph, fit below graph; recommended starting point.
B: horizontal command area, large figure with fit rail, table dock below.
C: notebook data then figure, sticky axes/fit sidebar.

All use real shared fitting, uncertainty transformations, bounds and exports. Enter
cells, rename columns, add/remove/omit rows; choose axes and error columns; upload
video CSV or paste numeric tables. Table initially hides uncertainty columns for
clarity, with a visible toggle. Existing source data persist across variant changes.
CSV exports plotted values only; reload clears the bench. This is not full feature
parity: repeat helper, graph-document persistence, multiple series and arbitrary
expressions are outside this layout experiment. No fake controls/models are offered.

Reference: https://www.noragulfa.com/nPlot/ — simultaneous data/model/figure, equations,
progressive disclosure. Do not copy its entire model list: use supported app models.

Owner verdict: PENDING. Evaluate the same tasks in each layout: load video CSV,
choose Time vs Y, choose Time vs Vy, edit one cell, choose fit, show uncertainties,
export and switch layouts. Check PC and iPad. After selection, integrate a reviewed
implementation and remove the discarded bench, preserving accepted capabilities.

Decision: owner chose A and approved integration into Independent worksheet only.
Production component integration is implemented (spec 21), not a promotion of this
throwaway component. B/C are retired alternatives. Keep this bench only as the
visual reference while owner checks the integrated version; remove after acceptance.
