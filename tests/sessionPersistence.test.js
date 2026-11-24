import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import process from 'node:process';
import {SESSION_KEY, RECOVERY_KEY, PREFS_KEY, LEGACY_KEY, RECOVERY_TTL_MS,
  readStartup, readRecovery, writeAutosave, clearWork, hasWork, savedAgo} from '../src/utils/sessionPersistence.js';

const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));
const HOUR=60*60*1000, NOW=Date.UTC(2026,10,23,9);

function memory(initial={}) {
  const items=new Map(Object.entries(initial).map(([k,v])=>[k,JSON.stringify(v)]));
  return {items,getItem:k=>items.has(k)?items.get(k):null,setItem:(k,v)=>{items.set(k,String(v));},removeItem:k=>{items.delete(k);},
    json:k=>items.has(k)?JSON.parse(items.get(k)):null};
}
const work={objects:[{id:'A',points:[{x:1,y:2,time:0}]}],pixelsPerMeter:300,scaleDistance:1,language:'es'};
const empty={objects:[{id:'A',points:[]},{id:'B',points:[]}],language:'en'};
const plain=value=>JSON.parse(JSON.stringify(value));

test('PERSIST-01: a new tab with no saved work starts clean',()=>{
  const start=readStartup({session:memory(),local:memory(),now:NOW});
  assert.equal(start.data,null);
  assert.equal(start.recoverySavedAt,null);
});

test('PERSIST-02: a refresh in the same tab restores the work and does not offer recovery',()=>{
  const start=readStartup({session:memory({[SESSION_KEY]:work}),local:memory({[RECOVERY_KEY]:{savedAt:NOW-HOUR,data:work}}),now:NOW});
  assert.deepEqual(start.data,work);
  assert.equal(start.recoverySavedAt,null);
});

test('PERSIST-03: a new tab offers recent work for recovery but never loads it',()=>{
  const start=readStartup({session:memory(),local:memory({[RECOVERY_KEY]:{savedAt:NOW-2*HOUR,data:work}}),now:NOW});
  assert.equal(start.data,null);
  assert.equal(start.recoverySavedAt,NOW-2*HOUR);
  assert.deepEqual(readRecovery({local:memory({[RECOVERY_KEY]:{savedAt:NOW-2*HOUR,data:work}}),now:NOW}),work);
});

test('PERSIST-04: recovery copies expire and are deleted',()=>{
  const local=memory({[RECOVERY_KEY]:{savedAt:NOW-RECOVERY_TTL_MS-1,data:work}});
  const start=readStartup({session:memory(),local,now:NOW});
  assert.equal(start.recoverySavedAt,null);
  assert.equal(local.getItem(RECOVERY_KEY),null);
  assert.equal(readRecovery({local:memory({[RECOVERY_KEY]:{savedAt:NOW-RECOVERY_TTL_MS,data:work}}),now:NOW}),null);
  assert.equal(readRecovery({local:memory({[RECOVERY_KEY]:{savedAt:NOW+HOUR,data:work}}),now:NOW}),null,'a clock moved back does not keep work forever');
  assert.equal(readRecovery({local:memory({[RECOVERY_KEY]:'not an entry'}),now:NOW}),null);
});

test('PERSIST-05: saves from the previous version become an opt-in recovery copy',()=>{
  const local=memory({[LEGACY_KEY]:work});
  const start=readStartup({session:memory(),local,now:NOW});
  assert.equal(start.data,null,'old work is not loaded on its own');
  assert.equal(start.recoverySavedAt,NOW);
  assert.equal(local.getItem(LEGACY_KEY),null);
  assert.deepEqual(local.json(RECOVERY_KEY).data,work);
  assert.equal(start.prefs.language,'es','language carries over');
  const blank=memory({[LEGACY_KEY]:empty});
  assert.equal(readStartup({session:memory(),local:blank,now:NOW}).recoverySavedAt,null);
  assert.equal(blank.getItem(RECOVERY_KEY),null,'empty legacy saves are dropped');
});

test('PERSIST-06: autosave writes the session, keeps recovery until there is new work, and keeps language',()=>{
  const session=memory(), local=memory({[RECOVERY_KEY]:{savedAt:NOW-HOUR,data:work}});
  writeAutosave(empty,{session,local,now:NOW});
  assert.deepEqual(session.json(SESSION_KEY),empty);
  assert.equal(local.json(RECOVERY_KEY).savedAt,NOW-HOUR,'opening the app does not erase recoverable work');
  assert.deepEqual(local.json(PREFS_KEY),{language:'en'});
  writeAutosave(work,{session,local,now:NOW});
  assert.deepEqual(local.json(RECOVERY_KEY),{savedAt:NOW,data:work});
  assert.throws(()=>writeAutosave(work,{session:null,local,now:NOW}));
  const full={...memory(),setItem(){throw new Error('quota');}};
  assert.doesNotThrow(()=>writeAutosave(work,{session,local:full,now:NOW}),'a full recovery area does not fail the session save');
});

test('PERSIST-07: clearing work removes every copy but keeps preferences',()=>{
  const session=memory({[SESSION_KEY]:work}), local=memory({[RECOVERY_KEY]:{savedAt:NOW,data:work},[LEGACY_KEY]:work,[PREFS_KEY]:{language:'es'}});
  clearWork({session,local});
  assert.equal(session.getItem(SESSION_KEY),null);
  assert.equal(local.getItem(RECOVERY_KEY),null);
  assert.equal(local.getItem(LEGACY_KEY),null);
  assert.deepEqual(local.json(PREFS_KEY),{language:'es'});
});

