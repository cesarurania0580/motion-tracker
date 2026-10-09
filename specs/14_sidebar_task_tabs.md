# Sidebar redesign — Controls / Data / Tools

> Current checkpoint (2026-09-20): retain Controls / Data / Tools; Tools and automatic
> Fine-tuning expand inline. FPS confirmation and visible Clear data remain implemented.
> Spectroscopy inside Tools follows calibration → sampling adjustment → exploration
> (spec 01). Historical replacing-subview requirements do not override these revisions.
> The fresh-image task landing and unified control palette are implemented locally.
> Owner evaluation and the heuristic follow-ups at the end of this spec remain open.

Status: implemented locally on 2026-09-17; owner browser evaluation pending.
The Controls / Data / Tools design below is now the current local interface. The earlier
Setup / Track / Data proposal was rejected and rolled back because it duplicated
familiar toolbar actions; its historical requirements are retained below and
must not be implemented again.

## Owner revision — 2026-09-17 (supersedes conflicting requirements below)

- SIDE-16: Loading a new video opens Controls → Measurement settings. FPS is first,
  initially unconfirmed, with inline “First, check the video's frame rate”, a timing
  explanation and Confirm FPS button. Confirmation removes the highlight/prompt;
  changing FPS or loading another video requires confirmation again. Tab switching
  does not reopen settings. Still images have no FPS prompt.
- SIDE-17: Tools retains both category buttons. Each expands controls underneath
  with a 220 ms height/fade transition and rotating chevron. Only one section can
  be expanded; clicking it again collapses it. No Tools back link. Closed contents
  cannot receive focus or interaction. Reduced motion disables transitions. Tool
  state survives collapse; closing spectroscopy cancels pending placement.
- SIDE-18: Clear object data is directly visible in Data, disabled when empty and
  absent for derived COM. Remove the Data actions disclosure. Preserve clear safety.

Acceptance: verify video/image entry, confirm/change/reload FPS, tab preservation,
mutually exclusive tool expansion/collapse, state preservation and hidden placement
cancellation, visible clear action, keyboard/reduced-motion and EN/ES. Owner browser
review is required for animation quality; code checks do not establish that.

## Owner revision — 2026-09-19

Fine-tuning now expands inline beneath compact automatic controls, preserving the
primary sliders/actions. This supersedes SIDE-07's replacing Fine-tuning subview.
See spec 11 for visual/help requirements. Tools accordion behavior is unchanged.

## Goal and boundaries

Make the right sidebar easier for students and teachers to understand by showing
one focused view at a time. Retain the familiar top-right preparation toolbar:
upload → scale → axes → tracking-mode selection → More. Keep existing object
selection in its current location. Do not duplicate these actions in the sidebar.
The three new tabs select sidebar content, not stages of video preparation.

Preserve accepted automatic-tracking behavior, point review/correction/deletion/
undo, chart hover improvements, overlay tools, spectral calibration and results.
This is a layout/navigation change, not new tracking recovery, quality, keyframes,
spectroscopy algorithms, project formats or release work.

## Stable navigation

- SIDE-01: Keep three labeled tabs visible at the top: Controls / Data / Tools.
  Use consistent line icons, restrained cyan selection styling and readable
  contrast. No sliding content or entrance animation. Keyboard arrows/Home/End
  and visible focus support tab navigation; labels remain legible on narrow layouts.
- SIDE-02: Below the tabs show exactly one content view. Opening a detailed
  section replaces its parent content, rather than adding another expanded menu
  above or below it. The other sections and their controls are absent from that
  view. Tabs remain available for direct switching.
- SIDE-03: Detailed views have a small back link naming their parent, such as
  “← Tools”, “← Controls”, or “← Automatic tracking”. Back returns to the parent
  list; it does not disable a tool, clear data or reset settings. Avoid stacked
  accordion menus and redundant breadcrumbs.
- SIDE-04: Use one sidebar scrolling region below the stable tabs. Eliminate
  independent settings/table scrollers and oversized fixed export buttons.
  Navigation is transient UI state, excluded from autosave/project export.
  Remember the last subview of each tab within the session; new sessions start
  in Controls. Returning to a tab preserves its settings and subview.

