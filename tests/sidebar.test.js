import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {runInThisContext} from 'node:vm';
import assert from 'node:assert/strict';
import {SIDEBAR_TEXT} from '../src/utils/sidebarText.js';

test('SIDE-04/13: focused navigation preserves data, settings and undo; cancels hidden spectral placement',async()=>{
  const storage=globalThis.localStorage;
  const writes=[];
  globalThis.localStorage={getItem:()=>null,setItem:(_,value)=>writes.push(JSON.parse(value))};
  const {useStore}=await import('../src/store/useStore.js');
  const before=useStore.getState();
  try {
    useStore.setState({sidebarTab:'controls',sidebarViews:{controls:'root',tools:'root'},lineProfile:{spread:5},isTracking:true});
    const s=useStore.getState();
    s.navigateSidebar('controls','automatic');
    useStore.setState({autoFineOpen:true});
    s.navigateSidebar('tools','spectroscopy');
    useStore.setState({activeClickTarget:'spectrum_p2',spectralLineStart:{x:10,y:20}});
    s.navigateSidebar('tools','root');
    assert.equal(useStore.getState().activeClickTarget,null);
    assert.equal(useStore.getState().spectralLineStart,null);
    s.navigateSidebar('controls');
    const next=useStore.getState();
    assert.equal(next.sidebarViews.controls,'automatic');
    for(const key of ['objects','pointEditHistory','pixelsPerMeter','lineProfile','isTracking'])assert.equal(next[key],s[key]);
    assert.equal(next.autoFineOpen,true);
    assert.ok(writes.length);
    assert.ok(writes.every(value=>!('sidebarViews' in value) && !('sidebarTab' in value) && !('autoFineOpen' in value)));
    s.navigateSidebar('invalid','root');
    assert.equal(useStore.getState().sidebarTab,'controls');
    s.navigateSidebar('tools','fine');
    assert.equal(useStore.getState().sidebarTab,'controls');
  } finally {useStore.setState(before,true);globalThis.localStorage=storage;}
});

test('SIDE-15: navigation labels have English and Spanish parity',()=>{
  assert.deepEqual(Object.keys(SIDEBAR_TEXT.en),Object.keys(SIDEBAR_TEXT.es));
  for(const text of Object.values(SIDEBAR_TEXT.es))assert.ok(text.length);
});

