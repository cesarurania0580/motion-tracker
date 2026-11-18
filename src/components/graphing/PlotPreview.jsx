import {useEffect,useRef,useState} from 'react';
import {loadEngine,readyFonts} from './trialExport.js';
import {themedPreview} from './previewTheme.js';

export default function PlotPreview({figure,text,onMeasured,onPoint,onRange,selectedIndex,theme='light'}) {
  const plot=useRef(null),frame=useRef(null),queue=useRef(Promise.resolve());
  const [scale,setScale]=useState(1),[error,setError]=useState(false),[loading,setLoading]=useState(true);
  useEffect(()=>{
    const resize=new ResizeObserver(entries=>setScale(Math.min(1,Math.max(0,entries[0].contentRect.width-24)/figure.size.width)));
    resize.observe(frame.current);return ()=>resize.disconnect();
  },[figure.size.width]);
  useEffect(()=>{
    const node=plot.current;
    let cancelled=false;
    queue.current=queue.current.catch(()=>{}).then(async()=>{
      if(cancelled)return;
      setLoading(true);setError(false);
      const start=performance.now();
      try {
        const Plotly=await loadEngine();await readyFonts();if(cancelled)return;
        const {data,layout}=themedPreview(figure,theme);
        if(Number.isInteger(selectedIndex)&&data[0]){data[0].selectedpoints=[selectedIndex];data[0].selected={marker:{size:10}};data[0].unselected={marker:{opacity:1}};}
        await Plotly.react(node,data,layout,{displayModeBar:false,displaylogo:false,responsive:false,scrollZoom:false,doubleClick:'reset'});
        node.removeAllListeners('plotly_click');node.removeAllListeners('plotly_relayout');
        node.on('plotly_click',event=>{
          const point=event.points.find(point=>point.curveNumber===0);
          if(point)onPoint({x:point.x,y:point.y,index:point.customdata});
        });
        node.on('plotly_relayout',event=>{
          if(event['xaxis.autorange']||event['yaxis.autorange'])onRange(null);
          else if(event['xaxis.range[0]']!==undefined||event['yaxis.range[0]']!==undefined){
            const x=node.layout.xaxis.range,y=node.layout.yaxis.range;
            if(x&&y)onRange({x:[...x],y:[...y]});
          }
        });
        if(!cancelled){setLoading(false);onMeasured(performance.now()-start);}
      } catch {if(!cancelled){setLoading(false);setError(true);}}
    });
    return ()=>{cancelled=true;};
  },[figure,onMeasured,onPoint,onRange,selectedIndex,theme]);
  useEffect(()=>{
    const node=plot.current;
    return ()=>{queue.current=queue.current.catch(()=>{}).then(async()=>{const Plotly=await loadEngine();Plotly.purge(node);}).catch(()=>{});};
  },[]);
  return <div className="trial-preview" ref={frame}>
    <div className="trial-paper-space" style={{height:figure.size.height*scale}}>
      <div className="trial-paper" style={{width:figure.size.width,height:figure.size.height,transform:`translateX(-50%) scale(${scale})`}}>
        <div ref={plot} role="img" aria-label={`${figure.layout.title.text}. ${text.inspect}`}/>
      </div>
    </div>
    {loading&&<p className="trial-chart-status" role="status">{text.loading}</p>}
    {error&&<p className="trial-chart-status trial-error" role="alert">{text.renderError}</p>}
  </div>;
}
