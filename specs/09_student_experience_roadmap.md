# Student experience and development roadmap

## Current checkpoint — 2026-09-20

Owner: Cesar. This checkpoint supersedes older status/sequence paragraphs below.
See [today's consolidated progress](../docs/progress/2026-09-20.md) and the
[UI/UX design principles](../docs/UI_UX_DESIGN_PRINCIPLES.md) used for review.

| Phase | Current state |
| --- | --- |
| 1. Guided workflow/interface | Original workflow accepted; Controls / Data / Tools refinements implemented locally, broader owner review pending. New videos open Measurement settings with Confirm FPS; Tools expands one section at a time; Clear data is visible. The no-media state and strict FPS-first readiness are new heuristic follow-ups. |
| 2. Automatic tracking | Earlier controls accepted. Compact cyan controls, inline Fine-tuning and help refinements implemented. Owner reports the corrected hover behavior is working. Broader device/accessibility review and benchmarks/presets remain pending. |
| 3. Review/recovery | Point correction/deletion/undo accepted. Recovery, quality and keyframes deferred. |
| 4. Analysis | First layout, units, fit explanations and coordinate-only tooltips implemented; owner evaluation pending. A simplified prerequisite-aware empty state is planned. Deeper analysis remains future work. |
| 5. Measurement/light | Earlier spectroscopy repairs accepted. Calibration-first spectroscopy plus the fresh-image spectrum/measurement landing are implemented and awaiting owner evaluation. Keyboard/numeric canvas alternatives and comparison-label accessibility remain planned. |
| 6. Classroom readiness | Device matrix, privacy information, sample activities and teaching materials remain pending; dialog semantics, inline errors, landmarks, narrow-header review, accessibility and localization apply throughout. |

Next: evaluate calibration-first spectroscopy, address feedback, then finish sidebar
and analysis review before selecting the next deferred increment. No release authorized.
The authoritative sidebar behavior is spec 14 with its dated revisions: Tools and
Fine-tuning expand inline, superseding the earlier replacing-subview requirements.

## UI/UX heuristic review — 2026-09-20

Latest sequencing decision: UI/UX Phase 3 (keyboard/numeric measurement controls)
is DEFERRED at the owner's request. Do not implement its proposals unless the owner
later selects them. This supersedes the next-step recommendation below. Next for
discussion is UI/UX Phase 4: Analysis empty states and fit/export prerequisites.

Latest owner decision: UI/UX improvement Phase 2 (video timing) is COMPLETE and
accepted. Extra scale/pixels choices, default-axes actions and tracking progression
cues are dropped; existing controls remain. Next: evaluate UI/UX Phase 3
keyboard/numeric measurement access before implementation. This numbering differs
from the original development roadmap below, whose Phase 2 is autotracking.
This checkpoint supersedes earlier pending scale/axes guidance statements.

The current local interface was reviewed on desktop and a 390px-wide viewport in
both themes, with code inspection for media-dependent states. The provisional
heuristic score is 3.6/5. This is a planning signal, not a usability-test result
and not a claim of accessibility conformance. Preserve the accepted image landing,
compact toolbar, cyan/slate application palette, hamburger-menu icon colors and
H/He/Hg scientific comparison colors while addressing the following work.

| Priority | Improvement | Primary specification |
| --- | --- | --- |
| P0 | Make the no-media state calm and task-oriented: one prominent Open media action, a short explanation and the existing menu. Defer object, playback, timeline, measurement and analysis configuration until media exists. Show Drop to Delete only while a point is being dragged. | Specs 10 and 14 |
| P1 | Enforce the video preparation order: Open video → Confirm FPS → Set scale or explicitly continue in pixels → Position axes if needed → Track. Do not cue or enable tracking while FPS is unconfirmed. | Specs 04 and 10 |
| P1 | Give every canvas measurement a keyboard-operable path, focusable handles or equivalent numeric fields, visible focus, translated instructions and announced coordinate/value changes. | Specs 01, 04 and 05; UX-CLASS-02 |
| P1 | Replace the empty Analysis control wall with a concise explanation and Return to Tracker action. Disable or defer fit, appearance and export controls until their data prerequisites exist. | Spec 13 |
| P2 | Complete semantic dialogs, inline EN/ES error feedback, landmark structure, translated spectroscopy terms, light-theme comparison-label contrast and a shorter narrow-screen header. | Specs 01, 10, 13 and 14 |

These items are bounded follow-ups to previously accepted behavior. They do not
revoke earlier owner acceptance or authorize a release. Validate the P0/P1 items
with first-use tasks before assigning a final version or claiming improvement.

Phase 1 update (2026-09-20): the P0 no-media screen and delete-target visibility
are implemented locally. Rendered checks cover empty/restored/video/image states;
owner browser acceptance remains pending. Next implementation phase is consistent
FPS-first video preparation after the owner reviews Phase 1.

Latest owner revision: Phase 1 now uses a welcome dialog over the visible, dimmed
workspace, offering media or saved-project entry and original-media restoration.
No Explore workspace action. This supersedes the no-media hiding requirements in
the priority table; see spec 10. Implemented locally, owner review pending.

## Purpose

Help students complete, understand and recover an experiment independently:
prepare media → track → inspect measurements → analyze → save/export.
Keep advanced controls available and preserve original-media coordinates,
measurement results, existing project compatibility, and synchronized EN/ES text.
The comparison with competing apps is a design input, not proof of superior
usability or tracking accuracy. Validate both with users and repeatable measurements.

## Baseline and recovery

Starting version: 1.2.0, local commit eebc25f6216ff4f9d8a80e2ab351f8e8d46a3ab7.
Complete verified local copy:
`../../backups/phystracker-1.2.0-20260915-131157/physics-app`.
Recovery instructions and SHA-256 manifest are in that backup's parent directory.
25 tests, lint and build passed when the baseline was saved. Existing bundle-size
and Browserslist warnings remain. These checks are not browser usability evidence.

## Design constraints from owner feedback

- The tracking toolbar trigger remains icon-only, with accessible name and help.
- Selecting automatic tracking reveals its main settings immediately.
- Measurement uncertainty stays below mass, not inside automatic tracking.
- Optional overlays and spectroscopy tools remain discoverable expandable groups.
- Clear data is available for both tracking modes; correction should also allow
  users to retain valid measurements.
- Cesar performs browser tests; agent validates code without browser automation
  unless explicitly requested.
- Local development is authorized. Each release needs an explicit release instruction.

## Delivery phases

Suggested version groupings are planning labels, not release commitments.
Implement and evaluate small complete increments before assigning final versions.

| Phase | Proposed work | Acceptance / evidence | Tentative grouping |
| --- | --- | --- | --- |
| 1. Guided workflow and consistency | Ordered existing icon toolbar, next-step breathing cue, contextual hover/touch help, consistent controls and save feedback | Detailed requirements in spec 10; record first-use task completion | 1.3 |
| 2. Approachable automatic tracking | Explain target selection; keep size/search controls visible; contextual help for evolution/tether/match; evaluate an optional fine-tuning section and tested presets | UX-AT-01–03 below; compare defaults/presets with benchmark; preserve owner's visible-settings preference | 1.4 |
| 3. Tracking review and recovery | Per-frame quality, manual correction, undo, selected-point deletion, resume from frame, keyframes | UX-REC-01–03; existing accepted points and calibration survive recovery | 1.4 |
| 4. Analysis students can interpret | Group variables/range/model/export controls; fit meaning and parameter units; residuals, parameter uncertainty, extra models; graph-to-frame selection | UX-ANA-01–03; numerical reference cases and owner review | 1.5 |
| 5. Measurement and light workflows | Contextual instructions for measuring tools; known-reference calibration and guide tilt → sampling line/channel/width → graph and theoretical comparisons | UX-TOOLS-01–02; existing motion and light data survive switching | Across 1.3–1.5 |
| 6. Classroom readiness | Device compatibility, accessibility, privacy information, sample experiments, teacher guides and student worksheets | UX-CLASS-01–03 and device matrix; ongoing throughout development | 1.6 |

Accessibility, localization and regression safety apply to every phase; they are
not postponed until phase 6. Motion setup must not block still-image analysis,
pixel-only work, or spectroscopy, which use different preparation steps.

## Most valuable development priorities

| Priority | Why it matters | Placement |
| --- | --- | --- |
| Autotracking keyframes and recovery | Handle appearance changes without restarting the experiment | Phase 3 |
| Fit uncertainty and statistics | Explain how well models describe measurements; add residuals and standard models | Phase 4 |
| Tracking corrections | Inspect quality and repair individual frames without clearing valid data | Phase 3 |
| More than two named objects | Support more complex experiments while keeping simple ones approachable | Separate future spec; after recovery; no fixed version |
| Classroom readiness | Reliable device use, accessible controls, clear privacy information and teaching materials | Every phase plus phase 6 |
| Repeatable tracking benchmark | Quantify error, completion, false matches, speed and corrections | Establish before phase 2 tuning; continue for tracking changes |

## Requirements for subsequent detailed specifications

- UX-AT-01: Beginners can select and run a target with default settings; preview
  explains the selected feature and search area. Paused adjustments visibly update
  relevant boxes without silently deleting measurements.
- UX-AT-02: General/fast/small/changing-appearance presets are candidates, not
  validated features. Publish a preset only after testing documented videos;
  show resulting parameter values and allow restoring defaults.
- UX-AT-03: Keep primary sliders visible on automatic-mode selection. A proposed
  advanced group must be evaluated against the owner's preference before adoption.
- UX-REC-01: Edit/delete/undo one point affects only the intended object/frame;
  verify graphs and center of mass recalculate correctly.
- UX-REC-02: Tracking loss preserves accepted measurements. Explain the cause and
  offer relevant recovery actions. Do not recommend lowering the match threshold
  indiscriminately because that may accept a wrong object.
- UX-REC-03: New keyframes and resume establish an explicit restart frame; define
  replacement of later points and undo behavior before implementation.
- UX-ANA-01: Parameter labels carry correct units for the selected axes; describe
  model meaning conditionally (a quadratic position/time fit can represent constant
  acceleration). High R² alone must not be described as proof of a correct model.
- UX-ANA-02: Residuals and parameter uncertainties have documented methods,
  assumptions, insufficient-data behavior and reference numerical tests.
- UX-ANA-03: Selecting a plotted measurement identifies its object/frame; navigation
  safely pauses tracking and does not create or change a measurement.
- UX-TOOLS-01: Activating tape measure/protractor gives an endpoint/vertex instruction.
  Vector display scaling must not imply a change to measured values.
- UX-TOOLS-02: Line-profile instructions distinguish sampled pixel intensity from
  calibrated wavelength. Two valid known references are required for calibration;
  motion scale/FPS are not prerequisites for image-based spectroscopy.
- UX-CLASS-01: Record actual device/browser versions and results for Chromebook,
  Windows/macOS, iPad and Android; test Chrome, Edge and Safari where applicable.
- UX-CLASS-02: Provide keyboard focus, accessible names, non-color status cues,
  touch-friendly targets and EN/ES completeness; assess contrast and screen-reader
  behavior with documented criteria rather than claiming compliance from code alone.
- UX-CLASS-03: Publish privacy information based on verified behavior and supply
  sample free fall, projectile, oscillation, collision/COM and spectrum activities
  with appropriate media permissions and student/teacher instructions.
- UX-BENCH-01: Extend existing rocket replay with shared test videos and known or
  manually annotated reference positions. Record video identity, timestamps, seed,
  settings, device/runtime, positional error, false matches, completion and speed.
  Cross-product claims require equivalent inputs and recorded human corrections.

## Student evaluation

First measure the current baseline with consenting teacher/student testers, then
repeat equivalent tasks with the proposed workflow. Record time to first graph,
completion without assistance, help requests, mistaken actions, recovery success,
and whether users can explain axes and fit parameters. Do not collect unnecessary
student identity information.

Initial targets to validate: first graph in under five minutes on a prepared short
video; at least 90% unaided completion; recover a deliberately lost track without
clearing the experiment; no page-level horizontal scrolling at tested sizes.
These are proposed targets, not measured results; report sample size and context.

## Sequence and outstanding decisions

Start with spec 10 and one complete local guided-workflow increment. Then define
detailed recovery and analysis specs before coding those phases. Decide placement
of fine-tuning controls through owner evaluation; select testable presets from
benchmark evidence; decide multi-object scope and project migration separately.
Historical initial sequence; use the current checkpoint above for next work.

## Progress checkpoint — 2026-09-15

Phase 1 is complete following owner browser testing and explicit acceptance. The large guide was replaced
by familiar controls with contextual help; spec 10 contains the final design.
Spectroscopy work implements part of Phase 5 early in response to owner-reported
defects; the remaining measuring-tool guidance and cross-tool checks are pending.
Latest code checks: 42 tests, lint and build pass. No new deployment or version bump.
See [daily progress](../docs/progress/2026-09-15.md) for the consolidated changes
and final behavior, especially comparison overlays preserving experimental data.
Owner also confirms spectroscopy is working. A friendlier spectroscopy menu is
deferred to Phase 5; it does not block Phase 1 completion. Next: specify Phase 2.
