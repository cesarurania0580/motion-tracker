import {fitSinusoidal} from './sinusoidalFit.js';
import {solveLinearSystem} from './physicsMath.js';

export function fitCurve(activeData, fitModel, plotX, plotY) {
    if (fitModel === 'none' || activeData.length < 2) return null;

    const validData = activeData.filter(d => Number.isFinite(d[plotX]) && Number.isFinite(d[plotY]));
    if (validData.length < 2) return null;

    const n = validData.length;
    const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);

    const xData = validData.map(d => d[plotX]);
    const yData = validData.map(d => d[plotY]);

    let result = null;

    if (fitModel === 'linear') {
      const sumX = sum(xData);
      const sumY = sum(yData);
      const sumXY = sum(validData.map(d => d[plotX] * d[plotY]));
      const sumX2 = sum(xData.map(x => x * x));

      const num = n * sumXY - sumX * sumY;
      const den = n * sumX2 - sumX * sumX;

      if (Math.abs(den) > 1e-12) {
          const m = num / den;
          const b = (sumY - m * sumX) / n;
          result = {
              type: 'Linear',
              text: `y = ${m.toFixed(4)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(4)}`,
              fn: (x) => m * x + b,
              params: { m: m, b: b }
          };
      }
    }
    else if (fitModel === 'quadratic' && validData.length >= 3) {
      const sumX = sum(xData);
      const sumY = sum(yData);
      const sumX2 = sum(xData.map(x => x * x));
      const sumX3 = sum(xData.map(x => Math.pow(x, 3)));
      const sumX4 = sum(xData.map(x => Math.pow(x, 4)));
      const sumXY = sum(validData.map(d => d[plotX] * d[plotY]));
      const sumX2Y = sum(validData.map(d => Math.pow(d[plotX], 2) * d[plotY]));

      const A_mat = [
          [sumX4, sumX3, sumX2],
          [sumX3, sumX2, sumX],
          [sumX2, sumX, n]
      ];
      const B_vec = [sumX2Y, sumXY, sumY];

      const coeffs = solveLinearSystem(A_mat, B_vec);
      if (coeffs) {
          const [a, b, c] = coeffs;
          result = {
              type: 'Quadratic',
              text: `y = ${a.toFixed(4)}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(4)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)}`,
              fn: (x) => a * x * x + b * x + c,
              params: { A: a, B: b, C: c }
          };
      }
    }
    else if (fitModel === 'sinusoidal') {
      const fitted = fitSinusoidal(xData,yData);
      if (!fitted) return null;
      const {A,B,C,D} = fitted.params;
      result = {
        ...fitted, type:'Sinusoidal',
        text:`y = ${A.toFixed(4)}sin(${B.toFixed(4)}x ${C >= 0 ? '+' : '-'} ${Math.abs(C).toFixed(4)}) ${D >= 0 ? '+' : '-'} ${Math.abs(D).toFixed(4)}`
      };
    }

    if (result) {
        const yMean = sum(yData) / n;
        const ssTot = yData.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
        const ssRes = validData.reduce((acc, d) => {
            const pred = result.fn(d[plotX]);
            return acc + Math.pow(d[plotY] - pred, 2);
        }, 0);
        const r2 = ssTot === 0 ? null : (1 - (ssRes / ssTot));
        result.r2 = r2;
    }

    return result;
}
