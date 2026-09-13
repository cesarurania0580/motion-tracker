export function compareAppearance(frameData, template, x, y) {
      const n = template.width * template.height;
      let sumT = 0, sumF = 0, sumTT = 0, sumFF = 0, sumTF = 0;
      // Luminance structure distinguishes a target from similar-colored flat walls.
      for (let j = 0; j < template.height; j++) {
        for (let i = 0; i < template.width; i++) {
          const ti = (j * template.width + i) * 4;
          const fi = ((y + j) * frameData.width + x + i) * 4;
          const t = .299 * template.data[ti] + .587 * template.data[ti + 1] + .114 * template.data[ti + 2];
          const f = .299 * frameData.data[fi] + .587 * frameData.data[fi + 1] + .114 * frameData.data[fi + 2];
          sumT += t; sumF += f; sumTT += t * t; sumFF += f * f; sumTF += t * f;
        }
      }
      const vt = Math.max(0, sumTT - sumT * sumT / n);
      const vf = Math.max(0, sumFF - sumF * sumF / n);
      const correlation = vt > 0 && vf > 0 ? (sumTF - sumT * sumF / n) / Math.sqrt(vt * vf) : 0;
      const contrastRatio = vt > 0 ? Math.sqrt(vf / vt) : 0;
      // Conservative prototype guard: stop rather than silently learn background.
      return { correlation, contrastRatio, valid: vt / n >= 4 && correlation >= .65 && contrastRatio >= .35 && contrastRatio <= 3 };
    }

export function matchTemplate(srcData, templateData, searchRect, templateW, templateH) {
      const { data: sData, width: sW, height: sH } = srcData;
      const { data: tData } = templateData;

      let minDev = Infinity;
      let bestX = 0;
      let bestY = 0;

      const startX = Math.max(0, searchRect.x);
      const endX = Math.min(sW - templateW, searchRect.x + searchRect.width);
      const startY = Math.max(0, searchRect.y);
      const endY = Math.min(sH - templateH, searchRect.y + searchRect.height);

      const gridW = endX - startX + 1;
      const gridH = endY - startY + 1;
      if (gridW <= 0 || gridH <= 0) return null;

      // Cost evaluation array for sub-pixel peak interpolation
      const scores = Array.from({ length: gridH }, () => new Float32Array(gridW));

      for (let sy = startY; sy <= endY; sy++) {
        for (let sx = startX; sx <= endX; sx++) {
          let dev = 0;

          for (let ty = 0; ty < templateH; ty++) {
            const sRowIdx = (sy + ty) * sW;
            const tRowIdx = ty * templateW;

            for (let tx = 0; tx < templateW; tx++) {
              const sIdx = (sRowIdx + (sx + tx)) * 4;
              const tIdx = (tRowIdx + tx) * 4;

              const dr = sData[sIdx] - tData[tIdx];
              const dg = sData[sIdx+1] - tData[tIdx+1];
              const db = sData[sIdx+2] - tData[tIdx+2];

              dev += dr*dr + dg*dg + db*db;
            }
          }

          scores[sy - startY][sx - startX] = dev;
          if (dev < minDev) {
            minDev = dev;
            bestX = sx;
            bestY = sy;
          }
        }
      }

      // Perform Sub-pixel refinement (Quadratic peak fitting)
      let subX = bestX + templateW / 2;
      let subY = bestY + templateH / 2;

      const gridX = bestX - startX;
      const gridY = bestY - startY;

      if (gridX > 0 && gridX < gridW - 1 && gridY > 0 && gridY < gridH - 1) {
        // Fit 1D horizontal parabola
        const sL = scores[gridY][gridX - 1];
        const sC = scores[gridY][gridX];
        const sR = scores[gridY][gridX + 1];
        const denomX = sL - 2 * sC + sR;
        if (Math.abs(denomX) > 1e-4) {
          subX = bestX + 0.5 * (sL - sR) / denomX + templateW / 2;
        }

        // Fit 1D vertical parabola
        const sU = scores[gridY - 1][gridX];
        const sD = scores[gridY + 1][gridX];
        const denomY = sU - 2 * sC + sD;
        if (Math.abs(denomY) > 1e-4) {
          subY = bestY + 0.5 * (sU - sD) / denomY + templateH / 2;
        }
      }

      // Normalize deviation score to 0-100% confidence scale
      // Max possible squared diff per color is 255*255 = 65025
      const maxPossibleDev = templateW * templateH * 3 * 65025;
      const confidence = Math.max(0, 1 - (minDev / maxPossibleDev)) * 100;

      return {
        x: subX,
        y: subY,
        rawX: bestX,
        rawY: bestY,
        confidence,
        deviation: minDev
      };
    }


export const DEFAULT_TRACKING_OPTIONS = Object.freeze({size:21, radius:40, evolution:.1, threshold:85, predict:true});

export function analysisDimensions(width, height) {
  const scale = Math.min(1, 680 / width, 380 / height);
  return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
}

export function extractPatch(frame, x, y, size) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x + size > frame.width || y + size > frame.height) return null;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let row=0; row<size; row++) {
    const start = ((y+row)*frame.width+x)*4;
    data.set(frame.data.subarray(start,start+size*4),row*size*4);
  }
  return {width:size,height:size,data};
}

export function seedTracker(frame, x, y, options = DEFAULT_TRACKING_OPTIONS) {
  const rawX = Math.round(x-options.size/2), rawY = Math.round(y-options.size/2);
  const template = extractPatch(frame,rawX,rawY,options.size);
  if (!template || !compareAppearance(template,template,0,0).valid) return null;
  return {initial:template,template,previous:null,last:{x:rawX+options.size/2,y:rawY+options.size/2}};
}

export function advanceTracker(frame, session, options = DEFAULT_TRACKING_OPTIONS) {
  const {last,previous,template,initial} = session;
  const cx=last.x+(options.predict && previous ? last.x-previous.x:0);
  const cy=last.y+(options.predict && previous ? last.y-previous.y:0);
  const match=matchTemplate(frame,template,{
    x:Math.floor(cx-options.radius-template.width/2),
    y:Math.floor(cy-options.radius-template.height/2),
    width:options.radius*2,height:options.radius*2
  },template.width,template.height);
  if (!match || match.confidence<options.threshold ||
      !compareAppearance(frame,template,match.rawX,match.rawY).valid ||
      !compareAppearance(frame,initial,match.rawX,match.rawY).valid) return null;
  const next=extractPatch(frame,match.rawX,match.rawY,template.width);
  for(let i=0;i<next.data.length;i+=4) for(let c=0;c<3;c++)
    next.data[i+c]=Math.round((1-options.evolution)*template.data[i+c]+options.evolution*next.data[i+c]);
  return {initial,template:next,previous:last,last:{x:match.x,y:match.y},confidence:match.confidence};
}

export function upsertTrackedPoint(points, point, fps) {
  const index=Math.floor(point.time*fps+1e-6);
  return [...points.filter(p=>Math.floor(p.time*fps+1e-6)!==index),point].sort((a,b)=>a.time-b.time);
}

// Configuration changes do not append points or mutate the accepted template.
export function retuneTracker(frame, session, previousOptions, nextOptions) {
  if (previousOptions.size === nextOptions.size) return session;
  return seedTracker(frame,session.last.x,session.last.y,nextOptions);
}
