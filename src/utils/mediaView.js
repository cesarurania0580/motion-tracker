// What part of the video or image the student can currently see, in media pixels.
// Tools that appear on request (scale bar, tracking reticle) are placed inside it
// so a zoomed-in student does not have to zoom out to find them.

const finite = values => values.every(Number.isFinite);

// viewport and canvas are client rectangles ({left, top, width, height}).
// Returns {x0, y0, x1, y1} clamped to the media, or null when none of it is visible.
export function visibleMediaRect(viewport, canvas, zoom, dims) {
  if (!viewport || !canvas || !dims || !finite([zoom, dims.w, dims.h, viewport.left, viewport.top,
    viewport.width, viewport.height, canvas.left, canvas.top]) || zoom <= 0 || dims.w <= 0 || dims.h <= 0) return null;
  const x0 = Math.max(0, (viewport.left - canvas.left) / zoom);
  const y0 = Math.max(0, (viewport.top - canvas.top) / zoom);
  const x1 = Math.min(dims.w, (viewport.left + viewport.width - canvas.left) / zoom);
  const y1 = Math.min(dims.h, (viewport.top + viewport.height - canvas.top) / zoom);
  return x1 > x0 && y1 > y0 ? {x0, y0, x1, y1} : null;
}

export function viewCenter(view, dims) {
  if (view) return {x: (view.x0 + view.x1) / 2, y: (view.y0 + view.y1) / 2};
  return {x: (dims?.w || 600) / 2, y: (dims?.h || 400) / 2};
}

// A new scale bar: horizontal, centred in the view and a third of its width,
// so both handles are on screen at any zoom. Without a view it spans the
// middle fifth of the media, as it always did.
export function scaleBarInView(view, dims) {
  const w = dims?.w || 600, h = dims?.h || 400;
  if (!view) return [{x: w * 0.4, y: h * 0.5}, {x: w * 0.6, y: h * 0.5}];
  const {x, y} = viewCenter(view);
  const half = (view.x1 - view.x0) / 6;
  return [{x: x - half, y}, {x: x + half, y}];
}

// How far to scroll so a media point sits at the centre of the viewport.
// canvas is measured after the new zoom has been laid out.
export function scrollToCenter(point, viewport, canvas, zoom) {
  return {
    dx: canvas.left + point.x * zoom - (viewport.left + viewport.width / 2),
    dy: canvas.top + point.y * zoom - (viewport.top + viewport.height / 2),
  };
}

const inside = (point, view) => point.x >= view.x0 && point.x <= view.x1 && point.y >= view.y0 && point.y <= view.y1;

// Where the reticle appears when manual tracking starts. The object is usually
// where it was last marked, so the recorded point nearest the current time is
// used when the student can see it; otherwise the centre of the view.
export function reticleStart(view, dims, points = [], time = 0) {
  let nearest = null;
  for (const point of points) {
    if (!finite([point?.x, point?.y, point?.time])) continue;
    if (!nearest || Math.abs(point.time - time) < Math.abs(nearest.time - time)) nearest = point;
  }
  if (nearest && (!view || inside(nearest, view))) return {x: nearest.x, y: nearest.y};
  return viewCenter(view, dims);
}

// Which way a point lies outside the view: {h, v} with -1 (left/up), 0 or 1
// (right/down); null when it is visible.
export function offscreenDirection(point, view) {
  if (!point || !view || inside(point, view)) return null;
  return {h: point.x < view.x0 ? -1 : point.x > view.x1 ? 1 : 0, v: point.y < view.y0 ? -1 : point.y > view.y1 ? 1 : 0};
}

// Tools the student is using that have left the screen, with the direction to
// find them. A scale bar wholly out of view is one item; when the student has
// zoomed onto part of it, each hidden end is listed on its own.
export function offscreenTools({view, reticle = null, scale = null}) {
  if (!view) return [];
  const tools = [];
  const reticleWay = offscreenDirection(reticle, view);
  if (reticleWay) tools.push({id: 'reticle', point: reticle, ...reticleWay});
  if (scale?.length === 2) {
    const middle = {x: (scale[0].x + scale[1].x) / 2, y: (scale[0].y + scale[1].y) / 2};
    const ways = scale.map(point => offscreenDirection(point, view));
    const middleWay = offscreenDirection(middle, view);
    if (ways[0] && ways[1] && middleWay) tools.push({id: 'scale', point: middle, ...middleWay});
    else ways.forEach((way, index) => {if (way) tools.push({id: `scale${index}`, point: scale[index], ...way});});
  }
  return tools;
}

// The mounted media canvas registers how to measure the view; code without
// access to the DOM (the store) asks through currentMediaView().
let provider = null;
export function setMediaViewProvider(fn) {provider = typeof fn === 'function' ? fn : null;}
export function currentMediaView() {
  try {return provider ? provider() : null;} catch {return null;}
}
