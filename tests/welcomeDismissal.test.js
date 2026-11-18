import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';

const require=createRequire(import.meta.url);
const bundles={};
for(const [name,source] of Object.entries({
  fillDialog:"export {FillDialog as Component} from './src/components/graphing/EditableTable.jsx';",
  editable:"export {default as Component} from './src/components/graphing/EditableTable.jsx';",
  minimal:"export {default as Component} from './src/components/graphing/prototype/MinimalBench.jsx';",
  worksheet:"export {default as Component} from './src/components/graphing/Worksheet.jsx';",
  independent:"export {default as Component} from './src/components/graphing/StandaloneGraphing.jsx';",
  app:"export {default as Component} from './src/App.jsx'; export {useStore} from './src/store/useStore.js';",
  legacy:"export {default as Component} from './src/components/AnalysisPanel.jsx'; export {useStore} from './src/store/useStore.js';",
  graph:"export {default as Component} from './src/components/graphing/GraphWorkspace.jsx';",
  panel:"export {default as Component} from './src/components/graphing/GraphingPanel.jsx'; export {useStore} from './src/store/useStore.js';",
  retained:"export {RetainedPane as Component} from './src/components/graphing/GraphingPanel.jsx';",
  dialog:"export {default as Component} from './src/components/WelcomeDialog.jsx';"
}))bundles[name]=buildSync({stdin:{contents:source,resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,loader:{'.css':'empty','.ttf':'empty'},
  platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',external:['react','react/jsx-runtime','react-dom','recharts','lucide-react','plotly.js-basic-dist-min','jspdf','svg2pdf.js']}).outputFiles[0].text;

// Render real component event handlers without a browser or DOM. Descendant
// components remain element objects; this tests App modal gating and callbacks.
function harness(name,props={},saved=null) {
  const slots=[];let index=0,tree;
  const hooks={...require('react'),
    useState(initial){const at=index++;if(!(at in slots))slots[at]=typeof initial==='function'?initial():initial;
      return [slots[at],v=>{slots[at]=typeof v==='function'?v(slots[at]):v;}];},
    useRef(initial){const at=index++;return slots[at]??={current:initial};},
    useMemo:fn=>fn(),useCallback:fn=>fn,useEffect(){},useLayoutEffect(){},useDebugValue(){},
    useSyncExternalStore:(_subscribe,get)=>get(),
    createContext:()=>({}),forwardRef:fn=>fn,memo:fn=>fn,createElement:(type,props)=>({type,props})
  };
  const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
  class FileReader {readAsText(){}}
  const module={exports:{}};
  vm.runInNewContext(bundles[name],{require:name=>name==='react'?hooks:name==='react/jsx-runtime'?runtime:require(name),
    module,exports:module.exports,console,FileReader,Blob,setTimeout,clearTimeout,
    localStorage:{getItem:()=>saved===null?null:JSON.stringify(saved),setItem(){}},window:{confirm:()=>true},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}});
  function render(){index=0;tree=module.exports.Component(props);}
  function all(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children,node.props?.worksheetControls,node.props?.axisControls].flat(Infinity).flatMap(all)];}
  render();
  return {render,store:module.exports.useStore,get nodes(){return all(tree);},get tree(){return tree;}};
}

test('Welcome close button and Escape dismiss in EN/ES; Escape from replacement confirmation keeps restored work',()=>{
  for(const language of ['en','es']){
    let closed=0,reset=0;
    const h=harness('dialog',{language,dark:true,restored:true,onClose:()=>closed++,onStartNew:()=>reset++});
    const close=h.nodes.find(n=>n.type==='button'&&n.props['aria-label']);
    assert.equal(close.props['aria-label'],language==='en'?'Close welcome window':'Cerrar ventana de bienvenida');
    assert.match(close.props.className,/min-h-11 min-w-11/);
    close.props.onClick();assert.equal(closed,1);
    const section=()=>h.nodes.find(n=>n.props.role==='dialog');
    section().props.onKeyDown({key:'Escape',preventDefault(){}});assert.equal(closed,2);
    h.nodes.find(n=>n.type==='button'&&n.props.children===(language==='en'?'Start a new experiment':'Iniciar un nuevo experimento')).props.onClick();
    h.render();section().props.onKeyDown({key:'Escape',preventDefault(){}});h.render();
    assert.equal(closed,2);assert.equal(reset,0);
  }
});

