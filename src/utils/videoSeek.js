// Seek completion is asynchronous. Cancellation removes every pending listener.
export function seekVideo(video, time, signal, timeoutMs = 5000) {
  return new Promise((resolve,reject)=>{
    let timer;
    const cleanup=()=>{
      clearTimeout(timer);
      video.removeEventListener('seeked',done);
      video.removeEventListener('error',failed);
      signal.removeEventListener('abort',aborted);
    };
    const fail=(error)=>{cleanup();reject(error);};
    const aborted=()=>fail(new DOMException('Cancelled','AbortError'));
    const failed=()=>fail(new Error('Video decode failed'));
    const done=()=>{
      if(video.seeking || Math.abs(video.currentTime-time)>0.001)return;
      cleanup();resolve();
    };
    if(signal.aborted){aborted();return;}
    video.addEventListener('seeked',done);
    video.addEventListener('error',failed);
    signal.addEventListener('abort',aborted,{once:true});
    timer=setTimeout(()=>fail(new Error('Video seek timed out')),timeoutMs);
    try {video.currentTime=time;} catch(error){fail(error);}
  });
}
