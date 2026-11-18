import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {TRANSLATIONS} from '../src/utils/translations.js';
const require=createRequire(import.meta.url);
const bundle=buildSync({stdin:{contents:"export {default as Component} from './src/components/VideoCanvas.jsx'; export {useStore} from './src/store/useStore.js';",resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react']}).outputFiles[0].text;
function harness(){
  const slots=[],effects=[],tasks=new Map();let index=0,id=0,tree;
  const hooks={...require('react'),useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return [slots[at],v=>{slots[at]=v;}];},
    useMemo:fn=>fn(),useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useSyncExternalStore:(_subscribe,get)=>get(),useDebugValue(){},memo:fn=>fn};
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const module={exports:{}};
  const schedule=fn=>{tasks.set(++id,fn);return id;};
  vm.runInNewContext(bundle,{require:n=>n==='react'?hooks:n==='react/jsx-runtime'?runtime:require(n),module,exports:module.exports,
    console,setTimeout,clearTimeout,requestAnimationFrame:schedule,cancelAnimationFrame:id=>tasks.delete(id),
    localStorage:{getItem:()=>null,setItem(){}},window:{},document:{}});
  class Video extends EventTarget {
    time=3.5/30;duration=20;paused=true;seeking=false;readyState=2;writes=[];
    get currentTime(){return this.time;}
    set currentTime(v){this.time=v;this.seeking=true;this.writes.push(v);this.dispatchEvent(new Event('seeking'));}
    pause(){this.paused=true;}load(){}finish(){this.seeking=false;this.dispatchEvent(new Event('seeked'));}
  }
  const video=new Video(),store=module.exports.useStore;
  store.setState({videoSrc:'blob:test',currentTime:video.currentTime,currentFrameIndex:3,fps:30,reticlePos:{x:42,y:67},dragState:'reticle',activeObjId:'A'});
  function render(){index=0;effects.length=0;tree=module.exports.Component({points:store.getState().objects[0].points,videoRef,autotracking:{navigate(){},enabled:false},pointReview:{cancel(){},status:'idle'}});}
  const videoRef={current:video};render();const cleanup=effects.map(fn=>fn());
  function all(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(all)];}
  return {video,store,render,tick(){const batch=[...tasks.values()];tasks.clear();batch.forEach(fn=>fn());},
    nodes:()=>all(tree),dispose(){cleanup.forEach(fn=>fn?.());}};
}
const release={clientX:0,clientY:0,pointerId:1,currentTarget:{releasePointerCapture(){}}};

test('SCRUB-04: real tracking click preserves position/time and advances exactly one frame to midpoint',()=>{
  const h=harness();try{
    h.nodes().find(n=>n.type==='canvas').props.onPointerUp(release);
    const state=h.store.getState(),point=state.objects[0].points[0];
    assert.equal(point.x,42);assert.equal(point.y,67);assert.equal(point.time,3.5/30);
    assert.equal(state.currentFrameIndex,4);assert.equal(h.video.writes.length,1);assert.equal(h.video.currentTime,4.5/30);
    // A second click before decode must not record another point or skip a frame.
    h.store.setState({dragState:'reticle'});h.render();
    h.nodes().find(n=>n.type==='canvas').props.onPointerUp(release);
    assert.equal(h.store.getState().objects[0].points.length,1);assert.equal(h.video.writes.length,1);
  }finally{h.dispose();}
});
test('SCRUB-03/04: timeline completion synchronizes index; tracking then advances once with no delayed jump',()=>{
  const h=harness();try{
    h.video.paused=false;h.store.setState({isPlaying:true});h.render();
    const slider=()=>h.nodes().find(n=>n.props['aria-label']==='Video position');
    slider().props.onChange({target:{value:'2'}});h.tick();
    assert.equal(h.video.paused,true);assert.equal(h.store.getState().isPlaying,false);
    slider().props.onChange({target:{value:'4'}});
    h.nodes().find(n=>n.type==='canvas').props.onPointerUp(release);
    assert.equal(h.store.getState().objects[0].points.length,0);
    h.video.finish();h.tick();h.video.finish();
    assert.equal(h.store.getState().currentFrameIndex,120);assert.equal(h.store.getState().currentTime,4);
    h.store.setState({dragState:'reticle'});h.render();
    h.nodes().find(n=>n.type==='canvas').props.onPointerUp(release);
    assert.equal(h.store.getState().objects[0].points[0].time,4);
    assert.equal(h.store.getState().currentFrameIndex,121);assert.equal(h.video.currentTime,121.5/30);
    h.video.finish();h.tick();assert.deepEqual(h.video.writes,[2,4,121.5/30]);
  }finally{h.dispose();}
});

test('SCRUB-04: forward and backward buttons retain one-frame midpoint steps',()=>{
  const h=harness();try{
    const button=key=>h.nodes().find(n=>n.type==='button' && n.props.title===TRANSLATIONS.en[key]);
    button('nextFrame').props.onClick();assert.equal(h.video.currentTime,4.5/30);
    h.video.finish();h.render();button('prevFrame').props.onClick();
    assert.ok(Math.abs(h.video.currentTime-3.5/30)<1e-12);
    assert.equal(h.store.getState().objects[0].points.length,0);
  }finally{h.dispose();}
});