test('Closing the real App welcome releases the workspace, preserves measurements and permits reopening setup',()=>{
  const h=harness('app');
  const shell=()=>h.nodes.find(n=>n.props.className?.startsWith('app-shell'));
  const welcome=()=>h.nodes.find(n=>typeof n.props.onClose==='function'&&'onStartNew' in n.props);
  assert.equal(shell().props.inert,true);
  h.store.setState({hasRestoredData:true,objects:[{id:'A',mass:1,points:[{id:'p1',x:12,y:34,time:0}]}]});
  h.render();
  const before=JSON.stringify(h.store.getState().objects);
  welcome().props.onClose();h.render();
  assert.equal(welcome(),undefined);assert.equal(shell().props.inert,false);
  assert.equal(shell().props['aria-hidden'],undefined);
  assert.equal(JSON.stringify(h.store.getState().objects),before);
  assert.equal(h.store.getState().hasRestoredData,true);
  h.render();assert.equal(welcome(),undefined,'ordinary renders must not reopen the dismissed dialog');
  const header=h.nodes.find(n=>typeof n.props.loadProject==='function');
  header.props.loadProject({target:{files:[]}});h.render();assert.equal(welcome(),undefined);
  header.props.loadProject({target:{files:[{}]}});h.render();assert.ok(welcome(),'selecting a project reopens setup');
  welcome().props.onClose();
  h.store.setState({videoSrc:'blob:loading',duration:0,fpsConfirmed:false});h.render();
  assert.equal(shell().props.inert,false,'dismissing loading must not immediately open FPS confirmation');
  h.store.setState({duration:1});h.render();assert.equal(shell().props.inert,true);
  assert.ok(h.nodes.find(n=>typeof n.props.onConfirm==='function'),'ready video still requires FPS confirmation');
});


test('GF-07: welcome opens in-app graphing without media or replacing measurements',()=>{
 const h=harness('app');
 const objects=h.store.getState().objects;
 const welcome=h.nodes.find(n=>typeof n.props?.onGraphing==='function');
 welcome.props.onGraphing();h.render();
 assert.equal(h.store.getState().viewMode,'analysis');
 assert.equal(h.store.getState().objects,objects);
 assert.ok(!h.nodes.some(n=>typeof n.props?.onGraphing==='function'));
});

test('GF-08: visited graph pane retains the same child while hidden; unused pane stays unmounted',()=>{
 const child={type:'worksheet',props:{draft:'unsaved'}};
 const props={active:false,children:child},h=harness('retained',props);
 assert.equal(h.tree.props.children,false);
 props.active=true;h.render();assert.equal(h.tree.props.children,child);
 props.active=false;h.render();assert.equal(h.tree.props.hidden,true);
 assert.equal(h.tree.props.children,child);
 props.active=true;h.render();assert.equal(h.tree.props.hidden,false);
 assert.equal(h.tree.props.children,child);
});


test('GF independent top tools open and close settings without resetting the chosen fit',()=>{
 const h=harness('graph',{toolsPosition:'top',sample:'independent',language:'en',rows:[],initialModel:'none',labels:{x:'X',y:'Y'},title:'Test',unitsForFit:()=>({}),onBusy(){}});
 assert.ok(!h.nodes.some(n=>n.props.role==='tabpanel'));
 const open=key=>{h.nodes.find(n=>n.props.id===`trial-tab-${key}`).props.onClick();h.render();};
 open('fit');
 h.nodes.find(n=>n.type==='select'&&n.props.value==='none').props.onChange({target:{value:'linear'}});h.render();
 h.nodes.find(n=>n.type==='button'&&n.props.className?.includes('tools-close')).props.onClick();h.render();
 assert.ok(!h.nodes.some(n=>n.props.role==='tabpanel'));
 open('fit');assert.ok(h.nodes.some(n=>n.type==='select'&&n.props.value==='linear'));
 for(const key of ['appearance','export','data']){open(key);assert.ok(h.nodes.some(n=>n.props.role==='tabpanel'&&n.props['aria-labelledby']===`trial-tab-${key}`));}
});


