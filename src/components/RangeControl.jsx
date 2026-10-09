import {useStore} from '../store/useStore';

export default function RangeControl({min=0,max=100,value,className='',style,...props}) {
  const dark=useStore(s=>s.theme==='dark');
  const fill=Number(max)>Number(min)?Math.max(0,Math.min(100,(Number(value)-Number(min))/(Number(max)-Number(min))*100)):0;
  return <input {...props} type="range" min={min} max={max} value={value}
    className={`tracking-range ${dark?'':'tracking-range-light'} ${className}`}
    style={{...style,'--range-fill':`${fill}%`}}/>;
}
