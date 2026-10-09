import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import {canvasPNG} from '../src/utils/fileExport.js';

const require=createRequire(import.meta.url);
const code=buildSync({entryPoints:['src/components/ExportActions.jsx'],bundle:true,write:false,
  format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']}).outputFiles[0].text;

// Replay actual export handlers, including blocked synthetic downloads and
// deferred rendering; this is not a Safari/device acceptance test.
function harness(create,{blocked=false,language='en'}={}) {
  const slots=[],cleanups=[],timers=[],revoked=[],downloads=[];
  let index=0,tree,sequence=0;
  const hooks={useState(initial){const at=index++;if(!(at in slots))slots[at]=initial;
    return [slots[at],value=>{slots[at]=value;}];},
    useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useEffect(fn){const at=index++;if(!(at in slots)){slots[at]=true;cleanups.push(fn());}}};
  const module={exports:{}};
  const doc={createElement(){return {click(){downloads.push(this.href);if(blocked)throw Error('Download blocked');},remove(){this.removed=true;}};},body:{appendChild(){}}};
  vm.runInNewContext(code,{require:name=>name==='react'?hooks:require(name),module,exports:module.exports,
    document:doc,URL:{createObjectURL:()=>`blob:file-${++sequence}`,revokeObjectURL:url=>revoked.push(url)},
    setTimeout:(fn,delay)=>{timers.push({fn,delay});}});
  function render(){index=0;tree=module.exports.default({language,actions:[{label:'Export',create}],buttonClass:'button'});}
  function nodes(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
  render();
  return {click(){return tree.props.children[0][0].props.onClick();},render,
    get links(){return nodes(tree).filter(n=>n.type==='a');},get text(){return JSON.stringify(tree);},
    downloads,timers,revoked,unmount(){cleanups.forEach(fn=>fn?.());}};
}

test('CSV download starts within the click and retains visible links when automatic saving is blocked',async()=>{
  const h=harness(()=>({blob:new Blob(['a,b\n1,2'],{type:'text/csv'}),fileName:'motion_data_A.csv'}),{blocked:true});
  const pending=h.click();
  assert.equal(h.downloads.length,1,'synchronous CSV preparation must preserve the user gesture');
  await pending;h.render();
  assert.equal(h.links.length,2);
  assert.equal(h.links[0].props.href,'blob:file-1');
  assert.equal(h.links[0].props.download,'motion_data_A.csv');
  assert.equal(h.links[1].props.target,'_blank');
  assert.deepEqual(h.revoked,[]);
  assert.match(h.text,/File ready/);
});

test('Asynchronous graph rendering exposes preparing state, then persistent PNG fallback links',async()=>{
  let finish;const h=harness(()=>new Promise(resolve=>{finish=resolve;}));
  const pending=h.click();h.render();assert.match(h.text,/Preparing file/);
  assert.equal(h.downloads.length,0);
  finish({blob:new Blob(['png'],{type:'image/png'}),fileName:'scientific_graph_A.png'});
  await pending;h.render();assert.equal(h.links[0].props.download,'scientific_graph_A.png');
  assert.equal(h.downloads.length,1);assert.deepEqual(h.revoked,[]);
});

test('Replacement and unmount defer URL revocation to allow ongoing file navigation',async()=>{
  const h=harness(()=>({blob:new Blob(['csv']),fileName:'data.csv'}));
  await h.click();h.render();await h.click();h.render();
  assert.equal(h.links[0].props.href,'blob:file-2');assert.deepEqual(h.revoked,[]);
  h.unmount();assert.equal(h.timers.length,2);
  h.timers.forEach(({fn,delay})=>{assert.equal(delay,60000);fn();});
  assert.deepEqual(h.revoked,['blob:file-1','blob:file-2']);
});

test('Preparation errors show localized feedback without triggering a download',async()=>{
  for(const language of ['en','es']){
    const h=harness(()=>{throw Error('Decode failed');},{language});
    await h.click();h.render();assert.equal(h.downloads.length,0);assert.equal(h.links.length,0);
    assert.match(h.text,language==='en'?/Could not prepare/:/No se pudo preparar/);
  }
});

test('Canvas encoding succeeds with PNG and rejects null results or synchronous security errors',async()=>{
  const png=new Blob(['image'],{type:'image/png'});
  assert.equal(await canvasPNG({toBlob(callback,type){assert.equal(type,'image/png');callback(png);}}),png);
  await assert.rejects(canvasPNG({toBlob(callback){callback(null);}}),/encoding failed/);
  await assert.rejects(canvasPNG({toBlob(){throw Error('SecurityError');}}),/SecurityError/);
});
