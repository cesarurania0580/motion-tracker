import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaFitZoom, nextMediaZoom} from '../src/utils/mediaFit.js';

test('4K video can zoom in and return exactly to initial fit below 50%',()=>{
  const fit=mediaFitZoom(3840,2160,800,500);
  assert(fit<.5);
  const enlarged=nextMediaZoom(fit,'in',fit);
  assert(enlarged>fit);
  assert.equal(nextMediaZoom(enlarged,'out',fit),fit);
  let zoom=4;
  for(let i=0;i<50;i++)zoom=nextMediaZoom(zoom,'out',fit);
  assert.equal(zoom,fit);
});
test('Zoom Out never increases zoom when the viewport grows',()=>{
  const fit=mediaFitZoom(1920,1080,1600,1000);
  assert.equal(nextMediaZoom(.25,'out',fit),.25);
  assert.equal(nextMediaZoom(.25,'fit',fit),fit);
});
test('Fit uses the current viewport for portrait images and resized video',()=>{
  for(const [w,h,vw,vh] of [[2160,3840,800,500],[3840,2160,500,800]]){
    const fit=mediaFitZoom(w,h,vw,vh);
    assert.equal(nextMediaZoom(2,'fit',fit),fit);
    assert(w*fit<=vw && h*fit<=vh);
  }
});
test('Invalid fit preserves view and enlargement remains capped',()=>{
  assert.equal(nextMediaZoom(.2,'fit',null),.2);
  assert.equal(nextMediaZoom(.2,'out',null),.2);
  assert.equal(nextMediaZoom(3.9,'in',.2),4);
  assert.equal(nextMediaZoom(4,'in',.2),4);
});

test('Canvas zoom handler resets scrolling only for a valid Fit action',async()=>{
  const {readFileSync}=await import('node:fs');
  const {runInNewContext}=await import('node:vm');
  const source=readFileSync(new URL('../src/components/VideoCanvas.jsx',import.meta.url),'utf8');
  const handler=source.slice(source.indexOf('  const changeZoom ='),source.indexOf('  const handleVideoEnded ='));
  const viewport={clientWidth:800,clientHeight:500,scrollLeft:300,scrollTop:200};
  let zoom=2;
  const context={scrollContainerRef:{current:viewport},videoDims:{w:3840,h:2160},mediaFitZoom,nextMediaZoom,
    setZoom:fn=>{zoom=fn(zoom);}};
  runInNewContext(handler+'\nglobalThis.change=changeZoom;',context);
  context.change('out');assert.equal(viewport.scrollLeft,300);
  context.change('fit');
  assert.equal(zoom,mediaFitZoom(3840,2160,800,500));
  assert.equal(viewport.scrollLeft,0);assert.equal(viewport.scrollTop,0);
  viewport.clientWidth=0;viewport.scrollLeft=100;
  const before=zoom;context.change('fit');
  assert.equal(zoom,before);assert.equal(viewport.scrollLeft,100);
});
