import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeFigure,fitSample,clonePlot} from '../src/components/graphing/trialFigure.js';
import {themedPreview} from '../src/components/graphing/previewTheme.js';
import {DEFAULT_SETTINGS} from '../src/components/graphing/defaultSettings.js';

test('theme preview preserves publication figure, measurements, fits and uncertainty geometry',()=>{
 const rows=[{x:0,y:1,error:.1,xError:.02},{x:1,y:3,error:.1,xError:.02},{x:2,y:5,error:.1,xError:.02}];
 const figure=makeFigure(rows,fitSample(rows,'linear'),{...DEFAULT_SETTINGS,title:'Test',xLabel:'t',yLabel:'y'},'en','independent');
 const before=JSON.stringify(figure),published=clonePlot(figure);
 const preview=themedPreview(figure,'dark');
 assert.equal(preview.layout.paper_bgcolor,'#192A3E');
 assert.equal(preview.layout.title.font.color,'#E3EDF8');
 assert.equal(preview.layout.xaxis.tickfont.color,'#ACBED1');
 for(let i=0;i<preview.data.length;i++){
  assert.deepEqual(preview.data[i].x,published.data[i].x);
  assert.deepEqual(preview.data[i].y,published.data[i].y);
  assert.equal(preview.data[i].cliponaxis,published.data[i].cliponaxis);
 }
 assert.deepEqual(preview.data[0].error_y.array,published.data[0].error_y.array);
 assert.equal(JSON.stringify(figure),before);
 assert.equal(figure.layout.paper_bgcolor,'#ffffff');
 assert.deepEqual(themedPreview(figure,'light'),published);
});

test('chosen theme text and action pairs meet normal-text contrast',()=>{
 const css=readFileSync(new URL('../src/styles/palette.css',import.meta.url),'utf8');
 const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const [lo,hi]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (hi+.05)/(lo+.05);};
 for(const theme of ['light','dark']){
  const body=css.match(new RegExp('\\[data-theme="'+theme+'"\\]\\{([^}]+)'))[1];
  const tokens=Object.fromEntries([...body.matchAll(/--ui-([\w-]+):(#[\da-f]{6})/gi)].map(m=>[m[1],m[2]]));
  for(const [fg,bg] of [['text','surface'],['muted','surface'],['text','bg'],['muted','soft'],['accent','selected'],['on-accent','accent'],['on-accent','accent-hover'],['text','hover'],['band-text','band']])assert.ok(ratio(tokens[fg],tokens[bg])>=4.5,`${theme}: ${fg}/${bg}`);
 }
});
