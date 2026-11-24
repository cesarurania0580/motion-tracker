import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import process from 'node:process';
import {visibleMediaRect, viewCenter, scaleBarInView, scrollToCenter, setMediaViewProvider, currentMediaView,
  reticleStart, offscreenDirection, offscreenTools} from '../src/utils/mediaView.js';
import {TRANSLATIONS} from '../src/utils/translations.js';

const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));
const dims={w:1920,h:1080};
const plain=value=>JSON.parse(JSON.stringify(value));

test('VIEW-01: the visible region follows scrolling and zoom, in media pixels',()=>{
  // 800x500 viewport; media zoomed 4x and scrolled so its (1000,600) pixel is at the viewport corner.
  const viewport={left:100,top:50,width:800,height:500};
  const canvas={left:100-4000,top:50-2400};
  assert.deepEqual(visibleMediaRect(viewport,canvas,4,dims),{x0:1000,y0:600,x1:1200,y1:725});
});

test('VIEW-02: the visible region is clamped to the media and null when nothing shows',()=>{
  const viewport={left:0,top:0,width:800,height:500};
  // Media smaller than the viewport, centred with a margin.
  assert.deepEqual(visibleMediaRect(viewport,{left:160,top:40},0.25,dims),{x0:0,y0:0,x1:1920,y1:1080});
  assert.equal(visibleMediaRect(viewport,{left:900,top:0},1,dims),null);
  assert.equal(visibleMediaRect(viewport,{left:0,top:0},0,dims),null);
  assert.equal(visibleMediaRect(null,{left:0,top:0},1,dims),null);
  assert.equal(visibleMediaRect(viewport,{left:NaN,top:0},1,dims),null);
});

test('VIEW-03: the reticle starts at the centre of the view, or of the media when the view is unknown',()=>{
  assert.deepEqual(viewCenter({x0:1000,y0:600,x1:1200,y1:725}),{x:1100,y:662.5});
  assert.deepEqual(viewCenter(null,dims),{x:960,y:540});
});

test('VIEW-04: a new scale bar sits inside the view at any zoom',()=>{
  const view={x0:1000,y0:600,x1:1200,y1:725};
  const [a,b]=scaleBarInView(view,dims);
  assert.equal(a.y,662.5);assert.equal(b.y,662.5);
  assert.ok(a.x>view.x0 && b.x<view.x1 && a.x<b.x);
  assert.ok(Math.abs((b.x-a.x)-200/3)<1e-9,'a third of the visible width');
  assert.deepEqual(scaleBarInView(null,dims),[{x:768,y:540},{x:1152,y:540}],'unchanged default without a view');
});

test('VIEW-05: after a zoom step the anchored point returns to the centre of the viewport',()=>{
  const viewport={left:100,top:50,width:800,height:500};
  // Point (1100,662.5) was centred at 4x. At 5x, before scrolling, the canvas has only grown.
  const canvas={left:100-4000,top:50-2400};
  const {dx,dy}=scrollToCenter({x:1100,y:662.5},viewport,canvas,5);
  const scrolled={left:canvas.left-dx,top:canvas.top-dy};
  const view=visibleMediaRect(viewport,scrolled,5,dims);
  assert.deepEqual(viewCenter(view),{x:1100,y:662.5});
});

test('VIEW-06: a failing or missing view provider falls back safely',()=>{
  setMediaViewProvider(()=>{throw new Error('detached');});
  assert.equal(currentMediaView(),null);
  setMediaViewProvider(null);
  assert.equal(currentMediaView(),null);
});

