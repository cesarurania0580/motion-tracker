# Automatic tracking: validation record

Status: owner testing found open issue AT-BUG-001 (early tracking interruption).
Investigation deferred to the next session at the owner's request; not approved for production.
Environment: Node 26.8.1, installed dependencies, Chromium-based in-app browser.
Test media: `../prototypes/test-videos/20260201_162430.mp4`, 30 fps portrait footage.
No external video upload or production deployment was performed.

## Automated evidence

`npm test`: 9 passing tests. `npm run lint`: passes. `npm run build`: passes.
Existing non-blocking build warnings: large bundle and outdated Browserslist data.
`App.jsx` still has its pre-existing lint-disable directive.

| Requirement | Evidence | Status |
| --- | --- | --- |
| AT-01 | Local checkbox rendered; production preview on port 5174 contains zero automatic-tracking checkboxes. Tracking engine's seek-error strings absent from production JS. | Passed |
| AT-02 | Seed on A and B; COM disables controls. Flat-template unit test. | Passed for tested video; static image smoke pending |
| AT-03 | Browser Step added exactly one point; Run followed the fall; Pause changed to selection-required status. Seek tests cover decode completion and timeouts. | Passed |
| AT-04 | Lost-target and immutable-session tests. Browser run stopped at Object lost near 9.85 s, retained 12 points, Run disabled. | Passed for tested scenarios |
| AT-05 | Scale, boundary, and same-frame tests. Re-selected at 42% and 67% zoom without duplicate row or changed seed coordinates. | Passed |
| AT-06 | Seek abort tests; switching B → A during a run disabled automatic tracking and left A's 12 points intact. Changing to Analysis disabled mode. Scrubbing invalidated seed; Pause required re-selection in that earlier revision (superseded by AT-UI-08 below). | Passed for those cases; media/FPS/calibration combinations still require broader checks |
| AT-07 | Graph displayed automatic points; JSON round-trip/schema unit test. Browser reload restored all 12 A measurements; reopening the media preserved them. Project-save click produced no browser console errors, but download-event capture timed out: file export/reload not verified. | Partial |
| AT-08 | EN/ES controls and status observed; preview and sliders implemented. | Passed basic localization; full tuning matrix pending |
| AT-09 | Verified baseline archive + manifest; feature branch; production preview controls unchanged. | Passed isolation; full manual feature regression pending |

## Owner test steps

1. Start `npm run dev -- --host 127.0.0.1` and open the printed localhost URL.
2. Load the test video, choose Object A, set 30 fps, scrub near 9.45 s.
3. Open the toolbar tracking icon, choose Automatic tracking, then click the
   falling object's center. Its controls appear below FPS/Mass in the sidebar.
4. Track one frame; verify one new row and target marker. Run through the fall.
5. Confirm it stops on target loss and does not append wall/ruler measurements.
6. Repeat on another object/video, at another zoom, and with different settings.
7. Pause during a run; allow the current frame to finish, adjust settings, and
   resume with the same selection. Scrub backward and retrack an existing frame: its measurement should be replaced, not duplicated.
8. Switch objects, open Analysis, change FPS, use manual tracking/origin/scale,
   or replace the media during a run: no stale points should be written.
9. Set scale/origin, inspect graphs/curve fits, export CSV and JSON; reload JSON,
   reopen the corresponding media and compare values. Check autosave restoration.
10. Disable Automatic tracking; verify manual reticle, undo/drag/delete, calibration,
    tape/protractor, spectroscopy and COM. Check desktop and touch/mobile layouts.

## Limitations and release gate

Heuristic template/appearance checks can stop early with blur/rotation/low texture,
and can mistake very similar objects. Downsampling reduces measurement resolution;
subpixel interpolation is not a guarantee of physical precision. Fixed-FPS seeking
assumes the user's FPS matches the footage. Benchmark high-resolution/long videos
and maximum settings before claiming responsiveness across devices.

The baseline app labels uncalibrated coordinates as meters; automatic coordinates
follow its existing raw-pixel model. Calibrate before interpreting physical units.
The sidebar's missing origin selector was corrected during integration because it
previously displayed `(NaN, NaN)` instead of the store's unset origin.

Do not remove the development-only gate until the remaining checks pass, the owner
accepts the feature and explicitly requests a release. Confirm Netlify's actual
branch/commit before any deployment work.

## Calibration follow-up: missing measuring bar

User reported Set Scale no longer displayed its dynamic measuring bar.
Browser reproduction produced `ReferenceError: setIsSettingOrigin is not defined`
in App's handler: calibration mode enabled but execution stopped before creating
endpoints. This missing binding also exists in baseline commit 98ed63e, preceding
the automatic-tracking integration. Restored the selector and enabled no-undef
checking in App; other historical lint suppression remains.

CAL-01 regression test failed on the original source and passes after the fix.
`npm test`: 10 passing; lint and build pass. Browser verification with the test video:
- Set Scale displays green bar and two handles.
- Both handles drag independently; the connecting bar updates.
- Enter Distance + Save establishes a scale factor (533 px/m in the arbitrary test).
- Hide/Show preserves the calibration value.
- Enabling calibration from automatic mode disables automatic mode.
- Test calibration was reset; the page was left with an uncalibrated measuring bar
  ready for the user's real reference distance. Existing tracking points retained.


## AT-BUG-001: Integrated tracker stops after the first few frames

**Status:** Open — investigate next session. User-reported; not independently
reproduced or diagnosed. No tracking code changes made for this report.

**Owner observation:** With the test video, the standalone prototype tracks
successfully without an initial interruption. In the integrated app, automatic
tracking stops around the third frame. The user must click the object again;
after reselecting, tracking follows the object very well.

