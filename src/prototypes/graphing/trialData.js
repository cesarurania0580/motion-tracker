// Synthetic fixtures only. The trial never reads or writes the project store.
export const SAMPLES = {
  velocity: {model:'linear', count:25, maxX:2.4, yError:.07, xError:.01,
    fn:x=>-.35-1.85*x, noise:.055},
  acceleration: {model:'quadratic', count:31, maxX:3, yError:.09, xError:.01,
    fn:x=>.25+.6*x+.8*x*x, noise:.075},
  oscillation: {model:'sinusoidal', count:81, maxX:5, yError:.045, xError:.008,
    fn:x=>1.15*Math.sin(2*Math.PI*.8*x+.35)+.2, noise:.035},
  spectrum: {model:'none', count:401, minX:380, maxX:780, yError:.018, xError:.4,
    fn:x=>.04+.95*Math.exp(-.5*((x-546)/5.8)**2)+.62*Math.exp(-.5*((x-436)/4.2)**2)+.35*Math.exp(-.5*((x-579)/7)**2), noise:.009},
};

export function sampleRows(id, dense=false) {
  const sample=SAMPLES[id];
  const count=id==='spectrum'&&dense?5001:sample.count;
  return Array.from({length:count},(_,i)=>{
    const x=(sample.minX||0)+(sample.maxX-(sample.minX||0))*i/(count-1);
    const noise=sample.noise*(Math.sin(i*2.37)+.35*Math.cos(i*.73));
    return {x,y:sample.fn(x)+noise,error:sample.yError,xError:sample.xError};
  });
}

export {DEFAULT_SETTINGS} from '../../components/graphing/defaultSettings.js';
