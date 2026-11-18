# 013 — Coordinate timeline preview seeks separately from measurement stepping

2026-11-17. Local trial; browser acceptance pending.

Timeline input previously assigned video.currentTime on every input event, even
while decoding another target, and published the requested time before completion.
The visible canvas and playback could therefore lag behind slider state.

Use a timeline-only coordinator with one in-flight seek and one latest pending
target. Schedule work on animation frames, draw completed frames, and pause playback
on timeline input. Slider draft state is local; completed frame time/index are
published together. Never use approximate keyframe seeks for measurement readiness.

Guard canvas measurement and transport handlers while timeline work or a video
seek is pending. Preserve the existing manual midpoint stepping calculation and
automatic tracker's seekVideo implementation. External navigation supersedes queued
timeline work; disposal, decode errors and timeout clear pending work/listeners.

This bounds request pressure; it cannot guarantee a particular preview frame rate
for every video/device. Real browser testing remains necessary. The new pending-seek
guard intentionally ignores rapid repeat measurement clicks until decoding finishes.
