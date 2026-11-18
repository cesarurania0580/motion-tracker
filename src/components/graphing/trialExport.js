import regularURL from './fonts/LiberationSans-Regular.ttf?url';
import boldURL from './fonts/LiberationSans-Bold.ttf?url';
import {clonePlot} from './trialFigure.js';

let enginePromise;
export function loadEngine() {
  if(!enginePromise)enginePromise=import('plotly.js-basic-dist-min').then(module=>module.default).catch(error=>{enginePromise=null;throw error;});
  return enginePromise;
}

export async function readyFonts() {
  await Promise.all([document.fonts.load('15px "Liberation Sans"'),document.fonts.load('bold 15px "Liberation Sans"')]);
}

let fontPromise;
function fontFiles() {
  if(!fontPromise)fontPromise=Promise.all([regularURL,boldURL].map(async url=>{
    const response=await fetch(url);
    if(!response.ok)throw Error('Font unavailable');
    const bytes=new Uint8Array(await response.arrayBuffer());
    let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(binary);
  })).catch(error=>{fontPromise=null;throw error;});
  return fontPromise;
}

// Separate temporary plot: exports cannot resize or change the interactive plot.
export async function exportFigure(figure,format,fileName) {
  const start=performance.now();
  const Plotly=await loadEngine();
  await readyFonts();
  const host=document.createElement('div');
  host.style.cssText=`position:fixed;left:-20000px;top:0;width:${figure.size.width}px;height:${figure.size.height}px;pointer-events:none;`;
  host.setAttribute('aria-hidden','true');
  document.body.appendChild(host);
  try {
    const {data,layout}=clonePlot(figure);
    await Plotly.newPlot(host,data,layout,{staticPlot:true,displayModeBar:false,responsive:false});
    let blob;
    if(format==='png'){
      // Keep the physical layout fixed; scale the pixels, not the typography.
      const uri=await Plotly.toImage(host,{format:'png',width:figure.size.width,height:figure.size.height,scale:figure.size.dpi/96});
      blob=await (await fetch(uri)).blob();
    } else {
      const uri=await Plotly.toImage(host,{format:'svg',width:figure.size.width,height:figure.size.height});
      const source=await (await fetch(uri)).text();
      const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
      if(svg.localName!=='svg'||svg.querySelector('parsererror'))throw Error('Invalid SVG');
      const [regular,bold]=await fontFiles();
      if(format==='svg'){
        const style=document.createElementNS('http://www.w3.org/2000/svg','style');
        style.textContent=`@font-face{font-family:'Liberation Sans';font-style:normal;font-weight:400;src:url(data:font/ttf;base64,${regular}) format('truetype')}@font-face{font-family:'Liberation Sans';font-style:normal;font-weight:700;src:url(data:font/ttf;base64,${bold}) format('truetype')}`;
        svg.insertBefore(style,svg.firstChild);
        // Physical dimensions plus viewBox keep standalone SVG geometry explicit.
        svg.setAttribute('viewBox',`0 0 ${figure.size.width} ${figure.size.height}`);
        svg.setAttribute('width',`${figure.size.widthCm}cm`);
        svg.setAttribute('height',`${figure.size.heightCm}cm`);
        blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});
      } else if(format==='pdf') {
        const {jsPDF}=await import('jspdf');
        await import('svg2pdf.js');
        const width=figure.size.widthCm/2.54*72,height=figure.size.heightCm/2.54*72;
        const pdf=new jsPDF({orientation:width>=height?'landscape':'portrait',unit:'pt',format:[width,height],putOnlyUsedFonts:true,compress:true});
        pdf.addFileToVFS('LiberationSans-Regular.ttf',regular);
        pdf.addFont('LiberationSans-Regular.ttf','Liberation Sans','normal');
        pdf.addFileToVFS('LiberationSans-Bold.ttf',bold);
        pdf.addFont('LiberationSans-Bold.ttf','Liberation Sans','bold');
        pdf.setFont('Liberation Sans','normal');
        // Attach for SVG/CSS measurement; no canvas or raster fallback is used.
        const svgHost=document.createElement('div');host.appendChild(svgHost);svgHost.appendChild(svg);
        await pdf.svg(svg,{x:0,y:0,width,height});
        pdf.setProperties({title:fileName,creator:'PhysTracker graphing trial'});
        blob=pdf.output('blob');
      } else throw Error('Unknown export format');
    }
    return {blob,fileName:`${fileName}.${format}`,elapsed:performance.now()-start};
  } finally {Plotly.purge(host);host.remove();}
}
