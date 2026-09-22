# Phase 3 — tracking review and recovery

Status: first point-review/edit/undo increment tested and accepted by the owner.
Recovery/resume, recorded quality and keyframes are deferred at the owner's request;
autotracking is working well and those improvements will be revisited if needed.

## First increment: review one measurement

- REC-01: Each A/B data-table row has a keyboard/touch-accessible review action.
  Selecting it cancels automatic work, pauses playback, clears competing canvas
  tools, and seeks to its original media timestamp (not the zero-adjusted table
  time). Selection alone never changes measurements. COM remains read-only.
- REC-02: After the selected frame is decoded, Correct point arms one canvas
  click/tap. Replace only the selected point's native x/y; preserve time, identity,
  other measurements, calibration and other objects. Cancel/Escape leaves it intact.
- REC-03: Delete point removes only the selected measurement. Undo edit restores
  corrections/deletions in reverse order for that object (up to 50 edits). This
  is separate from the existing remove-last-point transport action. Recording or
  legacy dragging invalidates that object's edit history to avoid stale restores.
  Project/media replacement and reset clear history; mass changes preserve mass.
- REC-04: View/object/frame/tool changes cancel pending review/correction and seek.
  Failed or out-of-range seeks do not enable correction. Late automatic frames
  and stale review requests cannot write a measurement. Review needs loaded media.
- REC-05: Graphs and derived COM use the updated point series. Do not mutate source
  point order while deriving graphs. Support legacy points with duplicate/missing
  ids by mapping table rows to their exact source index.
- REC-06: EN/ES, visible selection and accessible actions. Review/history are
  session state, excluded from saved project data; project schema is unchanged.

## Remaining Phase 3 scope

Per-frame recorded quality, explicit resume policy for later measurements and
keyframes require subsequent increments. Existing reselect/run remains available;
this increment does not claim keyframe management or completion of Phase 3.

## Validation

Store tests for exact-point edits, undo, A/B isolation, duplicate ids, stale history,
context reset and unchanged calibration. Existing cancellation/measurement tests,
lint and production build. Owner browser checks: select unsorted/zero-time rows;
correct/delete/undo in A and B; verify graphs/COM; seek failure, rapid selection,
Escape, tool switches, manual/automatic recording, touch and EN/ES. Browser checks
remain pending until reported by the owner.

## Code validation — 2026-09-16

48 tests pass, including six new review/history/translation tests. Lint, build
and diff whitespace checks pass. Existing seek cancellation tests also pass.
Build retains the existing Browserslist-age and bundle-size warnings.
No browser automation or visual/interaction acceptance is claimed.

Implementation follows ADR 004. Graph calculations now sort a copy and preserve
source indices; they no longer reorder the store's arrays in place. Graph/COM
recalculation and actual frame display still need owner browser acceptance.
