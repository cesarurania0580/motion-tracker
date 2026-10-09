// A file is cloned to the worker; its bytes are read in bounded slices, never uploaded.
export function startTimingDetection(file,onResult,createWorker=()=>new Worker(new URL('../workers/videoTiming.worker.js',import.meta.url),{type:'module'}),timeoutMs=15000) {
  let worker, timer, done=false;
  const cancel=()=>{done=true;clearTimeout(timer);worker?.terminate();};
  const finish=result=>{if(done)return;cancel();onResult(result);};
  try {
    worker=createWorker();
    worker.onmessage=e=>finish(e.data);
    worker.onerror=()=>finish({status:'unknown',fps:null});
    timer=setTimeout(()=>finish({status:'unknown',fps:null}),timeoutMs);
    worker.postMessage(file);
  } catch {finish({status:'unknown',fps:null});}
  return cancel;
}
