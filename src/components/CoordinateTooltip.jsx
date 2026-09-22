import {formatCoordinate,plottedCoordinates} from '../utils/analysisPresentation';

export default function CoordinateTooltip({active,payload,plotX,plotY,labels,objectLabel,color,dark}) {
  if(!active)return null;
  const coordinates=plottedCoordinates(payload,plotX,plotY);
  if(!coordinates.length)return null;
  return <div className="rounded-lg border px-3 py-2 text-sm shadow-lg" style={{
    backgroundColor:dark?'#0f172a':'#ffffff',color:dark?'#f8fafc':'#0f172a',borderColor:dark?'#64748b':'#cbd5e1'}}>
    <div className="mb-2 flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full" style={{backgroundColor:color}} />{objectLabel}</div>
    <dl className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1">
      {coordinates.map(({key,value})=><div key={key} className="contents"><dt>{labels[key]}</dt><dd className="text-right font-mono font-semibold tabular-nums">{formatCoordinate(value)}</dd></div>)}
    </dl>
  </div>;
}
