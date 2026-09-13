import {extractPatch} from './autotracker.js';

export const DETAIL_OPTIONS=Object.freeze({size:21,radius:40,evolution:.2,threshold:75,predict:true,tether:.05});
const luminance=(data,i)=>.299*data[i]+.587*data[i+1]+.114*data[i+2];
const originOf=frame=>({x:frame.originX ?? 0,y:frame.originY ?? 0});

export function predictTarget(session,options) {
  const {last,previous}=session;
  return {x:last.x+(options.predict && previous?last.x-previous.x:0),y:last.y+(options.predict && previous?last.y-previous.y:0)};
}

// Native-pixel ROI shared by browser capture and the offline replay.
export function trackingRegion(width,height,center,options) {
  const half=Math.ceil(options.size/2)+options.radius+2;
  const x=Math.max(0,Math.floor(center.x-half)),y=Math.max(0,Math.floor(center.y-half));
  return {x,y,width:Math.max(0,Math.min(width,Math.ceil(center.x+half))-x),height:Math.max(0,Math.min(height,Math.ceil(center.y+half))-y)};
}

function texture(template) {
  const n=template.width*template.height;
  let sum=0,variance=0,total=0;
  const weights=new Float64Array(n);
  const values=new Float64Array(n);
  for(let i=0;i<n;i++){
    const x=(i%template.width+.5-template.width/2)/(template.width/2),y=(Math.floor(i/template.width)+.5-template.height/2)/(template.height/2);
    weights[i]=x*x+y*y<=1?1:0;
    values[i]=luminance(template.data,i*4);sum+=weights[i]*values[i];total+=weights[i];
  }
  const mean=sum/total;
  for(let i=0;i<n;i++){values[i]-=mean;variance+=weights[i]*values[i]**2;}
  return {values,weights,variance,n:total};
}

export function seedDetailed(frame,x,y,options=DETAIL_OPTIONS) {
  const origin=originOf(frame);
  const rawX=Math.round(x-origin.x-options.size/2),rawY=Math.round(y-origin.y-options.size/2);
  const template=extractPatch(frame,rawX,rawY,options.size);
  if(!template)return null;
  const stats=texture(template);
  if(stats.variance/stats.n<4)return null;
  return {initial:template,template,last:{x:origin.x+rawX+options.size/2,y:origin.y+rawY+options.size/2},previous:null};
}

export function retuneDetailed(frame,session,previous,next) {
  return previous.size===next.size?session:seedDetailed(frame,session.last.x,session.last.y,next);
}

export function advanceDetailed(frame,session,options=DETAIL_OPTIONS) {
  const predicted=predictTarget(session,options),origin=originOf(frame);
  const template=session.template,size=template.width,stats=texture(template);
  if(stats.variance/stats.n<4)return {session:null,reason:'weak'};
  const startX=Math.max(0,Math.ceil(predicted.x-options.radius-size/2-origin.x));
  const startY=Math.max(0,Math.ceil(predicted.y-options.radius-size/2-origin.y));
  const endX=Math.min(frame.width-size,Math.floor(predicted.x+options.radius-size/2-origin.x));
  const endY=Math.min(frame.height-size,Math.floor(predicted.y+options.radius-size/2-origin.y));
  if(endX<startX || endY<startY)return {session:null,reason:'outside'};
  const gray=new Float64Array(frame.width*frame.height);
  for(let i=0;i<gray.length;i++)gray[i]=luminance(frame.data,i*4);
  function score(x,y) {
    let sum=0,squares=0,dot=0,rgb=0;
    for(let j=0;j<size;j++)for(let i=0;i<size;i++) {
      const a=(y+j)*frame.width+x+i,b=j*size+i,v=gray[a];
      if(!stats.weights[b])continue;
      sum+=v;squares+=v*v;dot+=v*stats.values[b];
      for(let c=0;c<3;c++)rgb+=(frame.data[a*4+c]-template.data[b*4+c])**2;
    }
    const variance=Math.max(0,squares-sum*sum/stats.n);
    const correlation=variance>0?dot/Math.sqrt(variance*stats.variance):0;
    const contrast=Math.sqrt(variance/stats.variance);
    const color=100*(1-rgb/(stats.n*3*65025));
    // A percentage of normalized structure, not a probability of correctness.
    return {x,y,correlation,contrast,color,confidence:Math.max(0,correlation)*100};
  }
  // Small regions scan every pixel. Larger regions use a coarse grid followed
  // by native-pixel refinement of separated promising basins, keeping Pause usable.
  let best=null;
  const candidates=[],seen=new Set();
  function visit(x,y) {
    const key=y*frame.width+x;
    if(seen.has(key))return;
    seen.add(key);
    const candidate=score(x,y);
    if(candidate.contrast<.25 || candidate.contrast>4 || candidate.color<50)return;
    candidates.push(candidate);
    if(!best || candidate.confidence>best.confidence)best=candidate;
  }
  const work=(endX-startX+1)*(endY-startY+1)*size*size;
  const stride=Math.max(1,Math.ceil(Math.sqrt(work/8e6)));
  for(let y=startY;y<=endY;y+=stride)for(let x=startX;x<=endX;x+=stride)visit(x,y);
  for(let y=startY;y<=endY;y+=stride)visit(endX,y);
  for(let x=startX;x<=endX;x+=stride)visit(x,endY);
  visit(endX,endY);
  if(stride>1) {
    const basins=[];
    for(const c of [...candidates].sort((a,b)=>b.confidence-a.confidence)) {
      if(basins.every(v=>Math.hypot(c.x-v.x,c.y-v.y)>stride*2))basins.push(c);
      if(basins.length===8)break;
    }
    for(const c of basins)for(let y=Math.max(startY,c.y-stride);y<=Math.min(endY,c.y+stride);y++)
      for(let x=Math.max(startX,c.x-stride);x<=Math.min(endX,c.x+stride);x++)visit(x,y);
  }
  if(!best || best.confidence<options.threshold)return {session:null,reason:'weak',match:best};
  const second=candidates.reduce((runner,c)=>Math.hypot(c.x-best.x,c.y-best.y)>=Math.max(3,size/2) && (!runner || c.confidence>runner.confidence)?c:runner,null);
  if(second && best.confidence-second.confidence<3)return {session:null,reason:'ambiguous',match:best};
  let dx=0,dy=0;
  function offset(a,b,c){const den=a-2*b+c;return den< -1e-8?Math.max(-.5,Math.min(.5,.5*(a-c)/den)):0;}
  if(best.x>startX && best.x<endX)dx=offset(score(best.x-1,best.y).correlation,best.correlation,score(best.x+1,best.y).correlation);
  if(best.y>startY && best.y<endY)dy=offset(score(best.x,best.y-1).correlation,best.correlation,score(best.x,best.y+1).correlation);
  const next=extractPatch(frame,best.x,best.y,size);
  for(let i=0;i<next.data.length;i+=4)for(let c=0;c<3;c++) {
    const evolved=(1-options.evolution)*template.data[i+c]+options.evolution*next.data[i+c];
    next.data[i+c]=Math.round((1-options.tether)*evolved+options.tether*session.initial.data[i+c]);
  }
  return {session:{initial:session.initial,template:next,previous:session.last,last:{x:origin.x+best.x+size/2+dx,y:origin.y+best.y+size/2+dy},confidence:best.confidence},reason:null,match:best};
}
