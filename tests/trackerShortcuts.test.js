import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {trackerShortcut, createFocusModality} from '../src/utils/trackerShortcuts.js';
import {TRANSLATIONS} from '../src/utils/translations.js';
import {GUIDE_TEXT} from '../src/utils/guideText.js';

// --- KEY-05/06 decision table -------------------------------------------------
const TYPING=['text','number'];
// Minimal element stand-in: answers the selectors the module asks about.
function element({tag='div',type,role,keyboard=false,inside=null}={}){
  const self={tag,type,role,keyboard,blurred:0,blur(){self.blurred++;},
    is(selector){
      if(selector==='input[type="range"]')return tag==='input'&&type==='range';
      if(selector.startsWith('input:not'))return (tag==='input'&&TYPING.includes(type))||tag==='textarea'||tag==='select';
      if(selector.startsWith('[role="dialog"]'))return ['dialog','menu','listbox','tablist','grid'].includes(role);
      if(selector.startsWith('button,'))return ['button','a','input','summary'].includes(tag);
      throw new Error(`unexpected selector ${selector}`);
    },
    matches:selector=>self.is(selector),
    closest(selector){for(let node=self;node;node=node.inside)if(node.is(selector))return node;return null;},inside};
  return self;
}
const key=(k,target=element(),extra={})=>({key:k,target,repeat:false,defaultPrevented:false,ctrlKey:false,metaKey:false,altKey:false,...extra});
const keyboardFocused=node=>!!node.keyboard;
const manual={active:true,video:true,manual:true,automatic:false,canUndo:true,keyboardFocused};
const idle={active:true,video:true,manual:false,automatic:false,canUndo:true,keyboardFocused};
const action=(event,context)=>trackerShortcut(event,context)?.action??null;

test('KEY-01–04: keys map to the intended action for each tracking state',()=>{
  assert.equal(action(key(' '),manual),'record');
  assert.equal(action(key('Backspace'),manual),'undo');
  assert.equal(action(key('Backspace'),{...manual,canUndo:false}),null);
  for(const k of ['ArrowRight','.'])assert.equal(action(key(k),manual),'next');
  for(const k of ['ArrowLeft',','])assert.equal(action(key(k),manual),'previous');
  assert.equal(action(key(' '),idle),'playPause');
  assert.equal(action(key('Backspace'),idle),null);
  const automatic={...idle,automatic:true};
  assert.equal(action(key(' '),automatic),null);
  assert.equal(action(key('Backspace'),automatic),null);
  assert.equal(action(key('ArrowRight'),automatic),'next');
  const image={...manual,video:false};
  assert.equal(action(key(' '),image),'record');
  assert.equal(action(key('ArrowRight'),image),null);
  assert.equal(action(key(' '),{...idle,video:false}),null);
  assert.equal(action(key('a'),manual),null);
});

test('KEY-05/06: inactive tracker, modifiers and auto-repeat are ignored',()=>{
  for(const k of [' ','Backspace','ArrowRight',','])assert.equal(action(key(k),{...manual,active:false}),null);
  for(const modifier of ['ctrlKey','metaKey','altKey'])assert.equal(action(key('ArrowLeft',element(),{[modifier]:true}),manual),null);
  assert.equal(action(key(' ',element(),{defaultPrevented:true}),manual),null);
  assert.equal(action(key(' ',element(),{repeat:true}),manual),null);
  assert.equal(action(key('Backspace',element(),{repeat:true}),manual),null);
  assert.equal(action(key(' ',element(),{repeat:true}),idle),null);
  assert.equal(action(key('ArrowRight',element(),{repeat:true}),manual),'next');
});