## Controls

- SIDE-05: Contains measurement settings and execution/parameters for the mode
  selected through the original toolbar. No sidebar manual/automatic selector,
  calibration action buttons, upload buttons or repeated object selector.
- SIDE-06: Selecting automatic tracking explicitly through the toolbar opens
  Controls at its automatic-tracking view. Show the accepted primary template
  diameter and search radius controls, target-selection guidance and the existing
  relevant execution controls. Preserve existing tracking restrictions for images
  and COM. Ordinary data/state updates do not unexpectedly change tabs.
- SIDE-07: Fine-tuning is an entry to its own focused view, with a back link to
  Automatic tracking; it does not expand into a long stack. Preserve the current
  advanced parameters, defaults and matching behavior. Returning restores the
  primary controls without resetting the template or motion history.
- SIDE-08: Measurement settings also has its own focused view: video FPS where
  applicable, mass, uncertainty immediately below mass, time reference, and any
  existing nonduplicated metadata/settings. Preserve scale/origin information
  where useful, without repeating toolbar calibration commands. Keep uncertainty
  separate from automatic-tracking parameters. Manual mode does not show automatic
  parameters. Avoid a large instructions/checklist panel.

## Data

- SIDE-09: Owns the current object's measurements, point-number frame review,
  contextual correction/deletion, Undo when available, and compact tracking CSV
  export. Clear data remains reachable as a secondary data action. Do not mix
  settings or tool menus into this view. Preserve source-index mapping, units,
  uncertainty and the existing undo scope and bounds.
- SIDE-10: Leaving Data cancels any pending point-position correction so a hidden
  editing mode cannot capture video clicks. Merely switching tabs does not remove
  measurements, clear undo history or change the selected object. Preserve the
  existing safe pause/seek behavior when reviewing a frame.

## Tools: focused navigation agreed with the owner

Tools root shows just two clearly labeled cards/entries:

1. Overlay Tools — geometric and visual measurement overlays, including the
   existing tape measure/protractor and other current overlay controls.
2. Spectroscopy & Line Profile — intensity sampling and wavelength analysis.

- SIDE-11: Selecting Overlay Tools replaces the root cards with only its controls
  and a “← Tools” back link. Spectroscopy cards, measurement settings, tracking
  parameters and the table are not stacked underneath. If an overlay has a long
  detailed menu, opening it follows the same replacement/back-link pattern.
- SIDE-12: Selecting Spectroscopy & Line Profile replaces the root cards with
  only that workflow's configuration and a “← Tools” back link. Keep spectral
  configuration here; retain the graph in the main analysis area. Spectral CSV
  remains associated with spectral results and clearly distinct from tracking
  CSV. Preserve all existing calibration, sampling, channel, width and comparison
  functionality; this change does not redesign their algorithms.
- SIDE-13: Back or tab switching preserves configured tools and active overlays.
  Hiding a panel does not disable its applied tool. A restrained active indicator
  on Tools makes continued activity discoverable. Preserve existing rules for
  mutually exclusive drawing interactions and cancel hidden pending interactions
  where necessary; navigation must not leave an invisible placement/edit mode.

Example navigation:

Tools root → Overlay Tools → [optional detailed overlay view]
          ← Tools         ← Overlay Tools

Tools root → Spectroscopy & Line Profile → [optional detailed configuration]
          ← Tools                        ← Spectroscopy & Line Profile

Only the selected view occupies the sidebar body at each step. This same rule
applies to detailed menus inside any of the three tabs.

## Activity and compatibility

- SIDE-14: Switching tabs does not silently stop or restart automatic acquisition.
  Keep running status and a reachable Pause action when away from its controls,
  using a small shared status area rather than another tracking panel. Render
  only one visible copy of each execution action in any sidebar state. Tool and
  point-review actions retain their existing pause/cancellation safeguards.
- SIDE-15: Preserve EN/ES parity, original-media coordinates, saved project
  compatibility, theme contrast and existing functions. Tool/navigation component
  changes must not lose settings through unmounting or reset hook state. Audit
  existing menus for accidental duplicate configuration controls without relocating
  the user's familiar video-preparation toolbar.

