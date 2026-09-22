# Guided workflow and interface consistency

Status: COMPLETE — owner tested and accepted the guided workflow. Parent: spec 09.
Acceptance applies to the final familiar-toolbar revision below; earlier designs are history.

## Goal and scope

Guide a first-time user from media to a useful graph and saved work. Add optional
contextual guidance to the existing workspace, with revisitable steps and familiar
expert access. Preserve current measurement math and media coordinates.

First increment: motion workflow guidance, contextual instructions, consistent
action states, accessible help and honest saving feedback. Sample-library content,
presets, keyframes, additional objects and statistical solvers are later increments.
The welcome layout may reserve a sample action only when a working sample exists.

## User journey

1. Open media or a saved project. Restored projects explicitly request their
   corresponding video/image because current JSON files do not contain media.
2. For motion, confirm FPS and set scale/coordinates as needed. Show which values
   are defaults, confirmed or calibrated; do not present an assumed FPS as detected.
3. Choose manual or automatic tracking and the active object. Keep the icon-only
   toolbar trigger and show the selected mode in contextual guidance.
4. Inspect measured points, then select graph variables, a range and optional fit.
5. Save a project or export data/graph, with clear descriptions of each output.

An optional checklist reflects current state and links to the relevant control.
It can be dismissed and reopened without losing work. Students may revisit steps
in any order. Images and spectroscopy receive relevant prompts; they are never
forced through a video-motion checklist.

## Acceptance requirements

- GW-01: A new session offers functional media and project opening actions;
  cancelling a file picker does not change the current experiment.
- GW-02: Checklist state comes from experiment readiness, not only clicks. Replacing
  media or restoring a project updates readiness and identifies missing media.
- GW-03: Guidance is optional and reversible; dismiss/reopen preserves data,
  calibration, graph selection and current object.
- GW-04: Each stage presents one clear next action and a short instruction. Invalid
  actions explain the missing prerequisite; they do not fail silently.
- GW-05: Calibration, tracking and other canvas interactions have an unambiguous
  active mode. Switching tools safely cancels pending automatic work.
- GW-06: Automatic selection shows primary tracking controls immediately. Uncertainty
  stays below mass; optional tools remain expandable and discoverable.
- GW-07: Button labels, spacing, disabled/busy/selected states and tooltips follow
  shared conventions. Icon-only actions have translated accessible names; help
  is available by keyboard and touch, not only hover.
- GW-08: Save status reflects actual persistence success/failure. Explain that local
  saving is browser/device-specific and project JSON needs the original media.
- GW-09: EN/ES cover instructions, empty/error states and help. Tutorial links use
  verified URLs; the exact owner-channel links remain to be supplied/verified.
- GW-10: Changing scale/origin updates derived data consistently, existing JSON
  projects remain readable, and original coordinate/time values are preserved.
- GW-11: On the agreed desktop/Chromebook/tablet sizes, controls remain reachable
  without page-level horizontal scrolling; primary touch controls target 44 CSS px.
- GW-12: Pixel-only exploration and spectroscopy remain possible without completing
  unrelated motion setup. Labels must accurately indicate calibrated units.

## Implementation approach

Use small components for guidance/help and derived readiness state. Avoid a second
independent experiment state that can disagree with the store. Document any new
persistence fields and compatibility behavior before introducing them. Reuse
existing tracking/calibration actions. No production publication is implied.

## Validation and completion

Automated: meaningful state-transition tests for readiness and safe cancellation,
existing measurement/project regression tests, npm test, npm run lint, npm run build.
Owner browser evaluation: new video; cancel file selection; calibrate and revise;
manual/automatic tracking; pause/tool switch; graph/export; reopen project and media;
dismiss/reopen guidance; image line profile; EN/ES; keyboard and touch access.

Record dated evidence and unresolved issues in docs/testing/student-experience.md.
All browser checks are pending. Completion requires owner evaluation of the local
increment; shipping requires a separate release instruction.


