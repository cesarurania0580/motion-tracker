export const MODEL_EQUATIONS={none:'—',linear:'y = Ax + B',quadratic:'y = Ax² + Bx + C',sinusoidal:'y = A sin(ωx + φ) + D'};
export function parameterSymbol(type,key) {
  if(type==='Linear')return {m:'A',b:'B'}[key]||key;
  if(type==='Sinusoidal')return {B:'ω',C:'φ'}[key]||key;
  return key;
}
export function arbitraryUnits(type,xUnit,yUnit) {
  const x=xUnit.trim(),y=yUnit.trim();
  const ratio=n=>x?`${y||'1'}/(${x})${n===2?'²':''}`:y;
  if(type==='Linear')return {m:ratio(1),b:y};
  if(type==='Quadratic')return {A:ratio(2),B:ratio(1),C:y};
  return {A:y,B:x?`rad/(${x})`:'rad',C:'rad',D:y};
}
