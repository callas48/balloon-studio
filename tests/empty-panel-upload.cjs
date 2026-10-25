const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const handlers={},windowHandlers={},documentHandlers={};let now=1000,opened=[],offset=0,captured=[],inspector=false;
const panels=[0,1,2,3].map(i=>({id:'p'+i,shape:'rect',x:(i%2)*120,y:Math.floor(i/2)*120,w:100,h:100}));
const sb=vm.createContext({state:{panels,imageLayers:[],items:[]},projectBusy:false,editTool:'select',mobilePan:false,phoneFitArmed:false,imageLayerEraser:false,socialOcclusionMode:false,polaroidTool:null,protrusionMode:null,panelEditMode:false,selectedPanel:null,selected:null,imageLayerSelected:null,panelDrag:null,drag:null,performance:{now:()=>now},window:{addEventListener:(t,f)=>windowHandlers[t]=f},document:{hidden:false,addEventListener:(t,f)=>documentHandlers[t]=f},canvas:{addEventListener:(t,f)=>(handlers[t]??=[]).push(f),setPointerCapture:id=>captured.push(id)},pos:e=>({x:e.clientX,y:e.clientY-offset}),hitWarpedBalloon:()=>false,$:()=>({click:()=>opened.push(vm.runInContext("selectedPanel",sb))}),sync:()=>{if(inspector&&vm.runInContext("imageLayerSelected",sb)===null){offset=35;inspector=false}}});
vm.runInContext(fs.readFileSync('public/panels.js','utf8'),sb);vm.runInContext(fs.readFileSync('public/image-layers.js','utf8'),sb);vm.runInContext(fs.readFileSync('public/empty-panel-upload.js','utf8'),sb);
let id=0;
function send(type,x,y,pointerType='touch',pointerId=id){const e={button:0,pointerId,pointerType,clientX:x,clientY:y,preventDefault(){},stopImmediatePropagation(){this.stopped=true}};for(const f of handlers[type]||[]){f(e);if(e.stopped)break;}if(type==='pointerdown'&&!e.stopped){vm.runInContext("imageLayerSelected=null",sb);sb.sync();}return e;}
function tap(panel,type='touch'){id++;const x=panel.x+50,y=panel.y+50+offset;send('pointerdown',x,y,type);now+=30;send('pointerup',x,y,type);now+=80;}
// Fill each cut while the previous image is selected. Ordinary selection sync
// moves the canvas, reproducing the failed up hit without pointer reservation.
for(const p of panels){now+=600;tap(p);tap(p);assert.equal(opened.at(-1),p.id);sb.state.imageLayers.push({id:'photo'+p.id,panelId:p.id,x:0,y:0,w:240,h:240,visible:true});vm.runInContext("imageLayerSelected="+JSON.stringify("photo"+p.id),sb);inspector=true;offset=0;}
assert.deepEqual(opened,panels.map(p=>p.id));assert(captured.length>=6);
const filled=opened.length;tap(panels[0]);tap(panels[0]);assert.equal(opened.length,filled,'Filled cuts do not reopen');
sb.state.imageLayers=[];vm.runInContext("imageLayerSelected='photo'",sb);now+=600;tap(panels[0]);const x=50,y=50+offset;id++;send('pointerdown',x,y);send('pointermove',x+20,y);send('pointerup',x+20,y);tap(panels[0]);assert.equal(opened.length,filled,'Dragging is not a double tap');
windowHandlers.blur();assert.equal(vm.runInContext('emptyPanelPointers.size',sb),0);tap(panels[0]);windowHandlers.blur();tap(panels[0]);assert.equal(opened.length,filled,'Picker lifecycle resets pending taps');tap(panels[0]);assert.equal(opened.length,filled+1);
windowHandlers.blur();sb.document.hidden=true;id++;send('pointerdown',50,50+offset);documentHandlers.visibilitychange();assert.equal(vm.runInContext('emptyPanelPointers.size',sb),0);sb.document.hidden=false;
// Desktop native double-click continues to work.
now+=600;send('dblclick',170,50+offset,'mouse');assert.equal(opened.at(-1),'p1');
console.log('PASS: consecutive four-cut uploads with selected-photo layout changes, clipping, filled-cut protection, drag exclusion, picker interruption recovery, desktop double-click');
