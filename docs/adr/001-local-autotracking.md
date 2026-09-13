# ADR 001: Local automatic-tracking integration

Status: accepted for local testing (user requested isolated integration).

Use a pure JavaScript tracking utility, a cancellable media-seeking adapter/hook,
and a separate control panel. Read pixels from a dedicated canvas drawn from the
video element, never from the overlay canvas. Reduce frames to fit 680×380 while
preserving aspect ratio, then map results back to original media pixels.

Enable the UI only with Vite's development flag. Do not add an env override that
could accidentally expose it in a production build. Revisit this gate in a separate
release decision after owner acceptance. Store accepted automatic points through
the existing object model; runtime templates and pending work are not autosaved.

One active object at a time; COM is derived. Cancel pending work when switching
media, object, FPS, view or calibration tools. Scrubbing invalidates the target;
reselect at the desired frame. Stop on lost/ambiguous appearance, never learn from
rejected frames. Fixed-FPS seeking uses the configured FPS, not claimed universal
frame accuracy for variable-frame-rate media.

Tradeoffs: downsampling and conservative appearance gates can pause early under
blur, rotation or weak texture. This iteration uses the main thread; do not claim
worker performance or guaranteed subpixel physical accuracy. Similar distractors
can still be indistinguishable. Retain human inspection and explicit release gates.

## Toolbar mode selection and sidebar controls

Owner approved an icon-only tracking menu as the single entry point. Manual and
Automatic are mutually exclusive; explicit Stop tracking exits either. App owns
one shared video ref and tracking hook. Header chooses modes; Sidebar configures
and runs the same controller; VideoCanvas displays media and captures selections.
The prototype algorithm and production gate remain unchanged. Pre-selection
preview boxes were evaluated separately and are not part of this UI revision.


## Paused tuning and tool disclosures

Retain the accepted session while tuning. Rebuild the template only when its size
changes, using the current decoded frame; other options preserve appearance and
motion history. Preview updates are separate from measurement writes. Pause is a
request to stop after the current frame completes, keeping the template aligned
with the displayed frame. Navigation/context changes remain immediate aborts.
Settings and reset actions are disabled until an in-flight frame settles.

Use independent native details/summary disclosures for optional tool groups.
Their local expansion state never changes overlay state or project data. The
upper heading describes analysis settings; the table has its own heading.


## Shared measurement clearing

Keep uncertainty with general settings, directly after Mass. Automatic mode
shows its sliders immediately. Clearing measurements belongs in the Data Table
heading and uses an explicit object-scoped label. Abort automatic work before
clearing that object's data, preserving options for retrying with a new target.


Native-pixel matching now supersedes the initial downsampling/hard-keyframe rules;
see `003-native-pixel-tracking.md` and spec08 section10. Earlier results are historical.
