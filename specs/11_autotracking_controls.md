# Phase 2 — approachable automatic-tracking controls

> Current checkpoint (2026-09-19): compact cyan controls and inline Fine-tuning are
> implemented. Help has one visible/pending owner, delayed hover, predictable dismissal
> and no mouse pinning. Cesar reports the hover fix is working. This is feedback on
> that interaction, not full keyboard/touch/device acceptance. Later dated requirements
> below supersede earlier presentation wording.

Status: controls-layout increment accepted by the owner after local testing.
Owner reports it works well and authorizes proceeding to Phase 3. Quantitative
multi-video benchmarks and presets were not delivered or measured by this increment.

## Requirements

- ATC-01: Keep template diameter and search radius visible, with brief EN/ES
  explanations, along with target preview, status, match quality, failure reason,
  reselect, single-frame tracking and Run/Pause.
- ATC-02: Put evolution, original-template tether, minimum structure match, motion
  prediction and Restore defaults inside an initially collapsed Fine-tuning section.
  Remember expansion for the current app session across mode/view changes.
- ATC-03: Show a translated Modified indicator in the summary if any fine-tuning
  value differs from the tracking engine defaults. Main slider changes alone do
  not mark fine-tuning modified. Restore defaults retains its existing all-settings
  behavior and explicitly describes that scope.
- ATC-04: Preserve slider ranges, busy-state disabling, target/overlay updates,
  accepted points, tracking algorithms and project format. No presets or algorithm
  tuning in this increment. Keep native keyboard-accessible disclosure behavior.

## Validation

Run existing tests, lint and build. Owner checks EN/ES and both themes: main controls
visible while collapsed, expand/collapse, Modified changes and restore, mode/view
round-trip retains expansion, paused sliders update overlays, running controls are
disabled, keyboard disclosure, and loss status/reselection remain visible.
This increment does not complete Phase 2 benchmarking or preset evaluation.

## Implementation evidence — 2026-09-16

Implemented the disclosure and translated contextual explanations. Expansion is
transient state in the existing tracking hook, so panel unmounts do not reset it;
it is not written into project files. The Modified indicator reads the engine's
actual defaults for the four fine-tuning fields. Tracking actions are unchanged.

42 existing tests, lint, build and whitespace checks pass. A direct EN/ES key
parity check passes. Existing Browserslist-age and chunk-size warnings remain.
Browser layout, disclosure interaction and owner acceptance are pending; no
browser automation was performed. No new release or deployment.

## Owner-approved visual revision — 2026-09-19

Use compact cyan/slate sliders with right-aligned values and units. Keep one
status line and a small target preview; failures remain visible. Put Start tracking
(primary cyan), One frame (secondary), and Reselect object below primary sliders.
Move explanatory prose to help popovers on label hover and help-button focus/tap;
slider dragging must not trigger help. Support Escape, outside dismissal and touch.
Fine-tuning expands inline with existing reduced-motion-aware accordion styling;
primary controls stay visible and Pause has only one visible copy. Preserve all
tracking parameters, defaults and algorithms. Keep EN/ES parity.
Acceptance: owner visual/keyboard/touch review, slider values/help, status/failures,
run/pause/step, expanded controls and parameter preservation. Browser review pending.

## Compact automatic-tracking controls — 2026-09-19

Implemented thin cyan/slate sliders with aligned pixel/percentage values, a bright
cyan Start tracking/Pause action, secondary One frame and text Reselect action.
Status and a small preview share the header. Failures remain visible. Label hover
and info-button focus/tap reveal help; Escape/outside interaction dismiss it, and
slider interaction does not trigger help. Fine-tuning expands inline with the
existing reduced-motion-aware animation. Its open state is transient, survives
sidebar navigation, and is excluded from autosave/export. Matching algorithms,
parameter limits and defaults are unchanged. New labels support EN/ES.

57 tests, lint, build and whitespace checks pass. Updated state/render checks cover
inline controls, hidden fine-tuning, primary actions and help prose removal. Browser
review of appearance, popover placement, keyboard/touch and animation remains
pending with the owner. Existing build-size/Browserslist warnings remain. No release.

## Help interaction refinement — 2026-09-19

Only one tracking-help box may be active or pending. Hover waits 400 ms; leaving
before opening cancels immediately. Leaving both label and box closes after 150 ms.
Entering another label dismisses the previous box. Mouse clicks open without
pinning; touch taps toggle until outside dismissal. Keyboard focus opens help;
Escape/focus departure, outside interaction, slider adjustment, scrolling and menu
changes cancel pending and visible help. Position beside the sidebar where space
allows, otherwise above/below the label; use a subtle fade with reduced-motion
support. Regression checks must cover multiple callers and pending timers.

## Help dismissal refinement

Tracking help now coordinates visible and pending boxes through one controller.
Leaving before 400 ms cancels opening; leaving the label and popup closes after
150 ms. Switching labels replaces the previous owner immediately. Mouse clicks
open without pinning; touch taps toggle; keyboard focus opens and Escape or focus
leaving closes. Outside pointer interaction, scrolling, resize and unmount cancel
pending work as well as visible help. Popups use measured content dimensions,
prefer placement beside the label, and fade in over 110 ms (no reduced-motion fade).

61 tests, lint, build and whitespace checks pass. Four deterministic timer tests
cover canceled openings, multiple callers, crossing into the box, leaving after
immediate opening and disposal. Owner browser review of pointer/touch behavior
remains pending. Existing bundle-size/Browserslist warnings remain. No release.
