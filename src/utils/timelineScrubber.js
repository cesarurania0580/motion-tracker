// Timeline only: measurement stepping and automatic tracking keep their own seeks.
export function createTimelineScrubber(video, {
  onFrame, onBusy, onError,
  schedule = requestAnimationFrame, unschedule = cancelAnimationFrame,
  timeoutMs = 5000,
}) {
  let pending = null, target = null, scheduled = null, timer = null;
  let busy = false, disposed = false;
  const setBusy = value => { if (busy !== value) { busy = value; onBusy(value); } };
  function cancel() {
    pending = target = null;
    if (scheduled !== null) unschedule(scheduled);
    scheduled = null;
    clearTimeout(timer);
    setBusy(false);
  }
  function fail() { cancel(); onError(); }
  function queue() {
    if (scheduled === null) scheduled = schedule(() => { scheduled = null; pump(); });
  }
  function completed() {
    if (disposed || target === null || video.seeking) return;
    if (Math.abs(video.currentTime - target) > 0.001) { cancel(); return; }
    clearTimeout(timer);
    target = null;
    onFrame(video.currentTime);
    if (pending !== null) queue();
    else setBusy(false);
  }
  function pump() {
    if (disposed || target !== null || pending === null) return;
    target = pending; pending = null;
    if (!video.seeking && Math.abs(video.currentTime - target) < 0.000001 && video.readyState >= 2) {
      completed(); return;
    }
    timer = setTimeout(fail, timeoutMs);
    try { video.currentTime = target; } catch { fail(); }
  }
  function externalSeek() {
    // A different navigation owner wins; never follow it with an old slider request.
    if (busy && (target === null || Math.abs(video.currentTime - target) > 0.001)) cancel();
  }
  function mediaError() { if (busy) fail(); }
  video.addEventListener('seeked', completed);
  video.addEventListener('seeking', externalSeek);
  video.addEventListener('error', mediaError);
  return {
    get busy() { return busy; },
    request(time) {
      if (disposed || !Number.isFinite(time)) return;
      video.pause();
      pending = Math.max(0, Math.min(time, Number.isFinite(video.duration) ? video.duration : time));
      setBusy(true);
      if (target === null) queue();
    },
    cancel,
    dispose() {
      disposed = true; cancel();
      video.removeEventListener('seeked', completed);
      video.removeEventListener('seeking', externalSeek);
      video.removeEventListener('error', mediaError);
    },
  };
}