## Resume sequence and owner acceptance

1. Start from the restored interface. Verify the recovery copy remains intact:
   ../../backups/before-sidebar-redesign-20260916-201328/physics-app.
   Do not restore .git or discard other accepted uncommitted work.
2. Implement stable tabs and one-view/back navigation, then place existing
   Controls, Data and Tools content into the agreed views. Reuse current feature
   logic; avoid unrelated refactors or speculative features.
3. Verify navigation/state preservation, hidden-interaction cancellation and
   running Pause visibility. Run the existing tests, lint and build. Add focused
   behavioral coverage only where navigation introduces new state risks.
4. Owner tests locally: familiar toolbar remains unchanged; automatic primary
   controls are immediately available; Fine-tuning and measurement settings open
   alone; Tools → Overlay Tools shows only overlay controls; Tools → Spectroscopy
   shows only spectral controls; back/tabs retain settings and applied overlays;
   Data review/correct/delete/undo/export still works; running acquisition can be
   paused outside Controls; EN/ES, keyboard, narrow layout and themes remain usable.
5. Record owner feedback before further changes. No deployment, push or production
   release is authorized. Do not claim browser acceptance from code checks.

## Evidence and preview limitations

The owner selected option 2 of the three generated design previews, then agreed
that Tools is the third content tab and each selected menu replaces the sidebar
body. Generated images are illustrative; incidental styling, duplicated buttons
or sample values in a preview are not requirements. The written behavior above
is authoritative.

The recovery backup was verified again against its SHA-256 manifest before editing.
Controls / Data / Tools now uses transient store navigation, remembered subviews,
keyboard tab navigation and one scrolling body. Fine-tuning and measurement
settings replace their parent views. Tools opens only the selected tool panel.
Data retains point review and compact export; Undo appears when available.
Leaving Data cancels review; leaving spectroscopy cancels pending placement while
preserving calibration and the completed sampling line. Automatic target selection
accepts canvas clicks only while its primary controls are visible. Running tracking
continues across sidebar navigation with one visible Pause action.

Validation: 56 tests pass, including focused state-preservation, non-persistence,
placement cancellation, EN/ES and server-rendered view-isolation/Pause checks.
Lint and production build pass. Existing bundle-size/Browserslist warnings remain.
Server rendering is not browser interaction evidence. Owner checks in the resume
sequence remain pending. No deployment, push or release.

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

---

## Historical rejected design — do not implement

# Sidebar redesign — task tabs

Owner authorized trying proposal 1 after a full verified backup:
../../backups/before-sidebar-redesign-20260916-201328/physics-app.

- TAB-01: Stable equal-width Setup / Track / Data tabs with labeled line icons,
  soft selected surface/cyan accent, no sliding content. Keyboard arrows/Home/End
  move focus and select tabs. Keep tabs visible above one active scrolling region.
- TAB-02: Setup contains FPS for video, scale/origin summaries and actions, time
  reference, expandable object properties (mass followed by position uncertainty).
- TAB-03: Track contains object selection, direct manual/automatic/stop controls,
  accepted automatic controls and manual guidance. Explicit toolbar tracking action
  opens Track. Other state changes do not unexpectedly select a tab. Tab choice
  is session UI state only. Switching tabs does not cancel running tracking; show
  a persistent Pause action while automatic tracking runs outside Track.
- TAB-04: Data owns the table, contextual review actions and modest CSV export.
  Undo edit is visible only when available. Clear object data moves to a secondary
  Data actions disclosure. Preserve point source-index mapping and review safety;
  leaving Data cancels any pending point correction.
- TAB-05: A labeled Tools button exposes existing overlays and spectroscopy in
  the sidebar without another permanent tab or nested scrolling area. Returning
  to a task restores that selected tab. Tool states and fine-tuning are preserved.
- TAB-06: Preserve calibration actions, original-media coordinates, tracking math,
  project schema, existing overlays, data export and EN/ES. No release implied.

Validation: store tests for tab routing/state isolation and non-persistence;
existing point-review/tracking tests; lint/build. Owner evaluates visual layout,
keyboard navigation, touch/narrow layout, toolbar-to-Track behavior, tracking
across tabs, review correction, Tools/spectroscopy access, and EN/ES/themes.