test('PERSIST-08: storage that throws on access does not stop the app loading',()=>{
  const broken={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');},removeItem(){throw new Error('denied');}};
  assert.deepEqual(readStartup({session:broken,local:broken,now:NOW}),{data:null,prefs:{},recoverySavedAt:null});
  assert.equal(hasWork(null),false);
  assert.equal(hasWork({objects:[{id:'A'}]}),false);
});

test('PERSIST-09: recovery time reads naturally in English and Spanish',()=>{
  assert.equal(savedAgo(NOW-10000,'en',NOW),'just now');
  assert.equal(savedAgo(NOW-10000,'es',NOW),'hace un momento');
  assert.equal(savedAgo(NOW-5*60000,'en',NOW),'5 minutes ago');
  assert.equal(savedAgo(NOW-3*HOUR,'en',NOW),'3 hours ago');
  assert.equal(savedAgo(NOW-3*HOUR,'es',NOW),'hace 3 horas');
});

// The real store, started against fake storage areas.
function loadStore(session,local) {
  const code=buildSync({stdin:{contents:"export {useStore} from './src/store/useStore.js';",resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text;
  const module={exports:{}}, window={};
  vm.runInNewContext(code,{require,module,exports:module.exports,console,process,Date,Intl,window,sessionStorage:session,localStorage:local});
  return {store:module.exports.useStore,window};
}

test('PERSIST-10: a new session starts clean and recovers previous work only when asked',()=>{
  const recent=Date.now()-HOUR;
  const local=memory({[RECOVERY_KEY]:{savedAt:recent,data:{...work,origin:{x:5,y:6},calibrationPoints:[{x:0,y:0},{x:300,y:0}]}},[PREFS_KEY]:{language:'es'}});
  const {store}=loadStore(memory(),local);
  let s=store.getState();
  assert.equal(s.hasRestoredData,false);
  assert.equal(s.objects[0].points.length,0);
  assert.equal(s.pixelsPerMeter,null);
  assert.equal(s.recoverySavedAt,recent);
  assert.equal(s.language,'es');
  store.setState({language:'en'});
  assert.equal(s.recoverPreviousWork(),true);
  s=store.getState();
  assert.equal(s.hasRestoredData,true);
  assert.equal(s.objects[0].points.length,1);
  assert.equal(s.pixelsPerMeter,300);
  assert.equal(s.scaleDistance,1);
  assert.equal(s.axesConfirmed,true);
  assert.equal(s.recoverySavedAt,null);
  assert.equal(s.language,'en','the current language is kept');
  assert.equal(s.viewMode,'tracker');
});

test('PERSIST-11: a refreshed tab restores its own work',()=>{
  const {store}=loadStore(memory({[SESSION_KEY]:work}),memory());
  const s=store.getState();
  assert.equal(s.hasRestoredData,true);
  assert.deepEqual(plain(s.objects[0].points),work.objects[0].points);
  assert.equal(s.recoverySavedAt,null);
});

test('PERSIST-12: Start new experiment clears all copies and autosave keeps working without a reload',()=>{
  const session=memory({[SESSION_KEY]:work}), local=memory({[RECOVERY_KEY]:{savedAt:Date.now(),data:work}});
  const {store,window}=loadStore(session,local);
  store.getState().resetProject();
  assert.equal(window.isResetting,false);
  assert.equal(session.getItem(SESSION_KEY),null);
  assert.equal(local.getItem(RECOVERY_KEY),null);
  store.getState().setUncertaintyPx(9);
  assert.equal(session.json(SESSION_KEY).uncertaintyPx,9);
  assert.equal(store.getState().saveStatus,'saved');
});

test('PERSIST-13: the welcome dialog offers recovery only for a clean session, in English and Spanish',()=>{
  const code=buildSync({stdin:{contents:"export {default as Component} from './src/components/WelcomeDialog.jsx';",resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','lucide-react']}).outputFiles[0].text;
  const hooks={useRef:initial=>({current:initial}),useState:initial=>[initial,()=>{}],useEffect(){}};
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
  const module={exports:{}};
  vm.runInNewContext(code,{require:n=>n==='react'?hooks:n==='react/jsx-runtime'?runtime:require(n),module,exports:module.exports,Date,Intl});
  const all=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(all)];
  const text=node=>all(node).flatMap(n=>[n.props?.children].flat(Infinity).filter(c=>typeof c==='string')).join(' ');
  const savedAt=Date.now()-2*HOUR;
  for(const [language,label] of [['en','Recover previous work'],['es','Recuperar el trabajo anterior']]) {
    let recovered=0;
    const tree=module.exports.Component({language,restored:false,recoverySavedAt:savedAt,onRecover:()=>recovered++,onClose(){},onStartNew(){},onMedia(){},onProject(){}});
    const button=all(tree).find(n=>n.type==='button' && text(n)===label);
    assert.ok(button,`${language} recovery button`);
    button.props.onClick();
    assert.equal(recovered,1);
    assert.match(text(tree),language==='es'?/hace 2 horas/:/2 hours ago/);
    for(const props of [{restored:true,recoverySavedAt:savedAt},{restored:false,recoverySavedAt:null}]) {
      const other=module.exports.Component({language,...props,onRecover(){},onClose(){},onStartNew(){},onMedia(){},onProject(){}});
      assert.ok(!all(other).some(n=>n.type==='button' && text(n)===label));
    }
  }
});
