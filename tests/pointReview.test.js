import test from 'node:test';
import assert from 'node:assert/strict';
import {TRANSLATIONS} from '../src/utils/translations.js';

function reviewTest(name,run) {
  test(name,async()=>{
    const storage=globalThis.localStorage;
    const writes=[];
    globalThis.localStorage={getItem:()=>null,removeItem:()=>{},setItem:(_,value)=>writes.push(JSON.parse(value))};
    const {useStore}=await import('../src/store/useStore.js');
    const previous=useStore.getState();
    try {
      useStore.setState({objects:[
        {id:'A',mass:2,points:[{id:0,time:2,x:20,y:40},{id:0,time:1,x:10,y:30},{time:3,x:30,y:50}]},
        {id:'B',mass:3,points:[{id:0,time:1,x:100,y:200}]}
      ],activeObjId:'A',pointEditHistory:{},pixelsPerMeter:100,origin:{x:1,y:2},originAngle:.4});
      await run(useStore,writes);
    } finally {useStore.setState(previous,true);globalThis.localStorage=storage;}
  });
}

reviewTest('REC-02/03: correction and deletion target exact legacy point, undo restores both',store=>{
  const initial=store.getState(), a=initial.objects[0], b=initial.objects[1];
  assert.equal(initial.editPoint('A',1,a.points[1],{x:55,y:65}),true);
  let s=store.getState();
  assert.deepEqual(s.objects[0].points[1],{id:0,time:1,x:55,y:65});
  assert.equal(s.objects[0].points[0],a.points[0]);
  assert.equal(s.objects[1],b);
  assert.equal(s.origin,initial.origin);
  assert.equal(s.pixelsPerMeter,100);
  assert.equal(s.originAngle,.4);
  assert.equal(s.editPoint('A',0,a.points[0],null),true);
  s=store.getState();assert.equal(s.objects[0].points.length,2);
  assert.equal(s.undoPointEdit(),true);
  assert.equal(store.getState().objects[0].points[1].x,55);
  assert.equal(store.getState().undoPointEdit(),true);
  assert.equal(store.getState().objects[0].points,a.points);
  assert.equal(store.getState().undoPointEdit(),false);
});

reviewTest('REC-03: histories are per object and mass edits survive undo',store=>{
  const s=store.getState();
  s.editPoint('A',0,s.objects[0].points[0],null);
  s.setActiveObjId('B');
  assert.equal(store.getState().undoPointEdit(),false);
  s.editPoint('B',0,store.getState().objects[1].points[0],{x:33,y:44});
  s.setObjects(objects=>objects.map(obj=>({...obj,mass:10})));
  s.undoPointEdit();
  assert.equal(store.getState().objects[1].points[0].x,100);
  s.setActiveObjId('A');s.undoPointEdit();
  assert.equal(store.getState().objects[0].points.length,3);
  assert.equal(store.getState().objects[0].mass,10);
  assert.equal(store.getState().objects[1].mass,10);
});

reviewTest('REC-03/04: stale selections, COM and invalid coordinates cannot edit points',store=>{
  const s=store.getState(), point=s.objects[0].points[0];
  assert.equal(s.editPoint('A',-1,undefined,null),false);
  assert.equal(s.editPoint('A',0,point,{x:NaN,y:0}),false);
  s.setActiveObjId('COM');
  assert.equal(s.editPoint('A',0,point,null),false);
  assert.equal(s.editPoint('COM',0,point,null),false);
  s.setActiveObjId('A');
  s.editPoint('A',0,point,{x:1,y:2});
  assert.equal(s.editPoint('A',0,point,null),false);
  s.setPoints(points=>[...points,{id:99,x:9,y:9,time:4}]);
  assert.equal(s.undoPointEdit(),false);
  assert.equal(store.getState().objects[0].points.length,4);
});

reviewTest('REC-03/06: replacement clears history and autosave omits review history', (store,writes)=>{
  const s=store.getState();
  s.editPoint('A',0,s.objects[0].points[0],null);
  assert.equal('pointEditHistory' in writes.at(-1),false);
  s.setVideoSrc('blob:new');
  assert.equal(s.undoPointEdit(),false);
  s.editPoint('A',0,store.getState().objects[0].points[0],null);
  s.setImageSrc('blob:image');assert.equal(s.undoPointEdit(),false);
  s.editPoint('A',0,store.getState().objects[0].points[0],null);
  s.setObjects([{id:'A',mass:1,points:[]},{id:'B',mass:1,points:[]}]);
  assert.equal(s.undoPointEdit(),false);
});

reviewTest('REC-03: edit history is bounded and reset cannot restore old measurements',store=>{
  for(let i=0;i<55;i++) {
    const s=store.getState();s.editPoint('A',0,s.objects[0].points[0],{x:i,y:i});
  }
  assert.equal(store.getState().pointEditHistory.A.length,50);
  store.getState().resetProject();
  assert.deepEqual(store.getState().pointEditHistory,{});
  assert.equal(store.getState().undoPointEdit(),false);
});

test('REC-06: review actions and instructions have matching EN/ES keys',()=>{
  assert.deepEqual(Object.keys(TRANSLATIONS.en.review).sort(),Object.keys(TRANSLATIONS.es.review).sort());
});