test('KEY-05: keys stay with fields, menus, tabs, tables and keyboard-focused controls',()=>{
  const all=[' ','Backspace','ArrowRight','ArrowLeft',',','.'];
  const owners=[element({tag:'input',type:'number'}),element({tag:'input',type:'text'}),element({tag:'textarea'}),element({tag:'select'}),
    element({tag:'button',inside:element({role:'menu'})}),element({tag:'button',inside:element({role:'tablist'})}),
    element({tag:'div',inside:element({role:'dialog'})}),element({tag:'div',inside:element({role:'grid'})}),
    element({tag:'button',keyboard:true}),element({tag:'input',type:'range',keyboard:true}),element({tag:'input',type:'checkbox',keyboard:true})];
  for(const target of owners)for(const k of all)assert.equal(action(key(k,target),manual),null,`${target.tag}/${target.type??target.inside?.role} ${k}`);
});

test('KEY-05: a control left focused by a mouse click is released, except slider arrows',()=>{
  const button=element({tag:'button'});
  const result=trackerShortcut(key(' ',button),manual);
  assert.equal(result.action,'record');assert.equal(result.blur,button);
  assert.equal(trackerShortcut(key('ArrowRight',button),manual).blur,button);
  const slider=element({tag:'input',type:'range'});
  for(const k of ['ArrowRight','ArrowLeft',',','.'])assert.equal(action(key(k,slider),manual),null);
  assert.equal(trackerShortcut(key(' ',slider),manual).blur,slider);
  assert.equal(trackerShortcut(key(' ',element()),manual).blur,null);
  assert.deepEqual(trackerShortcut(key(' ',null),manual),{action:'record',blur:null});
});

test('KEY-05: focus modality follows the input used to reach a control, not later key presses',()=>{
  const handlers=new Map();
  const target={addEventListener(type,fn,capture){assert.equal(capture,true);handlers.set(type,fn);},removeEventListener(type,fn){if(handlers.get(type)===fn)handlers.delete(type);}};
  const modality=createFocusModality(target);
  const fire=(type,node)=>handlers.get(type)?.({type,target:node});
  const button={},other={};
  fire('pointerdown',button);fire('focusin',button);
  assert.equal(modality.byKeyboard(button),false);
  // Pressing Space afterwards must not turn the mouse-focused button into a keyboard-focused one.
  fire('keydown',button);assert.equal(modality.byKeyboard(button),false);
  // Script focus that follows a mouse choice (menu closing) is still pointer focus.
  fire('mousedown',other);fire('focusin',button);assert.equal(modality.byKeyboard(button),false);
  fire('keydown',button);fire('focusin',other);assert.equal(modality.byKeyboard(other),true,'Tab reaches a control');
  assert.equal(modality.byKeyboard(button),false);assert.equal(modality.byKeyboard(null),false);
  fire('pointerdown',other);fire('focusin',other);assert.equal(modality.byKeyboard(other),false);
  modality.dispose();fire('keydown',other);fire('focusin',button);assert.equal(modality.byKeyboard(button),false);
});

