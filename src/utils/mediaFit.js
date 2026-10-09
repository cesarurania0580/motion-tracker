// A hidden or undersized viewport cannot provide a usable fit measurement.
export function mediaFitZoom(width, height, viewportWidth, viewportHeight) {
  if (![width,height,viewportWidth,viewportHeight].every(Number.isFinite) ||
      width <= 0 || height <= 0 || viewportWidth <= 40 || viewportHeight <= 40) return null;
  return Math.min(1,(viewportWidth-40)/width,(viewportHeight-40)/height);
}

export function nextMediaZoom(current, direction, fit) {
  if (direction === 'in') return Math.min(4, current * 1.25);
  if (!Number.isFinite(fit) || fit <= 0) return current;
  if (direction === 'fit') return fit;
  // A larger viewport may now fit at a higher scale: Out must not zoom in.
  if (direction === 'out') return Math.min(current, Math.max(fit, current / 1.25));
  return current;
}
