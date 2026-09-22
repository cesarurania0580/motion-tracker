// A hidden or undersized viewport cannot provide a usable fit measurement.
export function mediaFitZoom(width, height, viewportWidth, viewportHeight) {
  if (![width,height,viewportWidth,viewportHeight].every(Number.isFinite) ||
      width <= 0 || height <= 0 || viewportWidth <= 40 || viewportHeight <= 40) return null;
  return Math.min(1,(viewportWidth-40)/width,(viewportHeight-40)/height);
}
