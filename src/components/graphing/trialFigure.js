import {fitCurve} from '../../utils/curveFit.js';
import {TRIAL_TEXT} from './trialText.js';

export function fitSample(rows, model) {
  const fit=fitCurve(rows,model,'x','y');
  if (!fit) return null;
  return {...fit,rmse:Math.sqrt(rows.reduce((sum,row)=>sum+(row.y-fit.fn(row.x))**2,0)/rows.length)};
}

// Plotly supports markup in text; user-editable labels in this trial are plain text.
export function plainText(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function figureSize(settings) {
  const widthCm=Number(settings.widthCm),heightCm=Number(settings.heightCm),dpi=Number(settings.dpi);
  if (!(widthCm>=12&&widthCm<=24&&heightCm>=8&&heightCm<=18&&[150,300,600].includes(dpi))) throw Error('Invalid figure size');
  return {width:Math.round(widthCm/2.54*96),height:Math.round(heightCm/2.54*96),
    pngWidth:Math.round(widthCm/2.54*dpi),pngHeight:Math.round(heightCm/2.54*dpi),widthCm,heightCm,dpi};
}

export function manualRanges(settings) {
  if(settings.axisMode!=='manual')return null;
  const values=['xMin','xMax','yMin','yMax'].map(key=>settings[key]===''?NaN:Number(settings[key]));
  if(!values.every(Number.isFinite)||values[0]>=values[1]||values[2]>=values[3])throw Error('Invalid range');
  return {x:values.slice(0,2),y:values.slice(2,4)};
}

export function makeFigure(rows,fit,settings,language,sample,options={}) {
  const t=options.text||TRIAL_TEXT[language],size=figureSize(settings),ranges=manualRanges(settings);
  const data=[{type:'scatter',mode:sample==='spectrum'?'lines+markers':'markers',
    name:options.dataName||t.dataKey,x:rows.map(row=>row.x),y:rows.map(row=>row.y),customdata:rows.map((_,i)=>i),
    marker:{color:settings.color,size:sample==='spectrum'?Math.max(2,settings.markerSize-2):settings.markerSize,symbol:settings.marker},
    line:{color:settings.color,width:1.1},cliponaxis:true,
    error_x:{type:'data',array:rows.map(row=>row.xError),visible:settings.errorBars,color:settings.color,thickness:.7,width:2},
    error_y:{type:'data',array:rows.map(row=>row.error),visible:settings.errorBars,color:settings.color,thickness:.8,width:3},
    hovertemplate:'x = %{x:.5g}<br>y = %{y:.5g}<extra></extra>'}];
  if(fit){
    // Sample the chosen visible range so manual limits also exercise clipping.
    const x0=ranges?.x[0]??Math.min(...rows.map(row=>row.x)),x1=ranges?.x[1]??Math.max(...rows.map(row=>row.x));
    const cycles=fit.type==='Sinusoidal'?Math.abs(fit.params.B*(x1-x0)/(2*Math.PI)):0;
    const count=Math.min(8192,Math.max(501,Math.ceil(cycles*32)+1));
    const x=Array.from({length:count},(_,i)=>x0+(x1-x0)*i/(count-1));
    data.push({type:'scatter',mode:'lines',name:t.fitKey,x,y:x.map(fit.fn),
      line:{color:'#b44d34',width:1.8,dash:'dash'},cliponaxis:true,hoverinfo:'skip'});
  }
  if(options.bounds?.status==='ok') {
    const x=ranges?.x||[Math.min(...rows.map(p=>p.x)),Math.max(...rows.map(p=>p.x))];
    for(const key of ['min','max']) {
      const bound=options.bounds[key],worst=options.bounds.worst===key;
      data.push({type:'scatter',mode:'lines',x:[...x],y:x.map(bound.fn),
        name:`${options.boundsText[key]}${worst?` (${options.boundsText.worst})`:''}`,
        line:{color:key==='min'?'#7c3aed':'#b45309',dash:key==='min'?'dot':'dashdot',width:worst?2.3:1.5},cliponaxis:true,hoverinfo:'skip'});
    }
  }
  data.push(...(options.traces||[]));
  const axis={showline:true,linecolor:'#334155',linewidth:1,mirror:true,ticks:'outside',ticklen:5,
    zeroline:false,showgrid:settings.grid,gridcolor:'#e2e8f0',fixedrange:false,automargin:true};
  const font={family:'Liberation Sans',size:Number(settings.fontSize),color:'#172433'};
  return {data,layout:{width:size.width,height:size.height,autosize:false,
    title:{text:plainText(settings.title),font:{...font,size:Number(settings.fontSize)+3},x:.5,xanchor:'center'},
    font,paper_bgcolor:'#ffffff',plot_bgcolor:'#ffffff',margin:{l:85,r:35,t:65,b:95},
    xaxis:{...axis,title:{text:plainText(settings.xLabel),standoff:14},autorange:!ranges,...(ranges?{range:ranges.x}:{})},
    yaxis:{...axis,title:{text:plainText(settings.yLabel),standoff:14},autorange:!ranges,...(ranges?{range:ranges.y}:{})},
    showlegend:settings.legend,legend:{orientation:'h',x:0,y:-.2,xanchor:'left',yanchor:'top',font:{size:Number(settings.fontSize)-2},itemclick:false,itemdoubleclick:false},
    shapes:(options.shapes||[]).filter(shape=>!ranges||shape.x0>=ranges.x[0]&&shape.x0<=ranges.x[1]),
    annotations:[...(options.annotations||[]).filter(annotation=>!ranges||annotation.x>=ranges.x[0]&&annotation.x<=ranges.x[1]),...(settings.note?[{text:plainText(options.note??(sample==='spectrum'?t.spectrumNote:t.sampleNote)),xref:'paper',yref:'paper',
      x:1,y:1,xanchor:'right',yanchor:'top',showarrow:false,bgcolor:'rgba(255,255,255,0.9)',borderpad:5,
      font:{...font,size:Math.max(10,Number(settings.fontSize)-3)}}]:[])],
    hovermode:'closest',dragmode:settings.dragMode||'zoom',uirevision:JSON.stringify(ranges),
  },size};
}

export function clonePlot(figure) {
  return JSON.parse(JSON.stringify({data:figure.data,layout:figure.layout}));
}