**Comparison inputs:**
- Video: `../prototypes/test-videos/20260201_162430.mp4`.
- Reference prototype: `../prototypes/autotracker/index.html`.
- Integrated app: local Vite development app on `local/autotracking-integration`.
- Exact starting timestamp, selection location, settings, and displayed stop
  status were not recorded. “Third frame” is approximate.

**Expected:** Under equivalent starting conditions and settings, the integrated
tracker should follow this video continuously as the prototype does, without
requiring an early second selection. Genuine target loss must still stop tracking
without adding background points.

**Next-session reproduction plan:**
1. Match the video, starting timestamp, selected target and tracking settings in
   both versions; record the precise conditions rather than assuming defaults.
2. Reproduce the early stop and capture its status, frame times and accepted points.
3. Compare the initial template, analyzed frames, search results and rejection
   conditions between implementations. Determine the cause from evidence.
4. Add a regression at the relevant boundary, implement a focused fix, and verify
   both uninterrupted initial tracking and the existing object-loss safeguards.

**Acceptance impact:** AT-02/AT-03/AT-04 integration parity remains open. Earlier
smoke-test results above apply only to their recorded setup; they do not resolve
this report. Owner acceptance and release remain pending.


## Tracking menu / sidebar revision (owner browser evaluation pending)

User requested code-focused work and will perform browser testing. No browser was
opened or automated for this revision. Historical browser checks above describe
the earlier layout and must not be treated as validation of this layout.

Implemented: icon-only toolbar menu with Manual/Automatic choices, checked mode,
translated tooltips/accessibility labels, keyboard navigation and Stop tracking.
Automatic selection prepares a target without starting playback or recording.
The separate automatic toggle and top strip are removed; controls, status,
settings and preview now appear below FPS/Mass in the sidebar. A shared controller
and video ref in App avoid separate sessions in Header and VideoCanvas.

Code validation: 10 automated tests pass; lint and production build pass. Checked
production output for absence of the automatic seek engine. Existing bundle-size
and Browserslist warnings remain. AT-BUG-001 and pre-selection preview boxes were
not investigated or changed in this revision.

Owner checks:
- Click the tracking icon: Manual/Automatic choices appear; active mode is checked.
- Select Manual: the reticle workflow works. Stop tracking exits it.
- Select Automatic: sidebar controls appear and await a click on the object.
- Run/Pause/Step and sliders operate as before; choosing Manual or Stop during a
  run cancels it. Re-choosing Automatic while already active preserves the target.
- COM cannot start tracking; static images allow Manual but disable Automatic.
- Test keyboard navigation (Tab, arrows, Escape), outside-click dismissal, EN/ES,
  and sidebar scrolling. Toolbar stays icon-only throughout.


## Sidebar organization and live tuning (AT-UI-06–09)

Implemented locally: Analysis Settings heading above controls; Data Table heading
above measurements; independent Overlay Tools and Spectroscopy disclosures with
active counts. A disclosure hides controls without changing the tools' store state.
Initial expansion reflects active tools when the sidebar mounts; subsequent
expansion/collapse is the user's choice.

Paused tuning preserves selection. Diameter changes recapture a clean template
and reset motion history; radius/prediction change the search preview, while
cutoff/evolution preserve the template. Pause finishes the current decoded frame
and retains a successful target. Reselect clears only the runtime selection;
Restore defaults resets options and updates a valid selected target. Neither
settings nor either reset action writes measurements. Clicking to select a target
still records its seed point, as before.

Code evidence: 13 tests pass, including new session-preservation, current-frame
recapture, default-size restoration, and invalid patch tests. Lint and production
build pass. Build retains the existing chunk-size/Browserslist warnings. No browser
tests were performed for this revision; production autotracking remains gated off.
The following owner acceptance checks remain pending:

1. Verify both headings follow A/B/COM; switch EN/ES and light/dark themes.
2. Expand either tool group independently. Enable a tool, collapse the group,
   verify the overlay stays visible and its active count remains in the heading.
3. Select a target and adjust diameter/radius; both boxes should update immediately.
   Adjust cutoff/evolution/prediction without losing selection or changing rows.
4. Run, Pause, wait for the current frame to finish, then tune and resume. Settings
   must stay disabled while finishing; at most that in-flight frame is recorded.
5. Reselect object must keep settings and measurements but clear the target.
   Restore defaults must reset controls and boxes without changing measurements.
6. Enlarge a target near an edge until invalid; require a fresh selection, keeping
   measurements intact. Scrubbing and mode changes must still cancel tracking.
7. Check scrolling with expanded spectroscopy and automatic settings on a small
   viewport, with the measurements accessible below.

AT-BUG-001 remains open for its separately deferred investigation.


## General settings and shared Clear Data (AT-UI-10–12)

Blur / Uncertainty now follows Mass, ahead of automatic controls. Automatic
sliders and preview no longer require expanding a disclosure. The shared Data
Table heading contains Clear A data / Clear B data (EN/ES), disabled when empty
and hidden for COM. Clearing aborts automatic work and invalidates the target
before using the existing active-object point setter; options are preserved and
automatic mode remains ready for a fresh selection.

Validation: all 13 existing tests, lint and production build pass. Existing
Browserslist and bundle-size warnings remain. Owner browser checks are pending:
verify order and visible sliders, clear while running/pausing without later rows
appearing, preserve the other object's data, verify disabled empty state and COM
hiding, and check the header layout in both languages. No browser was opened.


## Native-pixel matching update

Current matching, defaults and benchmark evidence are documented in
[rocket-autotracking.md](rocket-autotracking.md). Historical reduced-image scoring
and template sizes above no longer describe the active development engine.
