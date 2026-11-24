import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import process from 'node:process';
import {TRANSLATIONS} from '../src/utils/translations.js';

const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));

// Each load gets a fresh store module, so the autosave restore path runs again.
function loadStore(saved=null){
  const writes=[];
  const code=buildSync({stdin:{contents:"export {useStore} from './src/store/useStore.js';",resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text;
  const module={exports:{}};
  vm.runInNewContext(code,{require,module,exports:module.exports,console,process,window:{},
    sessionStorage:{getItem:()=>saved && JSON.stringify(saved),setItem:(_,value)=>writes.push(JSON.parse(value)),removeItem(){}},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}}});
  return {store:module.exports.useStore,writes};
}
const plain=value=>JSON.parse(JSON.stringify(value));
const scaled={videoSrc:'blob:v',videoDims:{w:1000,h:500},calibrationPoints:[{x:100,y:250},{x:300,y:250}],pixelsPerMeter:400,scaleDistance:0.5};

test('SCALE-EDIT-01: editing an existing scale keeps its endpoints and fills in the last distance',()=>{
  const {store}=loadStore();
  store.setState({...scaled,realDistanceInput:'1.0',isTracking:true});
  store.getState().startScaleEdit();
  const s=store.getState();
  assert.equal(s.isCalibrating,true);
  assert.equal(s.isTracking,false);
  assert.deepEqual(plain(s.calibrationPoints),scaled.calibrationPoints);
  assert.equal(s.realDistanceInput,'0.5');
  assert.equal(s.pixelsPerMeter,400,'the old scale stays in effect until the edit is saved');
});

test('SCALE-EDIT-02: saving a corrected scale recalculates pixelsPerMeter and remembers the distance',()=>{
  const {store,writes}=loadStore();
  store.setState(scaled);
  store.getState().startScaleEdit();
  store.getState().setCalibrationPoints([{x:100,y:250},{x:600,y:250}]);
  assert.equal(store.getState().applyScale('2'),true);
  const s=store.getState();
  assert.equal(s.pixelsPerMeter,250);
  assert.equal(s.scaleDistance,2);
  assert.equal(s.isCalibrating,false);
  assert.equal(s.isScaleVisible,true);
  assert.equal(s.scaleEditBackup,null);
  assert.equal(writes.at(-1).scaleDistance,2,'the distance is autosaved');
});

test('SCALE-EDIT-03: cancelling an edit restores the previous endpoints and scale',()=>{
  const {store}=loadStore();
  store.setState(scaled);
  store.getState().startScaleEdit();
  store.getState().setCalibrationPoints([{x:0,y:0},{x:900,y:400}]);
  store.getState().cancelScaleEdit();
  const s=store.getState();
  assert.deepEqual(plain(s.calibrationPoints),scaled.calibrationPoints);
  assert.equal(s.pixelsPerMeter,400);
  assert.equal(s.isCalibrating,false);
});

test('SCALE-EDIT-04: a first scale starts from default endpoints and Cancel clears them',()=>{
  const {store}=loadStore();
  store.setState({videoSrc:'blob:v',videoDims:{w:1000,h:500}});
  store.getState().startScaleEdit();
  assert.deepEqual(plain(store.getState().calibrationPoints),[{x:400,y:250},{x:600,y:250}]);
  store.getState().cancelScaleEdit();
  assert.deepEqual(plain(store.getState().calibrationPoints),[]);
  assert.equal(store.getState().pixelsPerMeter,null);
});

test('SCALE-EDIT-05: invalid distances are rejected without changing the scale',()=>{
  const {store}=loadStore();
  store.setState(scaled);
  store.getState().startScaleEdit();
  for(const value of ['0','-1','abc',''])assert.equal(store.getState().applyScale(value),false);
  store.getState().setCalibrationPoints([{x:5,y:5},{x:5,y:5}]);
  assert.equal(store.getState().applyScale('1'),false,'zero-length bar cannot define a scale');
  assert.equal(store.getState().pixelsPerMeter,400);
  assert.equal(store.getState().isCalibrating,true);
});

test('SCALE-EDIT-06: reset removes the scale, its endpoints and distance',()=>{
  const {store}=loadStore();
  store.setState({...scaled,isScaleVisible:false});
  store.getState().resetScale();
  const s=store.getState();
  assert.equal(s.pixelsPerMeter,null);
  assert.equal(s.scaleDistance,null);
  assert.deepEqual(plain(s.calibrationPoints),[]);
  assert.equal(s.isScaleVisible,true);
});

test('SCALE-EDIT-07: a restored session brings back the scale distance for later edits',()=>{
  const {store}=loadStore({objects:[],calibrationPoints:scaled.calibrationPoints,pixelsPerMeter:400,scaleDistance:0.5});
  assert.equal(store.getState().scaleDistance,0.5);
  assert.equal(store.getState().realDistanceInput,'0.5');
  const legacy=loadStore({objects:[],pixelsPerMeter:400,scaleDistance:'bad'}).store;
  assert.equal(legacy.getState().scaleDistance,null);
});

test('SCALE-EDIT-08: scale endpoints can be dragged only while setting or editing the scale',()=>{
  const bundle=buildSync({stdin:{contents:"export {default as Component} from './src/components/VideoCanvas.jsx'; export {useStore} from './src/store/useStore.js';",resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react']}).outputFiles[0].text;
  const slots=[];let index=0;
  const hooks={...require('react'),useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return [slots[at],v=>{slots[at]=v;}];},
    useMemo:fn=>fn(),useCallback:fn=>fn,useEffect(){},useSyncExternalStore:(_s,get)=>get(),useDebugValue(){},memo:fn=>fn};
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const module={exports:{}};
  vm.runInNewContext(bundle,{require:n=>n==='react'?hooks:n==='react/jsx-runtime'?runtime:require(n),module,exports:module.exports,
    console,setTimeout,clearTimeout,requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
    localStorage:{getItem:()=>null,setItem(){}},window:{},document:{}});
  const store=module.exports.useStore;
  const children=node=>[node?.props?.children].flat(Infinity).filter(c=>c&&typeof c==='object');
  const all=node=>children(node).flatMap(c=>[c,...all(c)]);
  const pressOnEndpoint=calibrating=>{
    index=0;
    store.setState({...scaled,zoom:1,isCalibrating:calibrating,dragState:null,activeObjId:'A'});
    const tree=module.exports.Component({points:[],videoRef:{current:{}},autotracking:{navigate(){},enabled:false},pointReview:{cancel(){},status:'idle'}});
    const canvas=all(tree).find(n=>n.type==='canvas' && n.props.onPointerDown);
    canvas.props.ref.current={getBoundingClientRect:()=>({left:0,top:0,width:1000,height:500})};
    canvas.props.onPointerDown({clientX:100,clientY:250,pointerId:1,pointerType:'mouse',button:0,preventDefault(){},stopPropagation(){},currentTarget:{setPointerCapture(){}}});
    return store.getState().dragState;
  };
  assert.notEqual(pressOnEndpoint(false),'calibration','a saved scale line is display-only');
  assert.equal(pressOnEndpoint(true),'calibration');
});

test('SCALE-EDIT-09: scale controls have English and Spanish text',()=>{
  for(const key of ['editScale','resetScale','resetScaleConfirm','invalidDistance','scaleDistanceLabel','hideScale','showScale']) {
    assert.ok(TRANSLATIONS.en[key],`en.${key}`);
    assert.ok(TRANSLATIONS.es[key],`es.${key}`);
  }
});
