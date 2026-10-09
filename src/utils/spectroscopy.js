const point = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
export function referencePoints(calibration, line) {
  if (!calibration || typeof calibration !== 'object') return [null,null];
  if (calibration.coordinateMode === 'image') return [calibration.p1_point,calibration.p2_point];
  if (!line) return [null,null];
  return [calibration.p1_t ?? 0,calibration.p2_t ?? 1].map(t=>({
    x:line.p1.x+t*(line.p2.x-line.p1.x),y:line.p1.y+t*(line.p2.y-line.p1.y)}));
}
// Guide tilt is independent of reference placement. Legacy files keep their axis.
export function dispersionAxis(calibration,line) {
  let degrees=calibration?.guideAngleDeg;
  if (!Number.isFinite(degrees)) {
    const [a,b]=referencePoints(calibration,line);
    degrees=calibration?.coordinateMode!=='image' && point(a) && point(b)
      ? Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI : 0;
  }
  const angle=degrees*Math.PI/180;
  return {x:Math.cos(angle),y:Math.sin(angle)};
}
export function anchorCalibration(calibration,line) {
  if (!calibration || calibration.coordinateMode==='image' || !line) return calibration;
  const [p1_point,p2_point]=referencePoints(calibration,line);
  const axis=dispersionAxis(calibration,line);
  return {...calibration,coordinateMode:'image',p1_point,p2_point,guideAngleDeg:Math.atan2(axis.y,axis.x)*180/Math.PI};
}
export function validCalibration(calibration,line) {
  const [a,b]=referencePoints(calibration,line);
  const axis=dispersionAxis(calibration,line);
  return Boolean(point(a) && point(b) && Math.abs((b.x-a.x)*axis.x+(b.y-a.y)*axis.y)>=1 &&
    Number.isFinite(calibration?.p1_wl) && Number.isFinite(calibration?.p2_wl) &&
    calibration.p1_wl>0 && calibration.p2_wl>0 && calibration.p1_wl!==calibration.p2_wl);
}
export function wavelengthAt(sample,calibration,line) {
  if (!validCalibration(calibration,line) || !point(sample)) return null;
  const [a,b]=referencePoints(calibration,line),axis=dispersionAxis(calibration,line);
  const t=((sample.x-a.x)*axis.x+(sample.y-a.y)*axis.y)/((b.x-a.x)*axis.x+(b.y-a.y)*axis.y);
  return calibration.p1_wl+t*(calibration.p2_wl-calibration.p1_wl);
}
export function sampleSpectrum({data,width,height},line) {
  if (!line || !point(line.p1) || !point(line.p2)) return [];
  const dx=line.p2.x-line.p1.x,dy=line.p2.y-line.p1.y,len=Math.hypot(dx,dy);
  if (len<1) return [];
  const steps=Math.floor(len),spread=Math.max(1,Math.min(50,Math.round(line.spread || 1)));
  const output=[];
  for(let i=0;i<=steps;i++) {
    const x=line.p1.x+dx*i/steps,y=line.p1.y+dy*i/steps;
    let r=0,g=0,b=0,count=0;
    for(let k=0;k<spread;k++) {
      const offset=k-(spread-1)/2;
      const sx=Math.round(x-offset*dy/len),sy=Math.round(y+offset*dx/len);
      if(sx<0 || sx>=width || sy<0 || sy>=height)continue;
      const index=(sy*width+sx)*4;
      r+=data[index];g+=data[index+1];b+=data[index+2];count++;
    }
    if(!count)continue;
    r/=count;g/=count;b/=count;
    const luma=.299*r+.587*g+.114*b;
    output.push({index:i,distance:len*i/steps,x,y,r,g,b,
      intensity:line.channel==='red'?r:line.channel==='green'?g:line.channel==='blue'?b:luma});
  }
  return output;
}
export function spectralRows(data,line,calibration,mode,pixelsPerMeter) {
  const calibrated=validCalibration(calibration,line);
  const effectiveMode=mode==='wavelength' && !calibrated ? 'pixels' : mode==='distance' && !pixelsPerMeter?'pixels':mode;
  return {mode:effectiveMode,rows:data.map(sample=>({...sample,xVal:effectiveMode==='wavelength'
    ? wavelengthAt(sample,calibration,line):effectiveMode==='distance'?sample.distance/pixelsPerMeter:sample.distance}))};
}
export function spectrumCSV(rows,mode) {
  const unit=mode==='wavelength'?'Wavelength (nm)':mode==='distance'?'Distance (m)':'Distance (px)';
  return [unit+',Intensity (0-255),Red,Green,Blue',...rows.map(p=>[p.xVal,p.intensity,p.r,p.g,p.b].join(','))].join('\n');
}
