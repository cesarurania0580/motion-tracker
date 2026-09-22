> Latest checkpoint: [2026-09-19 progress](../progress/2026-09-19.md).
> Owner reports the help-box hover fix is working. No exhaustive touch/keyboard or
> device acceptance is implied. Latest spectroscopy workflow is pending owner review.
> Latest code checks: 66 tests, lint, build and whitespace checks passed.

# Student experience validation record

## Logo and tracking-menu polish — 2026-09-16

Owner acceptance: after checking the local changes, the owner confirms “ok it
works” for the logo proportions and tracking-menu highlight fixes. This accepts
the reported fixes; it does not establish the full device/keyboard test matrix.

VP-01/02 (spec 10): logo assets are 1060×185. The prior fixed 36px height
and 160px maximum width distorted that ratio; a 160px width and automatic
height now preserve it (about 27.9px high), with flex shrinking disabled.
Tracking choices previously combined independent focus and hover backgrounds;
opening the menu focused one row while the pointer could highlight another.
Pointer movement now focuses the enabled row and focus alone controls its
background. Selected-mode checkmarks and existing keyboard handlers remain.

Code validation: 42 tests, lint, production build and diff whitespace check pass.
Existing Browserslist-age and bundle-size build warnings remain. No new unit test
was added for browser layout/focus styling; those need browser verification.
Owner browser checks pending: both logo themes and header wrapping; repeated
pointer movement between choices; arrow/Home/End navigation, Escape, selection,
and disabled automatic tracking when viewing an image. No browser reproduction
or visual acceptance is claimed by the agent.

Status: Phase 1 COMPLETE — owner confirms guided workflow tested and working.
Specs: 09 and 10. Acceptance is owner-reported; the agent has not opened a browser.
No device matrix, accessibility audit or measured student study is claimed.
Earlier pending checklists below are historical; unreported device/student scenarios
remain future validation work and do not override the owner's Phase 1 acceptance.

## Current checkpoint — 2026-09-15

Latest code checks: 42 tests, lint and build pass, including spectroscopy repairs.
Current behavior and next checks: [daily progress](../progress/2026-09-15.md).
Earlier increment/revision sections below are history, not the current UI contract.
The familiar toolbar revision supersedes the guide and all-icon intermediate UI.
More now closes via trigger, outside click or Escape; there is no separate ×.
Browser checks for that dismissal behavior and final Phase 1 acceptance are pending.
Spectroscopy tests are recorded separately in spectroscopy.md (partial Phase 5 work).

## Baseline

PhysTracker 1.2.0 local commit eebc25f6216ff4f9d8a80e2ab351f8e8d46a3ab7.
Backup recorded in spec 09. Baseline code checks: 25 tests, lint and build passed.
That establishes a code baseline, not a usability assessment.

## Pending owner/browser scenarios

- [ ] New user completes video → preparation → tracking → graph → export.
- [ ] Cancelling open/dismissing guidance preserves existing work.
- [ ] Project reload requests matching media and correctly restores measurements.
- [ ] Revised calibration, tool switches and auto pause retain consistent state.
- [ ] Primary automatic settings remain immediately visible; uncertainty is below mass.
- [ ] Images, pixel-only exploration and spectroscopy bypass irrelevant video steps.
- [ ] Save and failure messages accurately describe what happened.
- [ ] EN/ES, keyboard focus, accessible names and touch controls are usable.
- [ ] Agreed Chromebook/desktop/tablet layouts have no page-level horizontal scroll.
- [ ] Student evaluation reports time, assistance, mistakes, recovery and understanding.

For each run record date, app commit, device/browser/version, task/media/settings,
observations, result, tester role without identity, and any remaining issue.
Collect baseline usability measurements before comparing the new workflow.


## Code validation — first Phase 1 increment

Branch: local/phase-1-guided-workflow. 30 tests pass, including five new readiness,
COM/no-data, image/spectral, EN/ES and persistence tests. Tests verify storage quota
failure/recovery, transient updates skipping writes, and FPS confirmation invalidation.
Lint and production build pass. Existing bundle-size and Browserslist warnings remain.
No browser/device/assistive-technology or student-usability results are claimed.

