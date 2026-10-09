import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {transform} from 'esbuild';

const require=createRequire(import.meta.url);
const code=(await transform(fs.readFileSync(new URL('../src/components/TrackingModeMenu.jsx',import.meta.url),'utf8'),
  {loader:'jsx',format:'cjs',jsx:'automatic'})).code;

// Replay component event handlers with controlled focus ordering. This does not
// emulate browser focus defaults; real iPad/desktop acceptance is separate.
function harness() {
  const slots=[],listeners=new Map();
  let index=0,effects=[],cleanups=[],tree;
  const state={language:'en',theme:'dark',activeObjId:'A',videoSrc:'video',fpsConfirmed:true,isTracking:false,isSettingOrigin:true};
  for(const key of ['isTracking','isSettingOrigin','isCalibrating','showInputModal','activeClickTarget'])
    state[`set${key[0].toUpperCase()+key.slice(1)}`]=value=>{state[key]=value;};
  state.sidebarViews={controls:'root',tools:'root'};
  state.navigateSidebar=(tab,view)=>{state.sidebarTab=tab;state.sidebarViews[tab]=view;};
  const tracking={enabled:false,toggle(){this.enabled=!this.enabled;}};
  const store=selector=>selector(state);store.getState=()=>state;
  const hooks={
    useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;
      return [slots[at],v=>{slots[at]=typeof v==='function'?v(slots[at]):v;}];},
    useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useId:()=> 'tracking-menu',
    useEffect(fn,deps){const at=index++;if(!slots[at]||deps.some((d,i)=>d!==slots[at][i]))effects.push(()=>{cleanups[at]?.();cleanups[at]=fn();});slots[at]=deps;}
  };
  const inside={focus(){}},outside={};
  let restoredFocus=0;
  const container={contains:node=>node===inside,querySelector:()=>({focus(){restoredFocus++;}})};
  const document={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name)=>listeners.delete(name)};
  const module={exports:{}};
  const imports=name=>name==='react'?hooks:name==='../store/useStore'?{useStore:store}:
    name==='../utils/translations'?{TRANSLATIONS:{en:{auto:{}}}}:require(name);
  vm.runInNewContext(code,{require:imports,module,exports:module.exports,document});
  function render(){index=0;effects=[];tree=module.exports.default({tracking,renderTrigger:props=>({props})});
    tree.props.ref.current=container;
    const menu=tree.props.children[1];if(menu)menu.props.ref.current={querySelector:()=>inside};
    effects.forEach(fn=>fn());
  }
  render();
  const api={state,inside,outside,
    open(){tree.props.children[0].props.toggle();render();},
    pointer(type='touch'){tree.props.onPointerDownCapture?.({pointerType:type,target:inside});documentEvent('pointerdown',{target:inside,pointerType:type});},
    blur(target){tree.props.onBlur({currentTarget:container,relatedTarget:target});render();},
    click(mode='manual'){const menu=tree.props.children[1];if(menu)menu.props.children[mode==='automatic'?1:0].props.onClick();render();},
    key(key){documentEvent('keydown',{key,preventDefault(){}});render();},
    outsidePress(){documentEvent('pointerdown',{target:outside});render();},
    get openNow(){return !!tree.props.children[1];},get restoredFocus(){return restoredFocus;}
  };
  function documentEvent(name,event){listeners.get(name)?.(event);}
  return api;
}

for(const pointer of ['touch','pen','mouse'])test(`Tracking selection survives ${pointer} focus loss before click`,()=>{
  for(const target of ['null','outside']){
    const h=harness();h.open();h.pointer(pointer);h.blur(target==='null'?null:h.outside);
    assert.equal(h.openNow,true,'internal press must not remove the selection target');
    h.click();assert.equal(h.state.isTracking,true);assert.equal(h.state.isSettingOrigin,false);
    assert.equal(h.openNow,false);
  }
});

test('Tracking selection opens Data for manual and Automatic Controls for automatic',()=>{
  const h=harness();h.open();h.click('manual');
  assert.equal(h.state.sidebarTab,'data');
  h.open();h.click('automatic');
  assert.equal(h.state.sidebarTab,'controls');
  assert.equal(h.state.sidebarViews.controls,'automatic');
});
test('Outside presses and keyboard focus departure dismiss tracking menu',()=>{
  const h=harness();h.open();h.pointer();h.outsidePress();assert.equal(h.openNow,false);
  h.open();h.pointer();h.key('Tab');h.blur(h.outside);assert.equal(h.openNow,false);
  assert.equal(h.state.isTracking,false);
});
test('Escape dismisses after a cancelled touch leaves focus outside the menu',()=>{
  const h=harness();h.open();h.pointer();h.blur(null);h.key('Escape');
  assert.equal(h.openNow,false);assert.equal(h.state.isTracking,false);assert.equal(h.restoredFocus,1);
});