test('GF media source restores familiar analysis controls and both export actions',()=>{
 const h=harness('legacy',{chartData:[],points:[],fitEquation:null,xScale:{},yScale:{},activeObjectColor:'#ef4444',downloadCSV:()=>({})});
 h.store.setState({viewMode:'analysis'});h.render();
 assert.ok(h.nodes.some(n=>n.props.className?.includes('analysis-workspace')));
 assert.ok(h.nodes.some(n=>n.props.actions?.length===2&&n.props.actions.every(a=>typeof a.create==='function')));
 assert.ok(!h.nodes.some(n=>n.props['aria-label']==='Graphing engine'));
});


test('graphing stays light while the global Tracker theme remains dark',()=>{
 const h=harness('panel',{});
 h.store.setState({theme:'dark',viewMode:'analysis'});h.render();
 assert.equal(h.tree.props['data-theme'],'light');
 assert.equal(h.store.getState().theme,'dark');
 const legacy=harness('legacy',{chartData:[],points:[],fitEquation:null,xScale:{},yScale:{},activeObjectColor:'#ef4444',downloadCSV:()=>({})});
 legacy.store.setState({theme:'dark',viewMode:'analysis'});legacy.render();
 assert.equal(legacy.tree.props['data-theme'],'light');
 assert.equal(legacy.store.getState().theme,'dark');
});

test('MU: actual App budget changes error bars but preserves measured coordinates and velocities',()=>{
 const h=harness('app');
 const objects=[{id:'A',mass:1,color:'#ff0000',points:[{time:0,x:0,y:0},{time:1,x:500,y:1000},{time:2,x:1000,y:2000}]}];
 h.store.setState({objects,activeObjId:'A',pixelsPerMeter:500,calibrationPoints:[{x:0,y:0},{x:500,y:0}],origin:{x:0,y:0},originAngle:0,uncertaintyPx:2,plotY:'vx',plotX:'time'});h.render();
 const graph=()=>h.nodes.find(n=>n.props.chartData);
 const sidebar=()=>h.nodes.find(n=>n.props.positionData);
 const original=graph().props.chartData.map(p=>[p.time,p.vx,p.vy]);
 assert.deepEqual(JSON.parse(JSON.stringify(original)),[[0,1,-2],[1,1,-2],[2,1,-2]]);
 h.store.getState().setMeasurementBudget({length:'.001',endpoint:'1',time:'0'});h.render();
 assert.deepEqual(graph().props.chartData.map(p=>[p.time,p.vx,p.vy]),original);
 assert.ok(Math.abs(graph().props.chartData[1].vxError-.009)<1e-12);
 assert.ok(Math.abs(sidebar().props.positionData[2].xError-.014)<1e-12);
 assert.equal(h.store.getState().objects,objects);
 const before=h.store.getState().measurementBudget;
 h.store.setState({hasRestoredData:true});h.render();
 const header=h.nodes.find(n=>typeof n.props.handleFileUpload==='function');
 header.props.handleFileUpload({target:{files:[{name:'test.mp4',type:'video/mp4'}],value:'test.mp4'}});
 assert.deepEqual(h.store.getState().measurementBudget,before,'reattaching video keeps restored uncertainty inputs');
});

test('MU: worksheet controls transform and exclude reversibly while saved document retains original rows',async()=>{
 const seed={meta:{title:'Example',xName:'t',yName:'d',xUnit:'s',yUnit:'m'},rows:[{x:'1',y:'2',xError:'0',error:'.1'},{x:'2',y:'3',xError:'0',error:'.1'}]};
 const h=harness('independent',{embedded:true,seed});
 const graph=()=>h.nodes.find(n=>n.props.renderWorksheet);
 const tools=()=>h.nodes.find(n=>n.props.onOperations);
 tools().props.onOperations({x:'square',y:'identity'});h.render();
 assert.equal(graph().props.rows[1].x,4);
 let sheet=graph().props.renderWorksheet({selectedIndex:0,onSelect(){}}).props.children;
 assert.equal(sheet.props.rows[1].x,'2');
 sheet.props.onEdit(1,'reason','Occluded');h.render();sheet=graph().props.renderWorksheet({onSelect(){}}).props.children;
 sheet.props.onEdit(1,'excluded',true);h.render();assert.equal(graph().props.rows.length,1);
 const exports=h.nodes.find(n=>n.props.actions?.[0]?.label==='Save graph document');
 const doc=JSON.parse(await exports.props.actions[0].create().blob.text());
 assert.equal(doc.rows[1].x,'2');assert.equal(doc.rows[1].reason,'Occluded');assert.equal(doc.rows[1].excluded,true);assert.equal(doc.operations.x,'square');
 sheet=graph().props.renderWorksheet({onSelect(){}}).props.children;
 sheet.props.onEdit(1,'excluded',false);tools().props.onOperations({x:'identity',y:'identity'});h.render();assert.equal(graph().props.rows[1].x,2);
});

