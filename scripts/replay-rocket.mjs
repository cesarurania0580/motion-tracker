/* global process, Buffer */
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {DETAIL_OPTIONS,seedDetailed,advanceDetailed,trackingRegion,predictTarget} from '../src/utils/detailTracker.js';
const video=process.argv[2],output=process.argv[3] ?? '/tmp/rocket-replay.json';
if(!video)throw new Error('Usage: node scripts/replay-rocket.mjs VIDEO [OUTPUT] [OPTIONS_JSON] [SETUP_JSON]');
const options={...DETAIL_OPTIONS,...JSON.parse(process.argv[4] ?? '{}')};
// Decode a fixed strip containing this benchmark's trajectory, then apply exactly
// the same moving native-pixel ROI as browser capture. No ground truth feeds matching.
const setup={start:12,x:545.5,y:1381.5,originX:400,width:300,...JSON.parse(process.argv[5] ?? '{}')};
const {width,originX}=setup,height=1920,bytes=width*height*4;
const proc=spawn('ffmpeg',['-v','error','-ss',String(setup.start),'-i',video,'-vf',`crop=${width}:1920:${originX}:0`,'-f','rawvideo','-pix_fmt','rgba','pipe:1']);
const completion=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',(code,signal)=>resolve({code,signal}));});
let decodeErrors='';
proc.stderr.on('data',data=>{decodeErrors+=data.toString();});
let pending=Buffer.alloc(0),index=Math.floor(setup.start*30),session,finished=false;
const rows=[];
function roi(data,center){
 const region=trackingRegion(1080,1920,center,options);
 if(region.x<originX || region.x+region.width>originX+width)throw new Error('Decode strip too narrow');
 const pixels=new Uint8ClampedArray(region.width*region.height*4);
 for(let j=0;j<region.height;j++){
  const start=((region.y+j)*width+region.x-originX)*4;
  pixels.set(data.subarray(start,start+region.width*4),j*region.width*4);
 }
 return {width:region.width,height:region.height,data:pixels,originX:region.x,originY:region.y};
}
for await(const chunk of proc.stdout){
 pending=Buffer.concat([pending,chunk]);
 while(pending.length>=bytes){
  const data=pending.subarray(0,bytes);pending=pending.subarray(bytes);
  const start=performance.now();
  let result;
  if(!session){session=seedDetailed(roi(data,{x:setup.x,y:setup.y}),setup.x,setup.y,options);if(!session)throw new Error('Invalid seed');}
  else {result=advanceDetailed(roi(data,predictTarget(session,options)),session,options);session=result.session;}
  rows.push({frame:index,time:setup.start+(index-Math.floor(setup.start*30))/30,...session?.last,confidence:session?.confidence,reason:result?.reason,ms:performance.now()-start,match:result?.session?undefined:result?.match});
  if(!session){finished=true;break;}
  index++;
 }
 if(finished){proc.kill();break;}
}
const termination=await completion;
if(!finished && termination.code!==0)throw new Error(decodeErrors);
if(!rows.length)throw new Error('No video frames decoded');
fs.writeFileSync(output,JSON.stringify({video,options,setup,rows},null,2));
const timings=rows.map(r=>r.ms).sort((a,b)=>a-b);
console.log(JSON.stringify({frames:rows.length,last:rows.at(-1),medianMs:timings[Math.floor(timings.length/2)],output}));

if(process.argv.includes('--verify')) {
  // Continuity/exit checks for the documented default rocket benchmark, not a
  // substitute for independent Tracker coordinates or per-frame ground truth.
  const accepted=rows.filter(r=>Number.isFinite(r.x));
  assert.ok(accepted.at(-1).frame>=885,'Tracking stopped before the upper edge');
  assert.ok(rows.at(-1).frame<=895 && rows.at(-1).reason,'Tracker failed to stop at feature exit');
  for(const row of accepted)assert.ok(Math.abs(row.x-545.5)<10,'Target left the observed rocket column');
  for(let i=1;i<accepted.length;i++)assert.ok(Math.hypot(accepted[i].x-accepted[i-1].x,accepted[i].y-accepted[i-1].y)<10,'Discontinuous target jump');
  console.log('Rocket continuity, trajectory-column and exit checks passed. Visual accuracy still requires review.');
}
