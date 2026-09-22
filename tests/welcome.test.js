import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {runInThisContext} from 'node:vm';

test('GW-13/14: welcome dialog covers an inert workspace, offers media/project entry and handles restoration', async () => {
  const {build}=await import('esbuild');
  const result=await build({stdin:{contents:`
    import React from 'react';
    import {renderToStaticMarkup} from 'react-dom/server';
    import App from './src/App.jsx';
    import FpsDialog from './src/components/FpsDialog.jsx';
    import {useStore} from './src/store/useStore.js';
    const initial={...useStore.getState()};
    export function render(extra={}) {
      useStore.setState({...initial,...extra},true);
      Object.assign(useStore.getInitialState(),useStore.getState());
      return renderToStaticMarkup(<App/>);
    }
    export function renderTiming(props) {return renderToStaticMarkup(<FpsDialog language="en" timing={{status:'unknown',fps:null}} {...props}/>);}
  `,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,write:false,
    format:'cjs',platform:'node',jsx:'automatic',packages:'external',logLevel:'silent'});
  const storage=globalThis.localStorage;
  globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
  try {
    const module={exports:{}};
    runInThisContext(`(function(require,module,exports){${result.outputFiles[0].text}\n})`,{filename:'welcome-render.cjs'})(createRequire(import.meta.url),module,module.exports);
    const {render}=module.exports;
    const {renderTiming}=module.exports;
    const detected=renderTiming({timing:{status:'detected',fps:29.97}});
    assert.match(detected,/30 FPS ✓/);
    assert.doesNotMatch(detected,/type="number"|29.97/);
    assert.match(detected,/Suggested for this video/);
    const saved=renderTiming({timing:{status:'detected',fps:29.97},savedFps:30});
    assert.match(saved,/saved project’s timing/);
    assert.match(saved,/30 FPS ✓/);
    const variable=renderTiming({timing:{status:'variable',fps:29.84}});
    assert.match(variable,/30 FPS ✓/);
    assert.doesNotMatch(variable,/<button disabled=""|requires a constant/);
    assert.doesNotMatch(variable,/type="number"/);
    const unknown=renderTiming({});
    assert.match(unknown,/30 FPS is selected as a default/);
    assert.doesNotMatch(unknown,/<button disabled=""/);
    assert.match(renderTiming({timing:{status:'detected',fps:25}}),/type="number"[^>]*value="25"/);
    const spanish=renderTiming({language:'es',timing:{status:'checking',fps:null}});
    assert.match(spanish,/Leyendo la frecuencia/);
    for(const language of ['en','es']) for(const theme of ['light','dark']) {
      const html=render({language,theme,viewMode:'analysis'});
      assert.match(html,/id="welcome-title"/);
      assert.match(html,language==='en'?/>Open video or image<\//:/>Abrir video o imagen<\//);
      assert.match(html,language==='en'?/>Open saved project<\//:/>Abrir proyecto guardado<\//);
      assert.match(html,/role="dialog" aria-modal="true"/);
      assert.match(html,/<div inert="" aria-hidden="true" class="app-shell/);
      assert.match(html,/video-transport/);
      assert.match(html,/tracking-mode-trigger/);
      assert.doesNotMatch(html,/Explore the workspace/);
      assert.match(html,/aria-hidden="true" class="[^"]*invisible opacity-0/);
    }
    assert.match(render({hasRestoredData:true}),/Your project is loaded/);
    assert.match(render({hasRestoredData:true}),/Locate original media/);
    const video=render({videoSrc:'test.mp4',duration:1,videoDims:{w:100,h:100}});
    assert.doesNotMatch(video,/id="welcome-title"/);
    assert.match(video,/video-transport/);
    assert.match(video,/tracking-mode-trigger/);
    assert.match(video,/id="fps-title"/);
    assert.doesNotMatch(render({videoSrc:'test.mp4',duration:1,fpsConfirmed:true}),/id="fps-title"/);
    const image=render({imageSrc:'test.png',imageObj:null});
    assert.doesNotMatch(image,/tracking-mode-trigger|type="range"|lucide-skip-back/);
    assert.match(image,/Analyze a spectrum/);
    const dragging=render({videoSrc:'test.mp4',dragState:'point'});
    assert.match(dragging,/aria-hidden="false" class="[^"]*opacity-100/);
  } finally {globalThis.localStorage=storage;}
});