test('CSV: actual video export imports through independent upload, selectable axes and cancellation',async()=>{
 const app=harness('app');app.store.setState({objects:[{id:'A',mass:1,points:[{time:0,x:0,y:0},{time:1,x:500,y:1000},{time:2,x:1000,y:2000}]}],pixelsPerMeter:500,origin:{x:0,y:0},calibrationPoints:[{x:0,y:0},{x:500,y:0}],uncertaintyPx:2});app.render();
 const csv=await app.nodes.find(n=>n.props.positionData).props.downloadCSV().blob.text();
 const h=harness('independent',{embedded:true,seed:{meta:{title:'Keep',xName:'X',yName:'Y',xUnit:'',yUnit:''},rows:[{x:'99',y:'88',xError:'',error:''}]}});
 const graph=()=>h.nodes.find(n=>n.props.renderWorksheet);
 const upload=()=>h.nodes.find(n=>n.type==='input'&&n.props.accept==='.csv,.tsv,.txt');
 const load=async()=>{await upload().props.onChange({target:{files:[{size:csv.length,text:async()=>csv}],value:'file.csv'}});h.render();};
 await load();assert.equal(graph().props.rows[0].x,99,'mapping must not replace draft yet');
 assert.ok(h.nodes.some(n=>n.props['aria-label']==='CSV Y axis'),'video import offers column mapping');
 h.nodes.find(n=>n.type==='button'&&n.props.children==='Cancel import').props.onClick();h.render();assert.equal(graph().props.rows[0].x,99);
 await load();h.nodes.find(n=>n.props['aria-label']==='CSV Y axis').props.onChange({target:{value:'vy'}});h.render();
 h.nodes.find(n=>n.type==='button'&&n.props.children==='Import selected columns').props.onClick();h.render();
 assert.equal(graph().props.rows.length,3);assert.equal(graph().props.rows[0].y,-2);assert.equal(graph().props.rows[0].error,null);
 assert.equal(graph().props.labels.y,'Vy (m/s)');
 const axis=h.nodes.find(n=>n.props['aria-label']==='Y column');
 assert.ok(axis,'workbench keeps axes available after importing');
 axis.props.onChange({target:{value:'c2'}});h.render();
 assert.equal(graph().props.labels.y,'Y (m)');assert.equal(graph().props.rows[2].y,-4);
 const exported=h.nodes.find(n=>n.props.actions?.[0]?.label==='Save graph document');
 const saved=JSON.parse(await exported.props.actions[0].create().blob.text());
 assert.equal(saved.sheet.columns.length,5);assert.equal(saved.sheet.y,'c2');
 assert.equal(saved.rows[2].c4,'-2','velocity remains available after switching to position');
});

test('Workbench table visibility changes only displayed cells, not sources or graph axes',()=>{
 const rows=[{x:'1',y:'3',xError:'.1',error:'.2'}],axes={x:'x',y:'y'};
 const props={rows,labels:{x:'Time',y:'Distance'},language:'en',compact:true,axes,columns:[{key:'x',label:'Time',errorKey:'xError'},{key:'y',label:'Distance',errorKey:'error'}],hiddenColumns:[],onEdit(){throw Error('visibility must not edit data');},onToggleColumn(key){props.hiddenColumns=props.hiddenColumns.includes(key)?props.hiddenColumns.filter(k=>k!==key):[...props.hiddenColumns,key];}};
 const h=harness('worksheet',props),snapshot=JSON.stringify(rows);
 const toggle=()=>h.nodes.find(n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children.includes('Distance')).props.children[0];
 assert.ok(h.nodes.some(n=>n.props['aria-label']==='Distance · row 1'));
 toggle().props.onChange();h.render();assert.equal(toggle().props.checked,false);
 assert.ok(!h.nodes.some(n=>n.props['aria-label']==='Distance · row 1'));
 assert.equal(JSON.stringify(rows),snapshot);assert.deepEqual(axes,{x:'x',y:'y'});
 toggle().props.onChange();h.render();assert.ok(h.nodes.some(n=>n.props['aria-label']==='Distance · row 1'));
});

