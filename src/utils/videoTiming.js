export function validFps(value) {
  const fps=Number(value);
  return Number.isFinite(fps) && fps>0 && fps<=1000;
}

export function readVideoTiming(result) {
  const tracks=result?.media?.track?.filter(track=>track['@type']==='Video') || [];
  if(tracks.length!==1)return {status:'unknown',fps:null};
  const track=tracks[0];
  const numerator=Number(track.FrameRate_Num), denominator=Number(track.FrameRate_Den);
  const fps=track.FrameRate_Mode==='VFR' ? Number(track.FrameRate) : numerator>0 && denominator>0 ? numerator/denominator : Number(track.FrameRate);
  if(!validFps(fps))return {status:'unknown',fps:null};
  return {status:track.FrameRate_Mode==='VFR'?'variable':'detected',fps};
}

export function fpsMismatch(a,b) {
  return validFps(a) && validFps(b) && Math.abs(Number(a)-Number(b))>0.0001;
}

export const FPS_CHOICES=[30,60,120,240];
export function fpsChoice(value) {
  if(!validFps(value))return 30;
  const closest=FPS_CHOICES.reduce((a,b)=>Math.abs(value-a)<=Math.abs(value-b)?a:b);
  // Do not silently relabel 24/25 or other uncommon rates as 30.
  return Math.abs(value-closest)/closest<=0.1 ? closest : 'other';
}
export function effectiveFps(choice,baseline,custom) {
  if(choice==='other')return Number(custom);
  return choice===fpsChoice(baseline) && validFps(baseline)?Number(baseline):Number(choice);
}