## First local increment — 2026-09-15

Implemented optional five-step guidance above the workspace, media/project actions,
FPS confirmation, scale/origin actions, tracking-menu access, contextual motion and
light instructions, analysis/export navigation and keyboard/touch quick help.
Readiness is derived from existing store data. Manual step selection and visibility
are component UI state. FPS confirmation and save status are transient store fields,
not exported or autosaved, so old projects keep their existing schema. FPS must be
reconfirmed on a new video or a changed FPS value; no automatic detection is claimed.

Primary automatic settings remain visible. The shared Header origin action is also
used by the guide. Opening scale editing invalidates automatic work through existing
tool state. Header/media/project actions now support keyboard access. Header/player
wrap and analysis/sidebar stack on narrow screens; visual acceptance remains pending.

Save status follows actual localStorage write success/failure. Only persisted-field
changes trigger writes, so pointer moves/status feedback do not generate recursive
saves. Failures offer project download. Restored image/light calibration is recognized
as an experiment even without motion points; attaching original media preserves
uncertainty, crop and time-zero settings. New media clears obsolete light/tool data.
Malformed project shape/point data is rejected before applying project measurements.

Scope notes: quick help is built in. Owner YouTube tutorial URLs remain unknown;
no unverified links or sample-library placeholders are shown. The sample library is
in phase 6. No numerical analysis changes or advanced tracking presets are included.
Existing uncalibrated analysis uses the app's legacy conversion/display conventions;
the guide labels distance as uncalibrated and does not claim those graphs are pixels.
A full units-display review remains a follow-up before asserting GW-12 is complete.

## Owner revision — compact toolbar, 2026-09-15

Supersedes the permanent checklist and duplicate guide controls above. Owner liked
instructions and readiness checks but rejected the canvas space cost.

- CT-01: Remove the guide panel. Use one icon-only toolbar in order: media,
  preparation (FPS/scale/axes), object/tracking, analysis, save/export, help/options.
- CT-02: Maintain 44px toolbar targets; allow compact wrapping on small devices.
  Labels belong in menus/help, never as permanent toolbar text.
- CT-03: Delayed mouse hover and keyboard focus show explanatory help; Escape
  dismisses it. Touch explanation mode intercepts a control tap and offers an
  explicit action. A normal tap retains the original action.
- CT-04: Readiness badges mean loaded/calibrated/points available, not scientifically
  verified. Suggest next action with a steady outline; no continuous animation.
- CT-05: Brief dismissible instruction only during active preparation/selection
  or a recoverable error. No permanent setup panel. Save state remains accessible.
- CT-06: Preserve automatic controls, project compatibility and EN/ES. Record code
  validation separately from owner browser acceptance.

Compact revision implementation: Header now owns the ordered toolbar and small
menus; ToolbarButton supplies hover/focus explanations and touch help mode.
Readiness uses the existing derived workflow function. The five-step guide was
removed, and its duplicate actions are no longer rendered. FPS moved from Sidebar
to a dedicated clock menu; object selection uses one icon and labeled menu choices.
30 tests, lint, build and whitespace checks passed; owner browser acceptance pending.

## Owner revision — familiar toolbar and breathing cue

Restore the labeled Tracker/Analysis and Object A/B/COM controls on the left.
On the right use Upload → Scale → Axes → Tracking → More. FPS returns to sidebar;
save/help/theme/language remain in More. A 2.5s stationary breathing outline marks
only the next needed step, ending when that step completes. Opening axes alone
is not completion; actual positioning or entering tracking ends its prompt.
Normal clicks dismiss hover help and do not create an instruction strip.
Tooltips use navy #0F172A. Pause animation during help/hover/focus, respect reduced
motion with a static outline. These requirements supersede CT-01/04/05 placement.

Menu polish: tracking choices and More use the same dark navy as tooltips in both
app themes. More restores distinct colored action icons (blue save, green open,
yellow/indigo theme, purple language, cyan help/about, red reset).

