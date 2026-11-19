import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const bundle=buildSync({stdin:{contents:"export {default as Component} from './src/components/VideoCanvas.jsx'; export {useStore} from './src/store/useStore.js';",resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react']}).outputFiles[0].text;

// Renders the real VideoCanvas with minimal hook stand-ins, as timelineTracking.test.js does.
function renderCanvas(state){
  const slots=[];let index=0;
  const hooks={...require('react'),useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return [slots[at],v=>{slots[at]=v;}];},
    useMemo:fn=>fn(),useCallback:fn=>fn,useEffect(){},useSyncExternalStore:(_subscribe,get)=>get(),useDebugValue(){},memo:fn=>fn};
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const module={exports:{}};
  vm.runInNewContext(bundle,{require:n=>n==='react'?hooks:n==='react/jsx-runtime'?runtime:require(n),module,exports:module.exports,
    console,setTimeout,clearTimeout,requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
    localStorage:{getItem:()=>null,setItem(){}},window:{},document:{}});
  const store=module.exports.useStore;
  store.setState({videoSrc:'blob:test',videoDims:{w:1920,h:1080},zoom:3,...state});
  const tree=module.exports.Component({points:[],videoRef:{current:null},autotracking:{navigate(){},enabled:false},pointReview:{cancel(){},status:'idle'}});
  return {tree,store};
}
const children=node=>[node?.props?.children].flat(Infinity).filter(child=>child&&typeof child==='object');
const descendants=node=>children(node).flatMap(child=>[child,...descendants(child)]);
const isViewport=node=>typeof node.props?.className==='string'&&node.props.className.includes('overflow-auto');

test('CAL-08: the distance dialog sits outside the scrolling video viewport',()=>{
  const {tree}=renderCanvas({isCalibrating:true,showInputModal:true,calibrationPoints:[{x:1500,y:900},{x:1700,y:900}]});
  const viewport=descendants(tree).find(isViewport);
  assert.ok(viewport,'scrolling viewport is rendered');
  const inViewport=descendants(viewport);
  assert.ok(inViewport.some(n=>n.type==='canvas'),'the media canvas stays inside the viewport');
  assert.equal(inViewport.filter(n=>n.type==='input'&&n.props.type==='number').length,0,
    'a focusable field inside the viewport lets the browser scroll a zoomed video');
  const input=descendants(tree).find(n=>n.type==='input'&&n.props.type==='number');
  assert.ok(input,'distance field is rendered');
  assert.notEqual(input.props.autoFocus,true);
});

test('CAL-08: the distance field takes focus without asking the browser to scroll',()=>{
  const {tree}=renderCanvas({isCalibrating:true,showInputModal:true,calibrationPoints:[{x:1500,y:900},{x:1700,y:900}]});
  const input=descendants(tree).find(n=>n.type==='input'&&n.props.type==='number');
  const calls=[];
  input.props.ref({focus:options=>calls.push(options)});
  input.props.ref(null);
  assert.equal(calls.length,1);
  assert.equal(calls[0].preventScroll,true);
});

test('CAL-08: saving the distance keeps zoom and the placed scale endpoints',()=>{
  const points=[{x:1500,y:900},{x:1700,y:900}];
  const {tree,store}=renderCanvas({isCalibrating:true,showInputModal:true,calibrationPoints:points});
  const isField=n=>n.type==='input'&&n.props.type==='number';
  const dialog=descendants(tree).filter(n=>descendants(n).some(isField)&&descendants(n).some(c=>c.type==='button')).at(-1);
  // Cancel then Save; the default distance value is used, only the resulting state matters here.
  const save=descendants(dialog).filter(n=>n.type==='button').at(-1);
  save.props.onClick();
  const state=store.getState();
  assert.equal(state.zoom,3);
  assert.deepEqual(JSON.parse(JSON.stringify(state.calibrationPoints)),points);
  assert.equal(state.showInputModal,false);
  assert.equal(state.isCalibrating,false);
  assert.ok(state.pixelsPerMeter>0);
});
