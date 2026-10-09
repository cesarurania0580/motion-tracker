import {useMemo,useRef,useState} from 'react';
import {ComposedChart,Line,Scatter,XAxis,YAxis,CartesianGrid,ResponsiveContainer,ErrorBar} from 'recharts';
import CoordinateTooltip from './CoordinateTooltip';

export default function MotionChart({data,plotX,plotY,xScale,yScale,labels,styles,formatTicks,fitEquation,color,objectLabel,dark}) {
  const frame=useRef(null);
  const [hover,setHover]=useState(null);
  // Selection belongs to this dataset and these axes, never a stale render.
  const active=hover?.data===data && hover.plotX===plotX && hover.plotY===plotY?hover:null;
  const measured=useMemo(()=>data.filter(row=>!row.isVirtual && Number.isFinite(row[plotX]) && Number.isFinite(row[plotY])),[data,plotX,plotY]);
  const select=(point)=>setHover({...point,data,plotX,plotY,width:frame.current?.clientWidth || 0,height:frame.current?.clientHeight || 0});
  const shape=({cx,cy,payload})=>{
    if(!Number.isFinite(cx) || !Number.isFinite(cy) || payload.isVirtual)return <g />;
    const selected=active?.payload===payload;
    return <g>
      {selected && <circle data-hover-only cx={cx} cy={cy} r={8} fill="none" stroke={dark?'#f8fafc':'#0f172a'} strokeWidth={1.5} pointerEvents="none" />}
      <circle cx={cx} cy={cy} r={4} fill={color} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={12} fill="transparent" pointerEvents="all" tabIndex={0} role="button"
        aria-label={`${objectLabel}: ${labels[plotX]} ${payload[plotX]}, ${labels[plotY]} ${payload[plotY]}`}
        onMouseEnter={()=>select({cx,cy,payload})} onMouseLeave={()=>setHover(null)}
        onFocus={()=>select({cx,cy,payload})} onBlur={()=>setHover(null)}
        onPointerDown={event=>{event.stopPropagation();select({cx,cy,payload});}}
        onKeyDown={event=>{if(event.key==='Escape')setHover(null);else if(event.key==='Enter' || event.key===' '){event.preventDefault();select({cx,cy,payload});}}}
        style={{outline:'none',cursor:'pointer'}} />
    </g>;
  };
  return <div ref={frame} className="relative h-full w-full" onMouseLeave={()=>setHover(null)}
    onPointerDown={()=>setHover(null)} onKeyDown={event=>{if(event.key==='Escape')setHover(null);}}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{top:20,right:30,left:50,bottom:50}}>
        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
        <XAxis dataKey={plotX} type="number" allowDataOverflow stroke={styles.chartAxis} fontSize={16}
          domain={[xScale.min,xScale.max]} ticks={xScale.ticks} tickFormatter={formatTicks(xScale.step)}
          label={{value:labels[plotX],position:'bottom',offset:20,fill:styles.chartAxis,fontSize:18}} />
        <YAxis type="number" allowDataOverflow stroke={styles.chartAxis} fontSize={16} domain={[yScale.min,yScale.max]} ticks={yScale.ticks}
          tickFormatter={formatTicks(yScale.step)} label={{value:labels[plotY],angle:-90,position:'insideLeft',offset:-40,fill:styles.chartAxis,fontSize:18}} />
        {fitEquation && <Line type="linear" dataKey="fitYContinuous" stroke="#f59e0b" strokeWidth={3}
          strokeDasharray="5 5" dot={false} activeDot={false} pointerEvents="none" isAnimationActive={false} />}
        {['x','y'].includes(plotY) && <Scatter data={measured} dataKey={plotY} shape={()=> <g />} activeShape={false}
          pointerEvents="none" isAnimationActive={false}>
          <ErrorBar dataKey="error" width={6} strokeWidth={2} stroke="#60a5fa" direction="y" />
        </Scatter>}
        <Scatter data={measured} dataKey={plotY} fill={color} shape={shape} activeShape={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
    {active && <div className="absolute z-30 pointer-events-none" style={{
      left:active.cx>active.width/2?Math.max(0,active.cx-12):active.cx+12,
      top:active.cy+12,transform:`translate(${active.cx>active.width/2?'-100%':'0'}, ${active.cy>active.height/2?'-100%':'0'})`}}>
      <CoordinateTooltip active payload={[{payload:active.payload}]} plotX={plotX} plotY={plotY}
        labels={labels} objectLabel={objectLabel} color={color} dark={dark} />
    </div>}
  </div>;
}