test('Workbench toolbar sits outside data pane; hidden columns survive axis changes; standalone link removed',()=>{
 const h=harness('independent',{embedded:true});
 const graph=()=>h.nodes.find(n=>n.props.renderWorksheet);
 const sheet=()=>graph().props.renderWorksheet({onSelect(){}}).props.children;
 assert.ok(h.nodes.some(n=>n.props.className?.includes('workbench-top-toolbar')));
 assert.equal(graph().props.worksheetControls,undefined);
 sheet().props.onToggleColumn('y');h.render();assert.deepEqual(Array.from(sheet().props.hiddenColumns),['y']);
 h.nodes.find(n=>n.props['aria-label']==='Y column').props.onChange({target:{value:'x'}});h.render();
 assert.deepEqual(Array.from(sheet().props.hiddenColumns),['y']);
 const panel=harness('panel',{chartData:[],handleObjectSwitch(){}});
 assert.ok(!panel.nodes.some(n=>n.props.href==='/graphing.html'));
});

test('Reload after graphing starts in Tracker without losing restored measurements; graphing remains explicit',()=>{
 const saved={viewMode:'analysis',origin:{x:40,y:60},pixelsPerMeter:100,objects:[{id:'A',name:'Object A',color:'#ef4444',mass:1,points:[{t:0,x:12,y:34}]}],language:'en'};
 const h=harness('app',{},saved);
 assert.equal(h.store.getState().viewMode,'tracker');
 assert.deepEqual(JSON.parse(JSON.stringify(h.store.getState().objects)),saved.objects);
 assert.equal(h.store.getState().pixelsPerMeter,100);
 assert.deepEqual(JSON.parse(JSON.stringify(h.store.getState().origin)),saved.origin);
 assert.equal(h.store.getState().hasRestoredData,true);
 assert.ok(h.nodes.some(n=>n.props?.className?.includes('tracker-workspace')&&!n.props.className.split(/\s+/).includes('hidden')));
 const welcome=h.nodes.find(n=>typeof n.props?.onGraphing==='function');
 assert.ok(welcome);welcome.props.onGraphing();h.render();
 assert.equal(h.store.getState().viewMode,'analysis');
 assert.ok(!h.nodes.some(n=>typeof n.props?.onGraphing==='function'));
});

test('Advanced graphing transfer action carries every measurement column through the real panel',()=>{
 const positionData=[{time:0,x:1,y:2,xError:.1,yError:.2,timeError:0}],velocityData=[{time:0,vx:3,vy:4}];
 const h=harness('panel',{positionData,velocityData,chartData:[],handleObjectSwitch(){}});
 h.store.setState({viewMode:'analysis',videoSrc:'test.mp4',imageSrc:null,analysisChartMode:'kinematics',plotX:'time',plotY:'vy',pixelsPerMeter:100});h.render();
 const button=h.nodes.find(n=>n.type==='button'&&n.props.children==='Open data in Advanced graphing');assert.ok(button);assert.equal(button.props.disabled,false);button.props.onClick();h.render();
 const embedded=h.nodes.find(n=>n.props?.embedded&&n.props.seed);assert.ok(embedded);assert.equal(embedded.props.seed.table.columns.length,10);assert.deepEqual(JSON.parse(JSON.stringify(embedded.props.seed.axes)),[0,7]);
 assert.equal(positionData[0].x,1);
});
test('table selects a range, broadcasts pasted scalar, copies it and undoes without touching hidden cells',()=>{
 const props={rows:[['1','2','secret'],['3','4','keep']],columns:[{label:'X'},{label:'Y'},{label:'Hidden'}],display:[0,1],language:'en',onChange(next){props.rows=next;},onImport(){}};
 const h=harness('editable',props);
 const table=()=>h.nodes.find(n=>n.props?.onPaste);
 table().props.ref.current={focus(){},setPointerCapture(){},querySelector(){return null;}};
 h.nodes.find(n=>n.props?.['data-row']===0&&n.props['data-col']===1).props.onPointerDown({preventDefault(){},pointerId:1});h.render();
 table().props.onKeyDown({key:'ArrowDown',shiftKey:true,preventDefault(){}});h.render();
 table().props.onPaste({preventDefault(){},clipboardData:{getData:type=>type==='text/plain'?'0.05':''}});h.render();
 assert.deepEqual(JSON.parse(JSON.stringify(props.rows)),[['1','0.05','secret'],['3','0.05','keep']]);
 let copied;table().props.onCopy({preventDefault(){},clipboardData:{setData(type,text){copied=text;}}});assert.equal(copied,'0.05\n0.05');
 table().props.onKeyDown({key:'z',ctrlKey:true,preventDefault(){}});h.render();assert.deepEqual(JSON.parse(JSON.stringify(props.rows)),[['1','2','secret'],['3','4','keep']]);
 table().props.onKeyDown({key:'Delete',preventDefault(){}});h.render();assert.equal(props.rows[0][1],'');assert.equal(props.rows[1][1],'');
});
test('advanced worksheet fit selector computes power law and displays invalid-domain feedback',()=>{
 const h=harness('minimal',{seed:{rows:[{x:'1',y:'12',xError:'',error:''},{x:'2',y:'3',xError:'',error:''},{x:'3',y:String(12/9),xError:'',error:''}]}});
 h.nodes.find(n=>n.type==='select'&&n.props.value==='linear').props.onChange({target:{value:'power'}});h.render();
 const result=()=>h.nodes.find(n=>n.props?.className==='minimal-result');
 assert.ok(h.nodes.some(n=>n.props?.tex?.includes('x^{-2}')));
 const table=h.nodes.find(n=>n.props?.onImport&&n.props.rows);
 table.props.onChange(table.props.rows.map((row,i)=>i===0?['0',...row.slice(1)]:row));h.render();assert.match(result().props.children[0],/X > 0 and Y > 0/);
});

