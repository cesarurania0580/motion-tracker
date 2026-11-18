import {clonePlot} from './trialFigure.js';

// Preview-only styling. Never mutate the publication figure or saved settings.
export function themedPreview(figure,theme) {
  const plot=clonePlot(figure);
  if(theme!=='dark')return plot;
  const surface='#192A3E',text='#E3EDF8',muted='#ACBED1',grid='#3D526B';
  const brighten=color=>{
    if(typeof color!=='string'||!/^#[\da-f]{6}$/i.test(color))return color;
    const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16));
    const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const bg=luminance([25,42,62]);
    for(let mix=0;mix<=1;mix+=.1){
      const next=rgb.map(v=>Math.round(v+(255-v)*mix));
      if((luminance(next)+.05)/(bg+.05)>=3)return '#'+next.map(v=>v.toString(16).padStart(2,'0')).join('');
    }
    return color;
  };
  const {layout,data}=plot;
  layout.paper_bgcolor=surface;layout.plot_bgcolor=surface;
  layout.font={...layout.font,color:text};
  layout.title={...layout.title,font:{...layout.title?.font,color:text}};
  layout.legend={...layout.legend,font:{...layout.legend?.font,color:muted}};
  for(const key of ['xaxis','yaxis'])layout[key]={...layout[key],linecolor:muted,gridcolor:grid,tickfont:{...layout[key]?.tickfont,color:muted},title:{...layout[key]?.title,font:{...layout[key]?.title?.font,color:text}}};
  for(const trace of data)for(const key of ['marker','line','error_x','error_y'])if(trace[key]?.color)trace[key].color=brighten(trace[key].color);
  for(const annotation of layout.annotations||[]){annotation.font={...annotation.font,color:annotation.font?.color?brighten(annotation.font.color):text};if(annotation.bgcolor)annotation.bgcolor=surface;}
  for(const shape of layout.shapes||[])if(shape.line?.color)shape.line.color=brighten(shape.line.color);
  return plot;
}