test('VIEW-07: Set scale places the bar in the view; editing keeps the student\'s endpoints',()=>{
  const code=buildSync({stdin:{contents:"export {useStore} from './src/store/useStore.js'; export {setMediaViewProvider} from './src/utils/mediaView.js';",resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text;
  const module={exports:{}};
  const storage={getItem:()=>null,setItem(){},removeItem(){}};
  vm.runInNewContext(code,{require,module,exports:module.exports,console,process,Date,window:{},sessionStorage:storage,localStorage:storage});
  const {useStore:store,setMediaViewProvider:register}=module.exports;
  const view={x0:1000,y0:600,x1:1200,y1:725};
  register(()=>view);
  store.setState({videoSrc:'blob:v',videoDims:dims,zoom:4});
  store.getState().startScaleEdit();
  const placed=plain(store.getState().calibrationPoints);
  assert.ok(placed.every(p=>p.x>view.x0 && p.x<view.x1 && p.y>view.y0 && p.y<view.y1),'both handles are on screen');
  assert.equal(store.getState().applyScale('1'),true);
  register(()=>({x0:0,y0:0,x1:200,y1:125}));
  store.getState().startScaleEdit();
  assert.deepEqual(plain(store.getState().calibrationPoints),placed,'an existing scale is not moved');
});

const view={x0:1000,y0:600,x1:1200,y1:725};

test('VIEW-08: the reticle starts on the nearest marked position when it is on screen',()=>{
  const points=[{x:1010,y:610,time:0},{x:1100,y:700,time:1},{x:1150,y:720,time:2}];
  assert.deepEqual(reticleStart(view,dims,points,1.1),{x:1100,y:700},'nearest in time, not the last one');
  assert.deepEqual(reticleStart(view,dims,[{x:50,y:50,time:1}],1),{x:1100,y:662.5},'an off-screen point is ignored');
  assert.deepEqual(reticleStart(view,dims,[],0),{x:1100,y:662.5});
  assert.deepEqual(reticleStart(view,dims,[{x:NaN,y:1,time:0}],0),{x:1100,y:662.5});
  assert.deepEqual(reticleStart(null,dims,points,2),{x:1150,y:720},'without a view the marked position is trusted');
});

test('VIEW-09: off-screen direction points the way to the tool',()=>{
  assert.equal(offscreenDirection({x:1100,y:650},view),null);
  assert.deepEqual(offscreenDirection({x:10,y:650},view),{h:-1,v:0});
  assert.deepEqual(offscreenDirection({x:1900,y:1000},view),{h:1,v:1});
  assert.deepEqual(offscreenDirection({x:1100,y:10},view),{h:0,v:-1});
  assert.equal(offscreenDirection(null,view),null);
  assert.equal(offscreenDirection({x:1,y:1},null),null);
});

test('VIEW-10: hidden tools are listed once, and a partly visible scale lists only its hidden end',()=>{
  const ids=input=>offscreenTools({view,...input}).map(tool=>tool.id);
  assert.deepEqual(ids({reticle:{x:1100,y:650},scale:[{x:1050,y:650},{x:1150,y:650}]}),[]);
  assert.deepEqual(ids({reticle:{x:10,y:10}}),['reticle']);
  assert.deepEqual(ids({scale:[{x:100,y:100},{x:300,y:100}]}),['scale'],'a bar wholly out of view is one item');
  assert.deepEqual(ids({scale:[{x:1050,y:650},{x:1800,y:650}]}),['scale1'],'zoomed onto one end');
  assert.deepEqual(ids({scale:[{x:500,y:650},{x:1700,y:650}]}),['scale0','scale1'],'zoomed onto the middle of the bar');
  assert.deepEqual(offscreenTools({view:null,reticle:{x:1,y:1}}),[]);
  assert.deepEqual(ids({scale:[{x:1,y:1}]}),[],'an unfinished bar is ignored');
});

test('VIEW-11: off-screen pointer text exists in English and Spanish',()=>{
  for(const key of ['offscreenReticle','offscreenScale','offscreenScaleEnd','offscreenHint','bringHere','goToIt'])
    for(const language of ['en','es'])assert.ok(TRANSLATIONS[language][key],`${language}.${key}`);
});

// The real VideoCanvas with its effects run, over a fake zoomed and scrolled viewport.
function canvasHarness(state) {
  const bundle=buildSync({stdin:{contents:"export {default as Component} from './src/components/VideoCanvas.jsx'; export {useStore} from './src/store/useStore.js';",resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react']}).outputFiles[0].text;
  const slots=[],effects=[];let index=0,tree;
  const hooks={...require('react'),useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return [slots[at],v=>{slots[at]=v;}];},
    useMemo:fn=>fn(),useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useSyncExternalStore:(_s,get)=>get(),useDebugValue(){},memo:fn=>fn};
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const module={exports:{}}, storage={getItem:()=>null,setItem(){},removeItem(){}};
  vm.runInNewContext(bundle,{require:n=>n==='react'?hooks:n==='react/jsx-runtime'?runtime:require(n),module,exports:module.exports,
    console,process,Date,setTimeout,clearTimeout,requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
    sessionStorage:storage,localStorage:storage,window:{addEventListener(){},removeEventListener(){}},document:{}});
  const store=module.exports.useStore;
  store.setState({videoSrc:'blob:v',videoDims:dims,zoom:2,activeObjId:'A',...state});
  const all=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(all)];
  // 800x500 viewport over media zoomed 2x, showing media x 1000-1400, y 500-750.
  const viewport={scrollLeft:2000,scrollTop:1000,getBoundingClientRect:()=>({left:0,top:0,width:800,height:500})};
  const canvasRect={getBoundingClientRect:()=>({left:-viewport.scrollLeft,top:-viewport.scrollTop,width:3840,height:2160})};
  const video={currentTime:0,load(){},addEventListener(){},removeEventListener(){},pause(){}};
  const render=()=>{index=0;effects.length=0;
    tree=module.exports.Component({points:store.getState().objects[0].points,videoRef:{current:video},autotracking:{navigate(){},enabled:false},pointReview:{cancel(){},status:'idle'}});
    all(tree).find(n=>n.type==='canvas'&&n.props.onPointerDown).props.ref.current=canvasRect;
    all(tree).find(n=>n.props?.onScroll).props.ref.current=viewport;};
  // Mount, then let the off-screen effect measure and re-render, as React would.
  const settle=()=>{render();for(const effect of [...effects]){try{effect();}catch{/* effects unrelated to the view need a real video */}}render();};
  settle();
  const text=node=>all(node).flatMap(n=>[n.props?.children].flat(Infinity).filter(c=>typeof c==='string')).join(' ');
  return {store,viewport,settle,pills:()=>all(tree).filter(n=>n.props?.['data-offscreen']),
    press:(pill,label)=>all(pill).find(n=>n.type==='button'&&text(n)===label).props.onClick()};
}

test('VIEW-12: an off-screen reticle gets a pointer; Bring here moves it into view and the pointer goes',()=>{
  const h=canvasHarness({isTracking:true,reticlePos:{x:100,y:100}});
  const [pill]=h.pills();
  assert.equal(h.pills().length,1);
  assert.equal(pill.props['data-offscreen'],'reticle');
  assert.match(pill.props['aria-label'],/Tracking marker is outside the view/);
  h.press(pill,'Bring here');
  assert.deepEqual(plain(h.store.getState().reticlePos),{x:1200,y:625});
  h.settle();
  assert.equal(h.pills().length,0);
});

test('VIEW-13: Go to it scrolls the view onto the tool without moving the tool',()=>{
  const h=canvasHarness({isTracking:true,reticlePos:{x:100,y:100}});
  h.press(h.pills()[0],'Go to it');
  assert.deepEqual(plain(h.store.getState().reticlePos),{x:100,y:100});
  // Media (100,100) at 2x is content pixel (200,200); centred in an 800x500 viewport.
  assert.equal(h.viewport.scrollLeft,200-400);
  assert.equal(h.viewport.scrollTop,200-250);
});

test('VIEW-14: while setting the scale, a hidden bar can be brought into view; pointers hide when not in use',()=>{
  const h=canvasHarness({isCalibrating:true,calibrationPoints:[{x:100,y:100},{x:300,y:100}]});
  assert.deepEqual(h.pills().map(p=>p.props['data-offscreen']),['scale']);
  h.press(h.pills()[0],'Bring here');
  const placed=plain(h.store.getState().calibrationPoints);
  assert.ok(placed.every(p=>p.x>1000&&p.x<1400&&p.y>500&&p.y<750));
  const idle=canvasHarness({isCalibrating:false,pixelsPerMeter:200,calibrationPoints:[{x:100,y:100},{x:300,y:100}],reticlePos:{x:100,y:100},isTracking:false});
  assert.equal(idle.pills().length,0,'a saved scale and an inactive reticle are not pointed at');
});
