# Focused sidebar content with Controls / Data / Tools

Status: implemented locally 2026-09-17; owner browser acceptance pending.
Supersedes rejected ADR 005. Detailed requirements: spec 14.

Keep the familiar preparation and tracking-mode toolbar in its current location.
The sidebar has three content tabs, Controls / Data / Tools, rather than another
video-preparation workflow. Each tab and detailed menu occupies the sidebar body
alone; selecting a section replaces its parent list. Stable tabs and a small
parent back link provide navigation without stacked expanded menus.

Tools root has Overlay Tools and Spectroscopy & Line Profile entries. Selecting
either displays only that workflow's controls. Spectral configuration belongs in
Tools; its plot and spectral export remain associated with spectral results.
Fine-tuning and measurement settings follow the same focused-subview pattern.

Navigation is transient session state and must preserve tool settings, overlays,
tracking state and project compatibility. Cancel hidden pending editing/drawing
interactions safely. Running tracking retains reachable Pause without duplicating
its entire panel. Keep one sidebar scroll region and synchronized EN/ES labels.

The rejected layout remains superseded. The agreed navigation is implemented;
state and server-rendered checks pass. Owner browser testing remains pending.

## Owner revision — inline Tools expansion and FPS entry

The owner approved retaining both Tools category buttons and expanding content
below them, one section at a time. This supersedes the replacing Tools subviews
and their back links; Controls retains its focused subviews. CSS grid intrinsic
height and opacity animate for 220 ms without measuring content or fixed height
limits. Closed regions are inert and aria-hidden; reduced motion removes the
transition. Existing tool state remains in the store.

New video selection routes to Measurement settings and resets FPS confirmation.
The inline prompt explains timing and supports explicit confirmation even when the
default FPS is correct. Tab changes do not reset confirmation or reroute settings.
Clear object data is a directly visible Data action, without a disclosure.

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
