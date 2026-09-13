# Specification index and workflow

1. Spectroscopy: `01_spectroscopy_line_profile.md`
2. Wavelength calibration: `02_wavelength_snap_calibration.md`
3. Center of mass: `03_center_of_mass_tracking.md`
4. Core tracking/calibration: `04_core_tracker_calibration.md`
5. Measurement overlays: `05_protractor_tape_measure.md`
6. Regression: `06_least_squares_regression.md`
7. Architecture history: `07_architectural_decomposition.md`
8. Automatic tracking: `08_autotracking_template_matching.md`

## Workflow

Brief → numbered spec (requirements, boundaries, acceptance IDs) → design/ADR →
implementation → automated and manual validation → owner acceptance → release.
A prototype success does not imply integration acceptance. Each feature's test
record identifies actual evidence and unchecked scenarios. Keep specs beside code
in Git. Update requirements before implementing a changed behavior. Use small
feature branches and preserve a recoverable baseline before risky integration.

Current work: spec 08, local integration. See `docs/testing/autotracking.md`,
`docs/adr/001-local-autotracking.md`, and `docs/DEVELOPMENT.md`.