More menu has no separate close button. Its trigger toggles it closed; clicking
outside the popup/trigger or pressing Escape dismisses it. Browser check pending.

## Visual polish — 2026-09-16

- VP-01: Preserve the original 1060:185 logo proportions in both themes, including
  when the header wraps. Keep the compact 160px logo width.
- VP-02: Tracking-menu pointer movement and keyboard navigation share one focused
  row highlight. Moving between enabled choices must not leave two backgrounds
  highlighted. Keep selected-mode checkmarks distinct from focus, skip disabled
  automatic tracking for images, and preserve Escape/selection focus restoration.
- Owner browser acceptance: inspect both themes and a narrow header; move repeatedly
  between tracking choices, then use arrows/Home/End, select a mode and press Escape.

## Heuristic follow-up — 2026-09-20

The following requirements extend the accepted familiar-toolbar design. They are
based on the UI/UX principles review and remain pending implementation and owner
browser evaluation.

- GW-13: Before media is loaded, make Open media the single prominent workspace
  action and add one short sentence explaining that videos support motion tracking
  while images support spectroscopy and measurement. Keep the existing menu
  reachable. Hide or defer object selectors, playback/timeline, measurement settings,
  tracking configuration and analysis configuration until their prerequisites exist.
- GW-14: The Drop to Delete target is visible only during an active point drag and
  exposes a clear selected/hover state. Its current no-media visibility is a defect,
  not an intended empty-state action.
- GW-15: For a newly loaded video, Confirm FPS is the first required preparation
  decision. The next-step cue and tracking actions must not advance to scale, axes
  or tracking while FPS is unconfirmed. After confirmation, students may calibrate
  distance or explicitly continue in pixels; axes remain optional when defaults are
  appropriate. Readiness state, cues, disabled states and help text must agree.
- GW-16: Canvas-only actions need a keyboard-operable equivalent. Focusable points
  and handles may support arrow-key movement; numeric coordinate/value entry is an
  acceptable complementary path. Announce selection, position/value changes and
  completion through translated status text without relying on color alone.
- GW-17: About and similar overlays use a labeled modal-dialog pattern with initial
  focus, focus containment, Escape dismissal and focus restoration. Prefer inline,
  contextual EN/ES errors over blocking browser alerts. The primary workspace uses
  a semantic `main` landmark.
- GW-18: At 390px and the agreed classroom-device widths, reduce header height while
  keeping the logo, current view and primary media/menu actions understandable.
  Preserve 44px primary touch targets and prevent page-level horizontal scrolling.

Validation adds a fresh no-media session, unconfirmed-FPS video, keyboard-only
measurement, dialog focus cycle, screen-reader status check and 390px header review
in both languages and themes. Code inspection alone does not satisfy these checks.

## UI/UX Phase 1 implementation — 2026-09-20

GW-13/14 implemented locally: the no-media workspace has a centered Open media
action, short EN/ES purpose text and the familiar logo/colored options menu. View,
object and preparation controls, sidebar, Analysis configuration and transport are
deferred until a media source exists. Restored projects receive original-media
instructions without discarding their measurements. The action reuses the existing
upload handler; cancelling its picker preserves the experiment. Images suppress
video playback even before decoding finishes.

The delete target retains its hit-test reference but is invisible, noninteractive
and hidden from assistive technology outside point dragging. Removed the conflicting
opacity class that made it appear while idle. The active hover treatment is retained.

Rendered integration coverage checks both themes/languages, restored data with no
media, stale Analysis selection, video/image entry and active/idle deletion states.
Owner browser acceptance remains pending: fresh start at desktop/390px, keyboard
file opening/cancellation, project restore, video/image upload and drag-to-delete.
FPS sequencing and the remaining heuristic follow-ups belong to later phases.

## Owner revision — welcome dialog over workspace

