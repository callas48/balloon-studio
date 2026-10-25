const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const handlers={},windowHandlers={},elements={layerMiniPopup:{hidden:true,style:{},offsetHeight:200}},items=[{id:'a',kind:'text',x:0},{id:'b',kind:'speech',x:100}];let selected=null,now=1000;
function el(id){return elements[id]??=( {style:{},dataset:{},options:[],classList:{toggle(){}},setAttribute(){},append(){},closest(){return null},addEventListener(){},replaceChildren(){},offsetHeight:200,getBoundingClientRect(){return {left:0,top:0,right:800,bottom:800}}});}
const s=vm.createContext({inputHistoryKey:null,state:{items,imageLayers:[]},projectBusy:false,editTool:'select',mobilePan:false,phoneFitArmed:false,imageLayerEraser:false,socialOcclusionMode:false,polaroidTool:null,protrusionMode:null,panelEditMode:false,textCornerDrag:null,drag:null,imageLayerDrag:null,zoom:1,performance:{now:()=>now},current:()=>selected,currentImageLayer:()=>null,canDirectTail:b=>b?.kind==='speech',canTransformImageLayer:()=>false,pos:e=>({x:e.clientX,y:e.clientY}),hitWarpedBalloon:(b,p)=>p.x>=b.x&&p.x<b.x+80,orderedImageLayers:()=>[],imageLayerContains:()=>false,$:el,document:{activeElement:null,body:{append(){}},createElement:()=>{const node=el('created');Object.defineProperty(node,'id',{configurable:true,set(v){elements[v]=node}});return node},addEventListener(){}},window:{innerHeight:800,innerWidth:800,addEventListener(t,f){(windowHandlers[t]??=[]).push(f)}},canvas:{addEventListener:(t,f)=>(handlers[t]??=[]).push(f),getBoundingClientRect:()=>({left:0,top:0})},socialQuad:()=>[{x:0,y:0},{x:80,y:80}],rotatedBalloonBounds:()=>({left:100,top:0,right:180,bottom:80}),balloonTailStyle:()=> 'speech'});
const appSource=fs.readFileSync('public/app.js','utf8');vm.runInContext(appSource.slice(appSource.indexOf('let editorInputFrame=null;'),appSource.indexOf('function render(){')),s);
vm.runInContext(fs.readFileSync('public/corner-fit.js','utf8'),s);vm.runInContext(fs.readFileSync('public/reference-data.js','utf8'),s);vm.runInContext('function referenceInfo(id){return referenceBalloons.find(r=>r.id===id)}',s);let checkpoints=0;s.initBalloonBorderControls=()=>{};s.recordInput=()=>checkpoints++;s.checkpoint=()=>checkpoints++;s.shareBalloonStyle=()=>{};s.updateLayers=()=>{};s.render=()=>vm.runInContext('syncLayerMiniPopup()',s);s.ensureComicFont=()=>Promise.resolve();vm.runInContext('initLayerMiniPopup()',s);
let id=0;
function event(type,x=20,y=20,pointerType='touch',target=s.canvas,extra={}){const e={type,target,detail:type==='click'||type==='dblclick'?1:0,button:0,pointerId:id,pointerType,clientX:x,clientY:y,...extra,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};for(const f of windowHandlers[type]||[]){f(e);if(e.stopped)break;}if(!e.stopped&&target===s.canvas)for(const f of handlers[type]||[]){f(e);if(e.stopped)break;}if(!e.stopped)target['on'+type]?.(e);if(!e.prevented&&type==='mousedown')s.document.activeElement=target;if(type==='pointerdown'&&!e.stopped&&target===s.canvas){selected=items.find(b=>x>=b.x&&x<b.x+80)||null;vm.runInContext('syncLayerMiniPopup()',s);}return e;}
function tap(x=20){id++;event('pointerdown',x);now+=30;event('pointerup',x);now+=80;}
selected=items[0];vm.runInContext('syncLayerMiniPopup()',s);assert(el('layerMiniPopup').hidden,'Adding/selecting stays closed');tap();assert(el('layerMiniPopup').hidden,'Single tap stays closed');tap();assert(!el('layerMiniPopup').hidden,'Double tap opens text');
// Reproduce a release retargeted to controls just inserted under the finger.
// Window capture must run before native focus/open actions and real button handlers.
const beforeGhost=JSON.stringify(items),historyBeforeGhost=checkpoints;
for(const target of [el('layerMiniClose'),el('layerMiniVerticalRight'),el('layerMiniTranslucent'),el('layerMiniFont'),el('layerMiniColor')]){
 for(const type of ['mousedown','mouseup','click','dblclick']){
  const ghost=event(type,20,20,'',target,{detail:1,sourceCapabilities:{firesTouchEvents:true}});
  assert(ghost.stopped&&ghost.prevented,type+' retargeted to a new control is consumed');
 }
}
assert.equal(JSON.stringify(items),beforeGhost);assert.equal(checkpoints,historyBeforeGhost,'Opening tap creates no edit/Undo');assert(!el('layerMiniPopup').hidden,'Opening release cannot close popup');assert.notEqual(s.document.activeElement,el('layerMiniColor'),'Compatibility mousedown cannot focus color input');
// Keyboard activation is independent of the opening touch and remains usable.
assert(!event('click',0,0,'',el('layerMiniHorizontal'),{detail:0}).stopped);
// A real next press works immediately, even at the same position, without delay.
id++;event('pointerdown',20,20,'touch',el('layerMiniVerticalRight'));event('pointerup',20,20,'touch',el('layerMiniVerticalRight'));assert(!event('click',20,20,'touch',el('layerMiniVerticalRight')).stopped);assert.equal(items[0].writingMode,'vertical');
// Pen release uses the same guard; keyboard/new mouse presses and expiry clear it.
vm.runInContext('openLayerMiniEditor(current(),{pointerType:"pen"})',s);assert(event('click',20,20,'pen',el('layerMiniClose')).stopped);event('keydown',0,0,'',el('layerMiniText'),{key:'ArrowLeft'});assert(!event('click',0,0,'',el('layerMiniHorizontal'),{detail:0}).stopped);
vm.runInContext('openLayerMiniEditor(current(),{pointerType:"touch"})',s);id++;event('pointerdown',20,20,'mouse',el('layerMiniClose'));event('mousedown',20,20,'',el('layerMiniClose'));assert(!event('click',20,20,'mouse',el('layerMiniClose')).stopped);assert(el('layerMiniPopup').hidden);
vm.runInContext('openLayerMiniEditor(current(),{pointerType:"touch"})',s);now+=801;assert(!event('click',20,20,'',el('layerMiniClose')).stopped);assert(el('layerMiniPopup').hidden);
console.log('PASS: retargeted opening mouse/click/dblclick cannot activate controls/focus/close or create Undo; fresh touch/mouse, keyboard, pen and expiry');
id++;event('pointerdown');assert(el('layerMiniPopup').hidden,'Touching canvas hides edit before moving');event('pointermove',50);event('pointerup',50);tap();assert(el('layerMiniPopup').hidden,'Drag then tap does not open');
vm.runInContext('resetMiniEditGesture()',s);tap();tap(120);assert(el('layerMiniPopup').hidden,'Different objects cannot combine taps');tap(120);assert(!el('layerMiniPopup').hidden,'Balloon double tap opens');
vm.runInContext('resetMiniEditGesture()',s);id++;event('pointerdown',120);s.drag={mode:'resize',recorded:false};event('pointerup',120);s.drag=null;tap(120);assert(el('layerMiniPopup').hidden,'Handle gestures excluded');
vm.runInContext('resetMiniEditGesture()',s);s.mobilePan=true;tap(120);tap(120);assert(el('layerMiniPopup').hidden);s.mobilePan=false;
selected=items[0];vm.runInContext('syncLayerMiniPopup()',s);const e=event('dblclick',20,20,'mouse');assert(!el('layerMiniPopup').hidden&&e.stopped,'Desktop double click opens mini and avoids sidebar focus');assert(event('dblclick',20,20,'mouse').stopped,'Compatibility double click does not open another inspector');
selected=items[1];vm.runInContext('syncLayerMiniPopup()',s);assert(el('layerMiniPopup').hidden,'Changing selection closes editor');
console.log('PASS: selection/drag stay closed, text/balloon double tap and mouse double click, different targets, handles, pan, compatibility event, selection change');