test('themed fill dialog keeps absolute values, supports cancel, and reports invalid uncertainty without closing',()=>{
 for(const language of ['en','es']){
  let applied=null,closed=0;
  const h=harness('fillDialog',{language,title:'±ΔVelocity (m/s)',allowColumn:true,onClose(){closed++;},onApply(value,scope){if(Number(value)<0)throw Error();applied={value,scope};}});
  assert.ok(h.nodes.some(n=>n.props?.role==='dialog'&&String(n.props['aria-modal'])==='true'));
  const input=()=>h.nodes.find(n=>n.type==='input');
  input().props.onChange({target:{value:'-1'}});h.render();h.nodes.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});h.render();
  assert.equal(closed,0);assert.equal(applied,null);assert.ok(h.nodes.some(n=>n.props?.role==='alert'));
  input().props.onChange({target:{value:'0.05'}});h.render();h.nodes.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});h.render();
  assert.deepEqual(applied,{value:'0.05',scope:'column'});assert.equal(closed,1);
 }
});
test('absolute column fill and cell edit participate in table undo',()=>{
 const props={rows:[['1','.1'],['2','.2'],['','']],columns:[{label:'Y',errorIndex:1},{label:'±ΔY',uncertainty:true}],display:[0,1],language:'en',onChange(next){props.rows=next;},onImport(){}};
 const h=harness('editable',props);
 h.nodes.find(n=>n.type==='button'&&n.props.children==='Fill all…').props.onClick();h.render();
 const dialog=h.nodes.find(n=>n.props?.onApply);dialog.props.onApply('.3','column');dialog.props.onClose();h.render();
 assert.deepEqual(JSON.parse(JSON.stringify(props.rows)),[['1','.3'],['2','.3'],['','']]);
 h.nodes.find(n=>n.type==='button'&&n.props.children==='Undo').props.onClick();h.render();assert.equal(props.rows[0][1],'.1');
 const table=()=>h.nodes.find(n=>n.props?.onPaste);table().props.ref.current={focus(){},setPointerCapture(){}};
 h.nodes.find(n=>n.props?.['data-row']===0&&n.props['data-col']===0).props.onDoubleClick();h.render();
 h.nodes.find(n=>n.props?.['data-row']===0&&n.props['data-col']===0).props.onChange({target:{value:'42'}});h.render();
 table().props.onKeyDown({key:'Enter',preventDefault(){}});h.render();assert.equal(props.rows[0][0],'42');
 h.nodes.find(n=>n.type==='button'&&n.props.children==='Undo').props.onClick();h.render();assert.equal(props.rows[0][0],'1');
});