Supersedes GW-13's hidden-workspace presentation and the first Phase 1 implementation.
Show the familiar app behind a translucent dark scrim, with a centered welcome
dialog. Background content is inert and hidden from assistive technology while the
dialog is active. Offer Open video or image (primary) and Open saved project
(secondary). Do not include Explore workspace or allow dismissal into an empty app.
Picker cancellation keeps the current step; outside clicks and Escape do not bypass
the welcome step. Keyboard focus remains within the dialog.

Opening a valid JSON project changes the dialog to Your project is loaded / Locate
original media. Browser-restored projects enter this same state. Explain that media
is not embedded in project files. Invalid/unreadable project errors appear inline;
allow retry. Media loading status/errors remain visible until decoding succeeds.
Starting new from restored work requires a separate confirmation step with Download
project, Start new experiment and Keep restored project actions. Escape returns
from that confirmation to the restored-project step.

Implemented locally in EN/ES with both themes. GW-14's idle delete-target fix remains.
Owner validation: new media, saved JSON then original media, browser-restored work,
picker cancellation, invalid JSON, failed media, restart/save/cancel, keyboard focus
and narrow-screen layout. No browser acceptance is inferred from rendered tests.

Welcome copy clarification: retain explicit video-motion and image-spectroscopy/
measurement guidance alongside the saved-project option, in both EN/ES. Adding
project entry must not replace the explanation of what each media type supports.

## Phase 2 trial — automatic FPS detection and confirmation

Normal-speed video only. Inspect file metadata in a lazy-loaded worker, with a
bounded timeout/read budget and cancellation on replacement. Show detected FPS as
an editable suggestion; never change the store until confirmation. Missing/unknown
metadata requires manual entry. Explicit variable-rate metadata blocks confirmation
and offers another video. Images bypass timing. Keep the app inert until confirmation.
For restored projects, default to saved FPS and identify mismatch; require explicit
acknowledgment to change it. Existing measurements store media timestamps, not frame
numbers: do not rescale their times. FPS changes affect stepping/frame identification.
Confirmation is session state only. Check invalid inputs, CFR/VFR/unknown metadata,
stale jobs, restoration, images, EN/ES and both themes. Scale/pixel/axes guidance is
a separate remaining Phase 2 increment.

Trial implemented: 73 tests, lint and production build pass. Tests cover rational
rates, invalid metadata/inputs, CFR/VFR/unknown cases, worker cancellation/timeout,
saved-value defaults/mismatch, dialog gating and bilingual states. Generated CFR
(30000/1001) and VFR clips plus the existing SpaceX sample were inspected with the
actual library. The built worker/WASM also returned CFR/VFR correctly in a Node VM
with browser-like globals and local asset fetch. This is not browser acceptance.
Owner checks uploads, detection latency, manual fallback, restore/mismatch/change,
new-video replacement during detection, Review frame rate, keyboard and narrow UI.

## Owner revision — approachable FPS choices

Supersedes the VFR block and mandatory decimal input. Offer 30/60/120/240 FPS with
the closest familiar rate selected when within 10%; unusual rates (including 24/25)
use Other frame rate. Retain the precise detected/average rate when accepting its
suggestion; selecting a different preset explicitly overrides it. Other allows an
exact override. Default to 30 when detection fails, clearly labeled as a default.
Preserve saved timing as the initial value and keep edit acknowledgment. Variable
rate videos remain usable; original point timestamps remain unchanged. EN/ES,
keyboard focus, worker cancellation and timeout behavior remain required.

## Owner acceptance — UI/UX Phase 2 complete

Owner explicitly marked Phase 2 complete. Keep existing scale, axes and tracking
controls. Drop the proposed Set scale / Continue in pixels choice, Keep default
axes action and extra progression cues. This supersedes those portions of GW-15
and earlier Phase 2 planning; they are no longer pending work. Next: evaluate
Phase 3 keyboard/numeric measurement benefits before implementation. Broader
accessibility/device validation remains separate. No release is authorized.
