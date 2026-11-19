# Keyboard shortcuts for manual tracking and frame stepping

Owner approved 2026-11-18, following a colleague's recommendation: record a point
with the space bar, step frames with keys, and undo the last point with Backspace.
Local implementation; browser acceptance is owner-performed. No release implied.

## Requirements

- KEY-01: In manual tracking (reticle visible, Object A or B), Space records a point
  at the reticle and advances exactly one frame, through the same routine as a
  reticle tap. Coordinates, timestamp and the midpoint stepping calculation are
  unchanged. On a still image it records without stepping.
- KEY-02: Right arrow or `.` steps one frame forward; Left arrow or `,` steps one
  frame back. They call the existing frame buttons' routine, including point-review
  cancellation and automatic-tracking navigation. Video only. Holding the key may
  repeat; steps requested while a frame is still decoding are dropped as before.
- KEY-03: In manual tracking, Backspace removes the active object's last point (the
  same point as Undo last point) and returns the video to that point's frame so it
  can be marked again. Nothing happens with no points, for COM, or while seeking.
- KEY-04: Outside manual tracking, Space plays/pauses a video like the Play button.
  In automatic tracking Space and Backspace do nothing, so an accidental press
  cannot discard the selected target. Frame keys behave like the frame buttons.
- KEY-05: Shortcuts never take keys from other controls. Ignore them when: the
  Tracker view is hidden; no media is loaded; a dialog (welcome, FPS, distance) is
  open or the app is inert; Ctrl/Alt/Meta is held; focus is in a text/number field,
  select, menu, dialog, tab list or data table; or focus is on any control reached
  by keyboard, which keeps its native Space/arrow behaviour.
  A control left focused by a mouse click or touch is blurred and the shortcut
  applies. Arrow and `,`/`.` keys always stay with a focused slider.
- KEY-06: Space and Backspace ignore key auto-repeat. A handled key does not scroll
  the page or activate a button.
- KEY-07: Transport button tooltips show their keys and the manual-tracking help
  mentions them, in EN/ES. No project-format, tracking-algorithm or pointer changes.

Not included: moving the reticle with the keyboard (deferred keyboard-measurement
work), shortcuts for automatic tracking, or user-configurable keys.

## Validation

Unit tests for the key/focus decision table; component tests that drive the real
VideoCanvas key handler for record, repeat, decode guard, frame keys, Backspace,
dialog/view/automatic gating and play/pause. Full tests, lint and build. Owner
checks on PC/Chromebook: track several frames with mouse + Space; step with arrows
and `,` `.`; Backspace and re-mark; type in the FPS/mass/distance fields and use
sliders, tabs and menus to confirm keys are not taken; EN/ES tooltips.

## Correction after owner test — 2026-11-18

Owner saw no effect in the browser. The first implementation asked `:focus-visible`
whether a control had been reached by keyboard. Browsers turn that on for a
mouse-focused button as soon as a key is pressed, and choosing Manual tracking
returns focus to the tracking button, so every shortcut was ignored there. This
cause was identified from the code and the documented browser behaviour, not from
a browser trace. KEY-05 now records how focus was obtained (last input before the
focus change: key or pointer) and uses that instead. Regression test covers a key
press after a pointer focus and script focus after a mouse choice.
