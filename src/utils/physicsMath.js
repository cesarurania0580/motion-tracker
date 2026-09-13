// --- MATH HELPER: NICE NUMBERS ALGORITHM ---
export const calculateNiceScale = (minValue, maxValue, lockZero = false) => {
  if (!isFinite(minValue) || !isFinite(maxValue) || minValue === maxValue) return { min: 0, max: 10, ticks: [0, 10], step: 1 };

  const range = maxValue - minValue;
  const padding = range === 0 ? 1 : range * 0.05;
  const paddedMin = (lockZero && minValue >= 0) ? 0 : minValue - padding;
  const paddedMax = maxValue + padding;
  const paddedRange = paddedMax - paddedMin;

  const targetTickCount = 6; 
  const rawStep = paddedRange / targetTickCount;
  const mag = Math.floor(Math.log10(rawStep));
  const magPow = Math.pow(10, mag);
  let magStep = rawStep / magPow;

  if (magStep < 1.5) magStep = 1;
  else if (magStep < 2.25) magStep = 2;
  else if (magStep < 3.5) magStep = 2.5; 
  else if (magStep < 7.5) magStep = 5;
  else magStep = 10;

  const niceStep = magStep * magPow;
  const niceMin = Math.floor(paddedMin / niceStep) * niceStep;
  const niceMax = Math.ceil(paddedMax / niceStep) * niceStep;

  const ticks = [];
  for (let t = niceMin; t <= niceMax + (niceStep/100); t += niceStep) {
    ticks.push(parseFloat(t.toFixed(4))); 
  }

  return { min: niceMin, max: niceMax, ticks, step: niceStep };
};

// --- MATH HELPER: GAUSSIAN ELIMINATION SOLVER ---
export const solveLinearSystem = (matrix, vector) => {
  const n = vector.length;
  const A = matrix.map((row, i) => [...row, vector[i]]);
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]); let maxRow = i;
    for (let k = i + 1; k < n; k++) { if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; } }
    for (let k = i; k < n + 1; k++) { const tmp = A[maxRow][k]; A[maxRow][k] = A[i][k]; A[i][k] = tmp; }
    for (let k = i + 1; k < n; k++) { if (Math.abs(A[i][i]) < 1e-10) continue; const c = -A[k][i] / A[i][i]; for (let j = i; j < n + 1; j++) { if (i === j) A[k][j] = 0; else A[k][j] += c * A[i][j]; } }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) { if (Math.abs(A[i][i]) < 1e-10) return null; x[i] = A[i][n] / A[i][i]; for (let k = i - 1; k > -1; k--) { A[k][n] -= A[k][i] * x[i]; } }
  return x;
};

// --- MATH HELPER: POINT TO SEGMENT PROJECTION (WITH OPTIONAL CLAMPING) ---
export const projectPointToSegmentT = (cx, cy, ax, ay, bx, by, clamp = true) => {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = cx - ax;
  const wy = cy - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq === 0) return 0;
  const t = (wx * vx + wy * vy) / lenSq;
  return clamp ? Math.max(0, Math.min(1, t)) : t;
};

// --- MATH HELPER: EUCLIDEAN POINT TO SEGMENT DISTANCE ---
export const getDistanceToSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1)**2 + (py - y1)**2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX)**2 + (py - projY)**2);
};
