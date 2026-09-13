/* global process, Buffer */
import {spawn} from 'node:child_process';
import {seedTracker,advanceTracker,DEFAULT_TRACKING_OPTIONS,matchTemplate,compareAppearance} from '../src/utils/autotracker.js';
const width=214,height=380,size=11,opts={...DEFAULT_TRACKING_OPTIONS,size};
const proc=spawn('ffmpeg',['-v','error','-ss','12','-i',process.argv[2],'-vf',`scale=${width}:${height}`,'-f','rawvideo','-pix_fmt','rgba','pipe:1']);
let pending=Buffer.alloc(0),index=360,session;
for await(const chunk of proc.stdout){
 pending=Buffer.concat([pending,chunk]);
 while(pending.length>=width*height*4){
  const data=new Uint8ClampedArray(pending.subarray(0,width*height*4));pending=pending.subarray(width*height*4);
  const frame={data,width,height};
  if(!session){session=seedTracker(frame,545.5*width/1080,1381.5*height/1920,opts);console.log({seed:session?.last});}
  else {
   const next=advanceTracker(frame,session,opts);
   if(!next){const {last,previous,template,initial}=session;const cx=last.x+(previous?last.x-previous.x:0),cy=last.y+(previous?last.y-previous.y:0);const m=matchTemplate(frame,template,{x:Math.floor(cx-40-size/2),y:Math.floor(cy-40-size/2),width:80,height:80},size,size);console.log(JSON.stringify({lost:index,time:index/30,last,match:m,adaptive:m&&compareAppearance(frame,template,m.rawX,m.rawY),original:m&&compareAppearance(frame,initial,m.rawX,m.rawY)}));proc.kill();process.exit(0);}
   session=next;
  }
  index++;
 }
}