test('SIDE-02/07/09/14: rendered views are exclusive and running Pause is available exactly once',async()=>{
  const {build}=await import('esbuild');
  const result=await build({stdin:{contents:`
    import React from 'react';
    import {renderToStaticMarkup} from 'react-dom/server';
    import Sidebar from './src/components/Sidebar.jsx';
    import {useStore} from './src/store/useStore.js';
    import {DETAIL_OPTIONS} from './src/utils/detailTracker.js';
    export function render(tab,view,status='ready',extra={}) {
      useStore.setState({sidebarTab:tab,sidebarViews:{controls:tab==='controls'?view:'automatic',tools:tab==='tools'?view:'root'},language:'en',saveStatus:'saved',videoSrc:null,fpsConfirmed:false,autoFineOpen:false,...extra});
      Object.assign(useStore.getInitialState(),useStore.getState());
      return renderToStaticMarkup(<Sidebar autotracking={{enabled:true,status,options:DETAIL_OPTIONS}} pointReview={{}} positionData={[]} uncertaintyMeters={0} points={[]}/>);
    }
  `,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',packages:'external',logLevel:'silent'});
  const storage=globalThis.localStorage;
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  try {
    const module={exports:{}};
    runInThisContext(`(function(require,module,exports){${result.outputFiles[0].text}\n})`,{filename:'sidebar-render.cjs'})(createRequire(import.meta.url),module,module.exports);
    const {render}=module.exports;
    const root=render('tools','root');
    assert.match(root,/Overlay Tools/);
    assert.match(root,/Spectroscopy/);
    assert.match(root,/id="sidebar-overlays-trigger"[^>]*aria-expanded="false"/);
    assert.match(root,/id="sidebar-spectroscopy-trigger"[^>]*aria-expanded="false"/);
    assert.ok((root.match(/inert=""/g)||[]).length>=2);
    assert.doesNotMatch(root,/<table|Back to Tools/);
    const overlays=render('tools','overlays');
    assert.match(overlays,/type="checkbox"/);
    assert.match(overlays,/Spectroscopy/);
    assert.match(overlays,/id="sidebar-overlays-trigger"[^>]*aria-expanded="true"/);
    assert.match(overlays,/id="sidebar-spectroscopy-content"[^>]*aria-hidden="true"[^>]*inert/);
    const spectrum=render('tools','spectroscopy');
    assert.ok(spectrum.indexOf('id="spectrum-calibrate-trigger"')<spectrum.indexOf('id="spectrum-sample-trigger"'));
    assert.doesNotMatch(spectrum,/Replace sampling line|Remove sampling line|Next:|id="spectrum-channel"/);
    const locating=render('tools','spectroscopy','ready',{spectrumStep:'calibrate',activeClickTarget:'r1',wavelengthCalibration:{coordinateMode:'image',p1_wl:656.3}});
    assert.match(locating,/Click the spectral line corresponding to 656.3 nm/);
    assert.match(locating,/Locating Reference 1/);

    assert.match(spectrum,/Overlay Tools/);
    assert.match(spectrum,/id="sidebar-spectroscopy-trigger"[^>]*aria-expanded="true"/);
    assert.match(spectrum,/id="sidebar-overlays-content"[^>]*aria-hidden="true"[^>]*inert/);
    for(const current of ['sample','calibrate','explore']) {
      const markup=render('tools','spectroscopy','ready',{spectrumStep:current});
      for(const key of ['sample','calibrate','explore']) {
        assert.match(markup,new RegExp(`id="spectrum-${key}-trigger" aria-expanded="${key===current}"`));
        if(key!==current)assert.match(markup,new RegExp(`id="spectrum-${key}-body"[^>]*aria-hidden="true"[^>]*inert`));
      }
    }
    const pixelFlow=render('tools','spectroscopy','ready',{spectrumStep:'explore',spectrumUsePixels:true,
      lineProfile:{p1:{x:0,y:0},p2:{x:20,y:0},spread:5,channel:'luma'},spectralData:[{intensity:1},{intensity:2}],wavelengthCalibration:null,spectralError:false});
    assert.match(pixelFlow,/Uncalibrated · Position \(px\)/);
    assert.doesNotMatch(pixelFlow,/<button[^>]* disabled=""[^>]*>View spectrum<\/button>/);
    const fine=render('controls','automatic','ready',{autoFineOpen:true});
    assert.match(fine,/Restore defaults/);
    assert.match(fine,/Start tracking/);
    assert.match(fine,/Template diameter/);
    assert.match(fine,/aria-expanded="true"/);
    const compact=render('controls','automatic');
    assert.match(compact,/aria-hidden="true" inert=""/);
    assert.doesNotMatch(compact,/Area used to recognize|How far to search|Tracking settings and target preview/);
    assert.match(compact,/21 px/);
    assert.match(compact,/One frame/);
    const measurement=render('controls','measurement');
    assert.match(measurement,/Measurement settings/);
    assert.doesNotMatch(measurement,/>Run<|Restore defaults|<table/);
    const data=render('data','root');
    assert.match(data,/<table/);
    assert.doesNotMatch(data,/<details|Data actions/);
    assert.match(data,/Clear/);
    assert.doesNotMatch(measurement,/Confirm FPS/);
    const video=render('controls','measurement','ready',{videoSrc:'test.mp4'});
    assert.match(video,/Confirm FPS/);
    assert.match(video,/sidebar-fps-help/);
    const confirmed=render('controls','measurement','ready',{videoSrc:'test.mp4',fpsConfirmed:true});
    assert.doesNotMatch(confirmed,/Confirm FPS|sidebar-fps-help/);
    assert.match(confirmed,/FPS confirmed/);
    assert.doesNotMatch(data,/Restore defaults|Measurement settings/);
    for(const [tab,view] of [['controls','automatic'],['controls','measurement'],['tools','root'],['data','root']]) {
      const running=render(tab,view,'running');
      assert.equal((running.match(/>Pause<\/button>/g)||[]).length,1,`${tab}/${view}`);
      assert.equal((running.match(/overflow-auto/g)||[]).length,1);
    }
  } finally {globalThis.localStorage=storage;}
});


test('SIDE-16: new video opens settings unconfirmed; confirmation and tab choice survive ordinary updates',async()=>{
  const storage=globalThis.localStorage;
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  const {useStore}=await import('../src/store/useStore.js');
  const before=useStore.getState();
  try {
    const s=useStore.getState();
    s.navigateSidebar('tools','overlays');
    s.setVideoSrc('new-video');
    assert.equal(useStore.getState().sidebarTab,'controls');
    assert.equal(useStore.getState().sidebarViews.controls,'measurement');
    assert.equal(useStore.getState().fpsConfirmed,false);
    s.setFpsConfirmed(true);
    s.navigateSidebar('data');
    s.setCurrentTime(1);
    s.setVideoSrc('new-video');
    assert.equal(useStore.getState().sidebarTab,'data');
    assert.equal(useStore.getState().fpsConfirmed,true);
    s.setFps(60);
    assert.equal(useStore.getState().fpsConfirmed,false);
    s.setFpsConfirmed(true);
    s.setVideoSrc('another-video');
    assert.equal(useStore.getState().fpsConfirmed,false);
    assert.equal(useStore.getState().sidebarTab,'controls');
    s.navigateSidebar('tools','spectroscopy');
    s.setVideoSrc(null);
    s.setImageSrc('still-image');
    assert.equal(useStore.getState().sidebarTab,'tools');
  } finally {useStore.setState(before,true);globalThis.localStorage=storage;}
});
