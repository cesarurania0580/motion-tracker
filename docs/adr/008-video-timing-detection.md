# Video timing detection and confirmation

Status: implemented locally; owner browser evaluation pending.

Owner revision: the CFR-only restriction below is superseded. Accept variable-rate
metadata and use its reported average FPS. Offer 30/60/120/240 presets (within 10%
of the detected rate), retaining exact timing behind the matching choice. Other
supports uncommon rates and explicit numeric overrides. Unknown metadata defaults
to 30 with an honest default label. Saved FPS remains the initial baseline.
This restores compatibility; average-rate stepping is not exact per-frame VFR seeking.

Use MediaInfo.js 0.3.8 in a dedicated worker created only when a video is selected.
Vite emits the worker and WASM as local assets; no media upload or CDN request is
required. Read file slices up to a cumulative 32 MiB and stop after 15 seconds.
Terminate workers on completion, timeout, replacement, project loading or unmount;
ignore stale callbacks. Unknown metadata/failures require manual entry.

Only explicit CFR metadata from a single video track supplies a detected FPS.
Retain rational-rate precision when numerator/denominator are present. VFR blocks
confirmation; multiple tracks, unknown mode and invalid rates are not inferred to
be constant. The supported workflow is original, normal-speed, constant-rate video.

Detection results are local component state and never change project data. The
modal defaults to saved FPS for restored projects, reports a mismatch and requires
acknowledgment to change saved timing. Confirmation writes FPS and its transient
confirmation flag together. Review frame rate reopens the same modal. Playback,
manual tracking and automatic acquisition are stopped or blocked during review.

Existing points store media timestamps. Preserve them: this increment affects
frame stepping and identification, not retrospective time scaling. Image analysis
does not load the detector or require FPS. Scale/pixel/axes guidance remains separate.

Tradeoff: the worker adds about 12 kB JS and 2.6 MB WASM (about 981 kB gzipped),
loaded on video selection. Unsupported or costly metadata inspection falls back to
manual entry. Actual classroom browser latency remains an owner validation item.
