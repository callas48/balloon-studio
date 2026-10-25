const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let checkpoints=[];
const state={width:832,height:1200,panels:[],imageLayers:[]};
const sb=vm.createContext({state,projectBusy:false,imageLayerSelected:null,selected:null,editTool:'select',window:{mobileMultiSelect:false},zoom:1,pos:e=>e.point,checkpoint:()=>checkpoints.push(structuredClone(state)),render:()=>{},sync:()=>{},canvas:{setPointerCapture:()=>{}},crypto:require('node:crypto').webcrypto});
vm.runInContext(fs.readFileSync('public/panels.js','utf8'),sb);
const api=vm.runInContext('({beginPanelPointer,movePanelPointer,endPanelPointer,validatePanels})',sb);
const event=(x,y)=>({point:{x,y},pointerId:1,pointerType:'mouse',preventDefault(){}});
for(const shape of ['rect','polygon','hex']){
 const panel={id:'moving',shape,x:100,y:200,w:250,h:300};if(shape==='polygon')panel.vertices=[[0,0],[1,.1],[1,1],[0,.9]];
 state.panels=[panel];state.imageLayers=[{id:'photo',panelId:panel.id,x:65,y:140,w:400,h:500,panelZoom:180,visible:true,strokes:[{points:[{x:.2,y:.3}]}],protrusions:[{mode:'paint',size:.1,points:[{x:.4,y:.5}]}]},{id:'hidden',panelId:panel.id,x:80,y:150,w:420,h:520,visible:false},{id:'other',x:20,y:30,w:100,h:100}];
 const before=structuredClone(state);checkpoints=[];vm.runInContext("selectedPanel=null;panelEditMode=true",sb);
 assert(api.beginPanelPointer(event(225,350)));api.movePanelPointer(event(270,385));api.movePanelPointer(event(280,395));api.endPanelPointer(event(280,395));
 assert.equal(checkpoints.length,1,'A drag has one undo checkpoint');assert.deepEqual(checkpoints[0],before);
 assert.equal(panel.x,155);assert.equal(panel.y,245);
 for(let i=0;i<2;i++){assert.equal(state.imageLayers[i].x,before.imageLayers[i].x+55);assert.equal(state.imageLayers[i].y,before.imageLayers[i].y+45);assert.deepEqual({...state.imageLayers[i],x:before.imageLayers[i].x,y:before.imageLayers[i].y},before.imageLayers[i],'Only image position changes');}
 assert.deepEqual(state.imageLayers[2],before.imageLayers[2]);
 vm.runInContext('selectedPanel=null',sb);assert(api.beginPanelPointer(event(280,395)));api.movePanelPointer(event(5000,5000));
 const effectiveX=panel.x-155,effectiveY=panel.y-245;assert.equal(state.imageLayers[0].x,before.imageLayers[0].x+55+effectiveX);assert.equal(state.imageLayers[0].y,before.imageLayers[0].y+45+effectiveY);
 api.movePanelPointer(event(280,395));api.endPanelPointer(event(280,395));assert.equal(state.imageLayers[0].x,before.imageLayers[0].x+55,'Moving back uses initial positions without accumulation');
 const imageBeforeResize=structuredClone(state.imageLayers);vm.runInContext("selectedPanel='moving'",sb);assert(api.beginPanelPointer(event(panel.x,panel.y)));api.movePanelPointer(event(panel.x+10,panel.y+10));api.endPanelPointer(event(panel.x,panel.y));for(let i=0;i<2;i++)assert(Math.abs(state.imageLayers[i].w/state.imageLayers[i].h-imageBeforeResize[i].w/imageBeforeResize[i].h)<1e-9,'Resize retains photo aspect ratio');assert.deepEqual(state.imageLayers[2],imageBeforeResize[2],'Unrelated photo remains unchanged');
}
state.panels=[{id:'empty',shape:'rect',x:0,y:0,w:200,h:200}];state.imageLayers=[];vm.runInContext('selectedPanel=null',sb);assert(api.beginPanelPointer(event(100,100)));api.endPanelPointer(event(140,130));assert.equal(state.panels[0].x,40);
console.log('PASS: rectangle, diagonal and hexagon frame movement; multiple/hidden photos; constrained movement; single undo snapshot; no accumulated offset; unchanged photo size, zoom and retouch; unrelated photos and empty frames; photo aspect preserved on resize');
