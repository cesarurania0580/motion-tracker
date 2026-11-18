import {advancedTransfer} from './advancedTransfer.js';
import {Component,lazy,Suspense,useState} from 'react';
import {useShallow} from 'zustand/react/shallow';
import {useStore} from '../../store/useStore';

const LinkedGraphing=lazy(()=>import('../AnalysisPanel.jsx'));
const IndependentGraphing=lazy(()=>import('./prototype/MinimalBench.jsx'));

// Mount a source on first use, then preserve its draft and settings across navigation.
export function RetainedPane({active,children,className}) {
  const [opened,setOpened]=useState(false);
  if(active&&!opened)setOpened(true);
  return <div hidden={!active} className={active?className:undefined}>{(opened||active)&&children}</div>;
}

class GraphBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="alert" className="p-4">{this.props.language==='es'?'No se pudo abrir esta vista. Tus mediciones siguen en el rastreador.':'This view could not open. Your measurements remain in the tracker.'}</p>:this.props.children;}
}

export default function GraphingPanel({activeObjectColor,handleObjectSwitch,positionData=[],velocityData=[],...analysisProps}) {
  const s=useStore(useShallow(state=>Object.fromEntries([
    'language','viewMode','videoSrc','imageSrc','activeObjId','plotX','plotY','pixelsPerMeter','analysisChartMode','measurementBudget','uncertaintyPx',
  ].map(key=>[key,state[key]]))));
  const [chosenSource,setSource]=useState(null);
  const [transfer,setTransfer]=useState({version:0,seed:undefined});
  const hasMedia=!!(s.videoSrc||s.imageSrc);
  const source=chosenSource||(hasMedia?'media':'independent');
  const active=s.viewMode==='analysis',es=s.language==='es';
  return <section data-theme="light" aria-label={es?'Datos y gráficos':'Data & Graphing'}
    className={`bg-slate-50 flex-col flex-1 min-w-0 min-h-0 overflow-hidden ${active?'flex':'hidden'}`}>
    <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-slate-500/30 p-3">
      <div role="group" aria-label={es?'Fuente de datos':'Data source'} className="flex flex-wrap gap-2">
        {[['media',es?'Mediciones de video / imagen':'Video / image measurements'],['independent',es?'Gráficos avanzados':'Advanced graphing']].map(([id,label])=><button key={id}
          aria-pressed={source===id} onClick={()=>setSource(id)}
          className={`min-h-11 rounded-lg border px-4 text-sm ${source===id?'border-cyan-600 bg-cyan-600/15':'border-slate-500/40'}`}>{label}</button>)}
      </div>
      {source==='media'&&!s.imageSrc&&<label className="text-sm">{es?'Objeto':'Object'} <select value={s.activeObjId} onChange={e=>handleObjectSwitch(e.target.value)}
        className="min-h-11 rounded border border-slate-500 bg-transparent px-3"><option>A</option><option>B</option><option>COM</option></select></label>}
      {source==='media'&&s.analysisChartMode==='kinematics'&&<button type="button" className="min-h-11 rounded border border-slate-500/40 px-3 text-sm" disabled={!positionData.some(row=>!row.isVirtual&&Number.isFinite(row.time))} onClick={()=>{
        if(!window.confirm(es?'¿Copiar las mediciones de este objeto y reemplazar la tabla de Gráficos avanzados? Exporta primero esa tabla si la necesitas. Los datos del video se conservan.':'Copy this object’s measurements and replace the Advanced graphing table? Export that table first if needed. Video measurements stay unchanged.'))return;
        const seed=advancedTransfer(positionData,velocityData,{scaled:!!s.pixelsPerMeter,x:s.plotX,y:s.plotY,title:es?`Objeto ${s.activeObjId}`:`Object ${s.activeObjId}`});
        setTransfer(previous=>({version:previous.version+1,seed}));setSource('independent');
      }}>{es?'Abrir datos en Gráficos avanzados':'Open data in Advanced graphing'}</button>}
    </div>
    <Suspense fallback={<p role="status" className="p-4">{es?'Preparando gráficos…':'Preparing graphs…'}</p>}>
      <RetainedPane active={active&&source==='media'} className="flex flex-1 min-h-0 min-w-0"><GraphBoundary language={s.language}>
        <LinkedGraphing {...analysisProps} activeObjectColor={activeObjectColor}/>
      </GraphBoundary></RetainedPane>
      <RetainedPane active={active&&source==='independent'} className="flex-1 min-h-0 overflow-auto"><GraphBoundary language={s.language}>
        <IndependentGraphing key={transfer.version} seed={transfer.seed} embedded language={s.language}/>
      </GraphBoundary></RetainedPane>
    </Suspense>
  </section>;
}