const refs=vm.runInContext('referenceBalloons.filter(r=>r.id>=1&&r.id<=56)',s);assert.equal(refs.length,56);
for(const ref of refs){
 const b={id:'ref-'+ref.id,kind:'asset',assetId:ref.id,x:200,text:'원래 대사',font:'sans',fontSize:30,writingMode:'horizontal'};items.splice(0,items.length,b);selected=b;vm.runInContext('resetMiniEditGesture();syncLayerMiniPopup()',s);
 tap(220);assert(el('layerMiniPopup').hidden);tap(220);assert(!el('layerMiniPopup').hidden,'Reference '+ref.id+' double tap');
 assert(!el('layerMiniTextFields').hidden);assert(el('layerMiniBalloonOptions').hidden);assert(el('layerMiniGeometry').hidden);
 el('layerMiniText').value='수정 대사 '+ref.id;el('layerMiniText').oninput();assert.equal(b.text,'수정 대사 '+ref.id);
 el('layerMiniSize').value='42';el('layerMiniSize').oninput();assert.equal(b.fontSize,42);
 el('layerMiniVerticalRight').onclick();assert.equal(b.writingMode,'vertical');
 vm.runInContext('miniOpenedObject=null;syncLayerMiniPopup()',s);id++;event('pointerdown',220,20,'mouse');event('pointerup',220,20,'mouse');assert(event('dblclick',220,20,'mouse').stopped);assert(!el('layerMiniPopup').hidden);
 assert.equal(JSON.parse(JSON.stringify(b)).text,b.text);
}
assert(checkpoints>=56*3);
const fixed={id:'fixed-test',fixed:true};s.fixedReference=fixed;vm.runInContext('referenceBalloons.push(fixedReference)',s);items.splice(0,items.length,{id:'fixed',kind:'asset',assetId:fixed.id,x:200});selected=items[0];vm.runInContext('resetMiniEditGesture();syncLayerMiniPopup()',s);tap(220);tap(220);assert(el('layerMiniPopup').hidden,'Baked lettering stays fixed');
items[0].assetComposition=true;vm.runInContext('resetMiniEditGesture()',s);tap(220);tap(220);assert(!el('layerMiniPopup').hidden,'Composition dialogue remains editable');
items[0].statusUI={version:1};assert.equal(vm.runInContext('canMiniEditText(current())',s),false);
console.log('PASS: all 56 real references touch/mouse, actual dialogue/size/writing handlers, history and JSON; fixed PNG/composition/status distinction');
