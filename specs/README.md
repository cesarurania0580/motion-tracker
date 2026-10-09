# Specification index and workflow

1. Spectroscopy: `01_spectroscopy_line_profile.md`
2. Wavelength calibration: `02_wavelength_snap_calibration.md`
3. Center of mass: `03_center_of_mass_tracking.md`
4. Core tracking/calibration: `04_core_tracker_calibration.md`
5. Measurement overlays: `05_protractor_tape_measure.md`
6. Regression: `06_least_squares_regression.md`
7. Architecture history: `07_architectural_decomposition.md`
8. Automatic tracking: `08_autotracking_template_matching.md`
9. Student experience roadmap and development priorities: `09_student_experience_roadmap.md`
10. Guided workflow and interface consistency: `10_guided_workflow.md`
11. Approachable automatic-tracking controls: `11_autotracking_controls.md`
12. Tracking review and recovery: `12_tracking_review_recovery.md`
13. Analysis layout and coordinates-only tooltips: `13_analysis_polish.md`
14. Agreed Controls / Data / Tools sidebar and focused subviews: `14_sidebar_task_tabs.md`

## Workflow

Brief → numbered spec (requirements, boundaries, acceptance IDs) → design/ADR →
implementation → automated and manual validation → owner acceptance → release.
A prototype success does not imply integration acceptance. Each feature's test
record identifies actual evidence and unchecked scenarios. Keep specs beside code
in Git. Update requirements before implementing a changed behavior. Use small
feature branches and preserve a recoverable baseline before risky integration.

Current status (2026-09-20): Controls / Data / Tools is implemented locally,
including inline FPS confirmation, single-open Tools accordions and visible Clear
data. Automatic controls use compact cyan sliders, inline Fine-tuning and shared
help boxes; the owner reports the corrected hover behavior is working. Broader
sidebar/device/accessibility acceptance is not claimed.

Spectroscopy now follows Calibrate wavelengths → Adjust sampling line → Explore
spectrum. It includes explicit on-image placement instructions, draggable reference
markers, an automatically placed adjustable line, visible width and next-step cues.
Color-channel selection remains in Analysis; its sidebar duplicate was removed.
This latest workflow awaits owner evaluation. Earlier spectroscopy repairs and
Phase 3 point editing/undo were accepted. Phase 4 analysis polish awaits owner review;
recovery, quality, keyframes, presets and benchmarks remain deferred.

The 2026-09-20 heuristic review adds planned follow-ups for the no-media state,
FPS-first video preparation, keyboard-operable canvas measurements, a simpler empty
Analysis view, semantic dialogs/errors, complete EN/ES copy, comparison-label contrast
and narrow-screen header use. Phase 1 (the starting screen and delete-target
visibility) is now implemented locally, with owner browser review pending. Other
follow-ups remain planned. The owner's latest Phase 1 revision shows a welcome
dialog over the dimmed workspace with media/project entry and original-media
guidance, superseding the hidden-workspace version. See spec 10 for current behavior.

Phase 2 timing trial: video FPS detection and blocking confirmation are implemented
locally (ADR 008/spec 10), including familiar FPS presets, VFR support and saved-project
timing checks. Owner accepted UI/UX Phase 2 as complete. Additional scale/pixels
choices and axes/tracking progression are dropped; retain existing controls.
UI/UX Phase 3 keyboard/numeric measurement proposals are deferred by the owner;
implementation requires a later owner decision. Next for discussion is UI/UX
Phase 4: Analysis empty states and fit/export prerequisites.

Latest code checks: 74 tests, lint and build pass; whitespace checks pass.
Existing build warnings remain. No deployment is authorized. Start next session
with the acceptance checklist in the consolidated progress note below.

- Current consolidated progress: `../docs/progress/2026-09-20.md`.
- UI/UX design principles: `../docs/UI_UX_DESIGN_PRINCIPLES.md`.
- Six-phase roadmap and priorities: `09_student_experience_roadmap.md`.
- Validation: `../docs/testing/student-experience.md` and `../docs/testing/spectroscopy.md`.
- Prior tracking evidence: `../docs/testing/autotracking.md` and related ADRs.