Suggested owner sequence: open localhost, choose media, visit Prepare and confirm
FPS, set scale and axes, use Measure to choose tracking, inspect Analyze, download
project, then hide/reopen guidance. Repeat in Spanish and with an image line profile.
Test project reload with non-default uncertainty/time-zero/crop values. Check touch
and narrow layout, especially toolbars, chart sizing and quick-help expansion.

Outstanding: owner acceptance of layout/density; exact tutorial URLs; full
uncalibrated-units presentation review; baseline student timing; device matrix.

## Compact toolbar revision — owner feedback

The original guide consumed too much space. Replaced it with one icon-only toolbar,
ordered media → FPS/scale/axes → object/tracking → views → save → help/options.
The old guide component is removed. FPS is configured in the clock menu rather
than duplicated in the sidebar. Object choice is in an icon menu. Save menu reports
local-save status, and a warning icon indicates save failure.

550ms mouse hover and keyboard focus show descriptions. The Help icon enables
explicit touch explanations with an action button; blocked controls explain their
prerequisite. Checkmarks identify actual readiness/data availability, while a steady
outline suggests the next step. Only active setup/selection/error instructions show
a dismissible short strip. No continuous animations are used.

Validation: 30 tests, lint, build and diff whitespace checks pass. Existing build
warnings remain. This is code-only verification; pointer/touch/keyboard interaction
and layout still require owner testing.

Current owner checklist (supersedes the earlier five-step guide walkthrough):
- [ ] No large guide or permanent text labels; icons wrap comfortably on small screens.
- [ ] Hover briefly, then tab to icons; descriptions appear; Escape dismisses help.
- [ ] Enable Help, tap an icon, read the explanation, then use its explicit action.
- [ ] Open media; confirm FPS using the clock; set scale and origin; check badges.
- [ ] Select A/B and manual/automatic tracking; check tracking menu and visible sliders.
- [ ] Open graph, return to video, and save/export through the save menu.
- [ ] Check light/dark themes and English/Spanish; repeat on touch layout.

## Familiar controls and breathing cue revision

Restored labeled Tracker/Analysis and Object A/B/COM on the left. Right toolbar:
Upload (direct file picker), Scale, Axes, Tracking, More. FPS returned to sidebar.
Removed above-video guidance strips. Dark navy tooltip background in both themes.
The 2.5-second breathing outline advances on decoded media, valid scale, actual
axis placement, then stops during tracking. Axes confirmation is transient and
restored for saved origins; opening the axes control alone does not confirm it.
Hover/focus/help pause the animation; reduced-motion preference uses a static cue.

Owner browser checks pending: animation handoffs, default/unchanged axes followed
by direct tracking, file-picker cancellation, restored project, touch help under
More → Explain controls, tooltip contrast and laptop/tablet layout.

## 2026-09-17 — agreed sidebar implementation

Code checks: 56 tests, lint and build pass. Tests exercise navigation/state
preservation, hidden spectral placement cancellation, autosave exclusion and
EN/ES labels. Server rendering verifies focused menus, a single sidebar scrolling
body and exactly one visible Pause action across running views.

Browser acceptance remains pending: perform the owner sequence in spec 14,
including hidden point-edit cancellation and continued automatic acquisition,
keyboard tab navigation, narrow layout and both languages/themes. Static/server
render checks do not establish these interactive outcomes.

## Owner-requested sidebar refinements

New videos open Measurement settings with FPS first, an inline timing explanation
and Confirm FPS. Confirmation removes the prompt/highlight; FPS changes and new
videos require confirmation again. Still images do not show the FPS controls.
Tools keeps both category buttons and expands one section beneath its button with
220 ms height/fade and chevron motion. Clicking again collapses; switching closes
the other section. Closed controls are inert/aria-hidden, reduced motion disables
animation, and pending spectral placement is canceled when collapsed.
Clear object data is immediately visible in Data (disabled when empty; absent for COM).

57 tests, lint, build and whitespace checks pass. Tests cover new-video routing,
confirmation lifecycle, image exclusion, accordion expanded/hidden attributes,
visible clear action and existing preservation/Pause behavior. Browser evaluation
of motion, keyboard and the revised flow remains pending with the owner. Existing
bundle-size and Browserslist warnings remain. No deployment or push.

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
