import mediaInfoFactory from 'mediainfo.js';
import wasmUrl from 'mediainfo.js/MediaInfoModule.wasm?url';
import {readVideoTiming} from '../utils/videoTiming';

self.onmessage=async ({data:file})=>{
  let info;
  try {
    info=await mediaInfoFactory({format:'object',locateFile:()=>wasmUrl});
    let bytesRead=0;
    const result=await info.analyzeData(file.size,async(size,offset)=>{
      bytesRead+=Math.min(size,file.size-offset);
      if(bytesRead>32*1024*1024)throw new Error('Metadata read budget exceeded');
      return new Uint8Array(await file.slice(offset,offset+size).arrayBuffer());
    });
    self.postMessage(readVideoTiming(result));
  } catch {self.postMessage({status:'unknown',fps:null});}
  finally {info?.close();}
};
