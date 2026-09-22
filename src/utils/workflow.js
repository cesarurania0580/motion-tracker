// Readiness is derived from measurements/media, never from checklist clicks.
export function workflowReadiness(state) {
  const hasMedia = Boolean(state.videoSrc || state.imageSrc);
  const ready = hasMedia && !state.error && state.videoDims.w > 0 &&
    (state.imageSrc ? Boolean(state.imageObj) : state.duration > 0);
  const light = Boolean(state.lineProfile);
  const count = state.activeObjId === 'COM'
    ? (state.objects.find(o => o.id === 'A')?.points || []).filter(a =>
      (state.objects.find(o => o.id === 'B')?.points || []).some(b => Math.abs(a.time-b.time)<0.005)).length
    : (state.objects.find(o => o.id === state.activeObjId)?.points.length || 0);
  const measured = light ? state.spectralData.length > 1 : count > 0;
  const prepared = ready && (light || (Boolean(state.pixelsPerMeter) && Boolean(state.origin) &&
    (!state.videoSrc || state.fpsConfirmed)));
  return {ready, light, count, measured, prepared,
    suggested: !ready ? 0 : !prepared ? 1 : !measured ? 2 : state.viewMode !== 'analysis' ? 3 : 4,
    complete: [ready, prepared, measured, measured && state.viewMode === 'analysis', false]};
}

// Guidance never competes with active measurement or spectroscopy.
export function nextToolbarStep(state, trackingActive = false) {
  if (trackingActive || state.isTracking || state.viewMode !== 'tracker') return null;
  const flow = workflowReadiness(state);
  if (!flow.ready) return 'media';
  if (state.imageSrc) return null;
  if (state.videoSrc && !state.fpsConfirmed) return null;
  if (flow.light || state.wavelengthCalibration || flow.count > 0 || state.activeObjId === 'COM') return null;
  if (!state.pixelsPerMeter) return 'scale';
  if (!state.origin || !state.axesConfirmed) return 'axes';
  return 'track';
}