// --- Real VideoCanvas key handler -----------------------------------------------
const require=createRequire(import.meta.url);
const bundle=buildSync({stdin:{contents:"export {default as Component} from './src/components/VideoCanvas.jsx'; export {useStore} from './src/store/useStore.js';",resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react']}).outputFiles[0].text;
function harness(state={},autotracking={}){
  const slots=[],effects=[],listeners=new Set();let index=0,tree,mounted=false;
  const hooks={...require('react'),useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;return [slots[at],v=>{slots[at]=v;}];},
    useMemo:fn=>fn(),useCallback:fn=>fn,useEffect:(fn,deps)=>effects.push({fn,deps}),useSyncExternalStore:(_subscribe,get)=>get(),useDebugValue(){},memo:fn=>fn};
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const module={exports:{}};
  const window={addEventListener(type,fn,capture){if(type==='keydown'&&!capture)listeners.add(fn);},removeEventListener(type,fn){listeners.delete(fn);}};
  vm.runInNewContext(bundle,{require:n=>n==='react'?hooks:n==='react/jsx-runtime'?runtime:require(n),module,exports:module.exports,
    console,setTimeout(){return 0;},clearTimeout(){},requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
    localStorage:{getItem:()=>null,setItem(){}},window,document:{}});
  class Video extends EventTarget {
    time=3.5/30;duration=20;paused=true;seeking=false;readyState=2;writes=[];plays=0;
    get currentTime(){return this.time;}
    set currentTime(v){this.time=v;this.seeking=true;this.writes.push(v);this.dispatchEvent(new Event('seeking'));}
    pause(){this.paused=true;}async play(){this.plays++;this.paused=false;}load(){}finish(){this.seeking=false;this.dispatchEvent(new Event('seeked'));}
  }
  const video=new Video(),store=module.exports.useStore,calls={navigate:0,cancel:0};
  store.setState({viewMode:'tracker',videoSrc:'blob:test',currentTime:video.currentTime,currentFrameIndex:3,fps:30,isTracking:true,
    reticlePos:{x:42,y:67},activeObjId:'A',...state});
  const cleanups=[];
  // Mount effects run once; effects without a dependency list run after every render, as in React.
  function render(){index=0;effects.length=0;
    tree=module.exports.Component({points:store.getState().objects.find(o=>o.id===store.getState().activeObjId)?.points??[],videoRef:{current:video},
      autotracking:{navigate(){calls.navigate++;},enabled:false,...autotracking},pointReview:{cancel(){calls.cancel++;},status:'idle'}});
    for(const effect of effects)if(!mounted||effect.deps===undefined)cleanups.push(effect.fn());
    mounted=true;}
  render();
  function press(k,extra={}){let prevented=false;
    const event={key:k,target:null,repeat:false,defaultPrevented:false,ctrlKey:false,metaKey:false,altKey:false,preventDefault(){prevented=true;},...extra};
    assert.equal(listeners.size,1,'one window key listener');
    [...listeners].forEach(fn=>fn(event));render();return prevented;}
  const points=()=>store.getState().objects[0].points;
  function all(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(all)];}
  return {video,store,press,points,calls,render,nodes:()=>all(tree),dispose(){cleanups.forEach(fn=>fn?.());}};
}

test('KEY-01/06: Space records at the reticle and advances exactly one frame',()=>{
  const h=harness();try{
    assert.equal(h.press(' '),true);
    assert.deepEqual(JSON.parse(JSON.stringify(h.points())),[{id:0,x:42,y:67,time:3.5/30}]);
    assert.equal(h.store.getState().currentFrameIndex,4);assert.deepEqual(h.video.writes,[4.5/30]);
    // Still decoding: a second press must not record or skip a frame.
    h.press(' ');assert.equal(h.points().length,1);assert.equal(h.video.writes.length,1);
    h.video.finish();h.render();
    h.press(' ',{repeat:true});assert.equal(h.points().length,1);
    h.store.setState({reticlePos:{x:50,y:70}});h.render();h.press(' ');
    assert.equal(h.points().length,2);assert.equal(h.points()[1].time,4.5/30);assert.equal(h.points()[1].x,50);
    assert.equal(h.store.getState().currentFrameIndex,5);
  }finally{h.dispose();}
});

test('KEY-02: arrow, comma and period keys step one frame like the buttons',()=>{
  const h=harness();try{
    assert.equal(h.press('ArrowRight'),true);assert.equal(h.video.currentTime,4.5/30);
    assert.equal(h.calls.navigate,1);assert.equal(h.calls.cancel,1);
    h.press('ArrowRight');assert.equal(h.video.writes.length,1,'dropped while decoding');
    h.video.finish();h.render();h.press('.');assert.equal(h.video.currentTime,5.5/30);
    h.video.finish();h.render();h.press('ArrowLeft');assert.equal(h.video.currentTime,4.5/30);
    h.video.finish();h.render();h.press(',');assert.equal(h.video.currentTime,3.5/30);
    assert.equal(h.store.getState().currentFrameIndex,3);assert.equal(h.points().length,0);
  }finally{h.dispose();}
});

test('KEY-03: Backspace removes the last point and returns to its frame',()=>{
  const h=harness();try{
    h.press(' ');h.video.finish();h.render();h.press(' ');h.video.finish();h.render();
    assert.equal(h.points().length,2);assert.equal(h.store.getState().currentFrameIndex,5);
    assert.equal(h.press('Backspace'),true);
    assert.equal(h.points().length,1);assert.equal(h.points()[0].time,3.5/30);
    assert.equal(h.video.currentTime,4.5/30);assert.equal(h.store.getState().currentFrameIndex,4);
    h.press('Backspace');assert.equal(h.points().length,1,'ignored while decoding');
    h.video.finish();h.render();h.press('Backspace',{repeat:true});assert.equal(h.points().length,1);
    h.press('Backspace');assert.equal(h.points().length,0);assert.equal(h.video.currentTime,3.5/30);
    h.video.finish();h.render();
    assert.equal(h.press('Backspace'),false,'nothing to undo: key left alone');
  }finally{h.dispose();}
});

test('KEY-04: Space plays/pauses outside manual tracking and is inert in automatic tracking',()=>{
  const idle=harness({isTracking:false,reticlePos:null});try{
    assert.equal(idle.press(' '),true);assert.equal(idle.video.plays,1);assert.equal(idle.points().length,0);
    assert.equal(idle.press('Backspace'),false);
  }finally{idle.dispose();}
  const auto=harness({isTracking:false,reticlePos:null},{enabled:true});try{
    assert.equal(auto.press(' '),false);assert.equal(auto.video.plays,0);assert.equal(auto.calls.navigate,0);
    assert.equal(auto.press('ArrowRight'),true);assert.equal(auto.calls.navigate,1);
  }finally{auto.dispose();}
});

test('KEY-05: shortcuts are off in Analysis, with the distance dialog open and for COM',()=>{
  for(const state of [{viewMode:'analysis'},{showInputModal:true,isCalibrating:true,calibrationPoints:[{x:1,y:1},{x:9,y:1}]}]){
    const h=harness(state);try{
      for(const k of [' ','Backspace','ArrowRight',','])assert.equal(h.press(k),false,JSON.stringify(state)+k);
      assert.equal(h.points().length,0);assert.equal(h.video.writes.length,0);
    }finally{h.dispose();}
  }
  const com=harness({activeObjId:'COM'});try{
    assert.equal(com.press('Backspace'),false);
    com.press(' ');assert.equal(com.store.getState().objects.every(o=>o.points.length===0),true);
  }finally{com.dispose();}
});

test('KEY-05: a mouse-focused button is released instead of being activated',()=>{
  const h=harness();try{
    let blurred=0;
    const button={blur(){blurred++;},matches:selector=>selector!=='input[type="range"]',
      closest(selector){return selector.startsWith('button,')?button:null;}};
    assert.equal(h.press(' ',{target:button}),true);
    assert.equal(blurred,1);assert.equal(h.points().length,1);
  }finally{h.dispose();}
});

test('KEY-07: tooltips and help name the keys in English and Spanish',()=>{
  for(const language of ['en','es']){
    const h=harness({language});try{
      const t=TRANSLATIONS[language],button=label=>h.nodes().find(n=>n.type==='button'&&n.props['aria-label']===label);
      assert.equal(button(t.undoLast).props.title,`${t.undoLast} (${t.keyBackspace})`);
      assert.equal(button(t.playPause).props.title,`${t.playPause} (${t.keySpace})`);
      assert.match(button(t.prevFrame).props.title,/←/);assert.match(button(t.nextFrame).props.title,/→/);
      assert.match(GUIDE_TEXT[language].manualHelp,new RegExp(t.keySpace));
      assert.match(GUIDE_TEXT[language].manualHelp,new RegExp(t.keyBackspace));
    }finally{h.dispose();}
  }
});
