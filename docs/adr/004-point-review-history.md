# Point review and session edit history

The first Phase 3 increment uses explicit table selection and a single armed
correction click, separate from manual acquisition and legacy dragging.
The review hook cancels automatic work before seeking, owns an abortable seek,
and disarms review on navigation/tool/context changes. It waits for seek completion
before enabling correction/deletion. It uses original timestamps and source indices,
not displayed zero-adjusted time or legacy ids (which may repeat).

The store owns bounded per-object before/after point-array history for explicit
review corrections/deletions. Undo restores only points, preserving mass and
calibration. Point identity and current-array checks reject stale writes/restores.
Acquisition/legacy dragging clears that object's edit history; media/project reset
clears history. History and selection are transient and are not serialized.

This deliberately does not yet unify legacy drag/delete or remove-last-point with
review undo. Full acquisition undo, per-frame quality and keyframe/resume policy
are later increments. The UI names the new action Undo edit to distinguish it.