## Implementation evidence

Setup / Track / Data use labeled icons, roving keyboard focus and selected-surface
styling. One shared scrolling area replaces the stacked settings/table scrollers.
Tabs and Tools are transient store state so Header can route explicitly to Track.
The tracking menu and tab buttons share the same mode action. Point review cancels
when leaving its tab. Automatic acquisition continues across tab changes, with a
Pause button outside Track while running; fine-tuning expansion remains in its hook.

Tools holds existing overlay and spectroscopy controls; their state remains mounted.
Clear data is inside Data actions above the table, export is a modest button, and
Undo edit is conditional. The table shows shared uncertainty once and uses px when
uncalibrated. Removed automatic panel scrollIntoView now that the tab routes directly.

57 tests pass, including four new tests for tab-state isolation, non-persistence,
tracking-mode routing, image/COM restrictions and EN/ES parity. Final lint, build,
and whitespace checks pass; existing Browserslist/chunk-size warnings remain.
No browser automation or acceptance claimed. The pre-redesign backup is unchanged.

## Image workspace and consistent controls — 2026-09-20
Images open with equal choices: Analyze a spectrum / Measure the image, alongside
visible media. Hide video transport and tracking/object controls. Image measurement
offers distance in pixels or calibrated units, angle without calibration, and
optional coordinates via toolbar. Change task preserves measurements; restored
image measurements bypass the initial choice. EN/ES parity required.
Standardize sliders and ordinary control accents on cyan/slate with light/dark,
keyboard focus and disabled states. Preserve hamburger icon colors, element
comparison colors and scientific data colors. Browser acceptance remains owner's.

## Heuristic follow-up — 2026-09-20

- SIDE-19: Preserve the equal image-task landing as the intended first screen for a
  fresh image. Keep the image visible, explain each choice in one short sentence and
  avoid preselecting spectroscopy or measurement. Restored project state may bypass
  the choice only when its saved measurements make the intended task unambiguous.
- SIDE-20: Before any media is loaded, the sidebar must not expose video objects,
  motion settings, a data table, measurement settings or tool configuration. It may
  support the workspace Open media action with brief purpose text and must reveal
  relevant controls immediately after the user loads or restores media.
- SIDE-21: Moving between image tasks preserves completed calibration, sampling and
  geometric measurements while cancelling only unfinished placement. Video controls
  must not flash during image loading or task changes.
- SIDE-22: Shared control styling uses the established cyan/slate palette, visible
  keyboard focus and clear disabled states. Preserve the owner-approved colored
  icons in the hamburger menu and the scientific colors for measured series and
  element comparisons. Color must not be the only status cue.
- SIDE-23: Validate the landing, task change, restored image and no-media sidebar
  at desktop and 390px in EN/ES, light/dark, keyboard and touch. Record first-choice
  comprehension and task-switch recovery in the owner review rather than inferring
  them from component tests.

Phase 1 update (2026-09-20): SIDE-20 is implemented by deferring the sidebar until
a video/image source exists. This also covers restored projects awaiting original
media. Existing image-task and video-sidebar behavior resumes on media selection.
Rendered integration checks cover these states; owner browser acceptance is pending.

Owner welcome-dialog revision supersedes SIDE-20's hidden sidebar: the sidebar now
remains visible behind the dimmed, inert app while the welcome dialog offers media
or project opening. Spec 10 defines the authoritative entry/restoration behavior.

## Tracking selection opens Data — 2026-10-08

Selecting Manual or Automatic Tracking opens the Data tab immediately so recorded
measurements are visible. Automatic selection retains its remembered Controls →
Automatic view, accessible by selecting Controls; the running Pause strip remains
available while Data is shown. Stopping tracking keeps the existing Controls route.
This is selection-time navigation; users may switch tabs afterward.

## Owner correction — tracking-mode destinations

Supersedes the automatic portion of the preceding navigation requirement:
Manual Tracking opens Data; Automatic Tracking opens Controls → Automatic.
Automatic target selection and setup/run controls therefore remain available in
its initial view. Users may switch to Data afterward. Preserve touch menu repair.
