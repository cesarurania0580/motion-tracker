import test from 'node:test';
import assert from 'node:assert/strict';
import {seekVideo} from '../src/utils/videoSeek.js';
class Video extends EventTarget {
  seeking=false; currentTime=0;
}
test('AT-03: seek resolves only for requested decoded frame',async()=>{
  const video=new Video(),controller=new AbortController();let done=false;
  const pending=seekVideo(video,.5,controller.signal).then(()=>{done=true;});
  video.currentTime=.2;video.dispatchEvent(new Event('seeked'));await Promise.resolve();assert.equal(done,false);
  video.currentTime=.5;video.dispatchEvent(new Event('seeked'));await pending;assert.equal(done,true);
});
test('AT-06: cancellation rejects and late completion has no effect',async()=>{
  const video=new Video(),controller=new AbortController();
  const pending=seekVideo(video,.5,controller.signal);controller.abort();
  await assert.rejects(pending,{name:'AbortError'});
  video.dispatchEvent(new Event('seeked'));
});
test('AT-06: failed or stalled decoding terminates',async()=>{
  const video=new Video(),controller=new AbortController();
  const pending=seekVideo(video,.5,controller.signal);video.dispatchEvent(new Event('error'));
  await assert.rejects(pending,/decode failed/);
  await assert.rejects(seekVideo(video,.6,controller.signal,5),/timed out/);
});
