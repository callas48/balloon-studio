const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/panel-photo-zoom.js','utf8');
function setup(saved,storageFails=false){
 let handler,mobile=false,undos=0,renders=0;
 const makeButton=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v}}),button=makeButton(),mobileButton=makeButton(),store=new Map(saved?[['studio.scrollZoom',saved]]:[]);
 const photo={id:'photo',src:'photo',panelId:'cut',x:0,y:0,w:200,h:200},state={items:[],imageLayers:[photo]},panel={id:'cut',w:100,h:100};
 const sb=vm.createContext({document:{},$:id=>id==='mobileScrollZoomToggle'?mobileButton:button,localStorage:{getItem:k=>{if(storageFails)throw Error();return store.get(k)},setItem:(k,v)=>{if(storageFails)throw Error();store.set(k,v)}},matchMedia:()=>({matches:mobile}),canvas:{addEventListener(type,fn,options){assert.equal(type,'wheel');assert.equal(options.passive,false);handler=fn}},state,imageLayerSelected:null,selected:null,selectedPanel:null,projectBusy:false,editTool:'select',window:{},imageLayerEraser:false,socialOcclusionMode:false,protrusionMode:false,phoneFitArmed:false,orderedImageLayers:()=>[photo],imageLayerContains:()=>true,imageLayerImages:new Map([['photo',{width:200,height:200}]]),constrainPanelPhoto(){},panelForLayer:()=>panel,pos:()=>({x:50,y:50}),checkpoint(){undos++},render(){renders++},syncPanels(){},performance:{now:()=>1000}});
 vm.runInContext(source,sb);
 function wheel(extra={}){const e={deltaY:-100,deltaMode:0,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra};handler(e);return e;}
 return {sb,button,mobileButton,store,photo,wheel,mobile:v=>mobile=v,undos:()=>undos,renders:()=>renders};
}
let a=setup();assert.equal(a.button.textContent,'스크롤 줌 ON');let e=a.wheel();assert(e.prevented&&e.stopped);assert(a.photo.w>200);assert.equal(a.undos(),1);
a.button.onclick();assert.equal(a.button.attrs['aria-pressed'],'false');assert.equal(a.store.get('studio.scrollZoom'),'off');const width=a.photo.w;e=a.wheel();assert(!e.prevented&&!e.stopped);assert.equal(a.photo.w,width);assert.equal(a.undos(),1,'OFF neither resizes photo nor creates undo');
a=setup('off');assert.equal(a.button.textContent,'스크롤 줌 OFF');assert(!a.wheel().prevented,'preference restored');a.mobile(true);assert(!a.wheel().prevented,'OFF also preserves mobile wheel scrolling');a.mobile(false);a.button.onclick();assert(a.wheel().prevented,'ON re-enables actual photo zoom');
for(const modifier of ['ctrlKey','metaKey','shiftKey','altKey'])assert(!a.wheel({[modifier]:true}).prevented);
a=setup(null,true);a.button.onclick();assert(!a.wheel().prevented,'blocked storage still allows toggling');
const html=fs.readFileSync('public/index.html','utf8'),css=fs.readFileSync('public/renewal.css','utf8');assert(/id="canvasImageSize"[^]*?<\/button><button id="scrollZoomToggle"/.test(html));assert(css.includes('@media(max-width:800px){.toolbar #scrollZoomToggle{display:none}}'));
console.log('PASS scroll zoom: desktop ON/OFF actual photo resize, native scroll passthrough, persistence/storage failure, mobile wheel lock, modifier keys, adjacent button/mobile hiding');

// The mobile and desktop controls share the same stored preference.
a=setup();assert.equal(a.mobileButton.textContent,'사진 확대 ON');a.mobileButton.onclick();assert.equal(a.button.textContent,'스크롤 줌 OFF');assert.equal(a.mobileButton.attrs['aria-pressed'],'false');assert.equal(a.store.get('studio.scrollZoom'),'off');assert.equal(a.undos(),0);a.button.onclick();assert.equal(a.mobileButton.textContent,'사진 확대 ON');assert.equal(a.undos(),0);
// Use the actual mobile pinch startup and movement handlers, not a mirrored branch.
function mobilePinch(a){
 const s=a.sb;let distance=100,pinchMove;
 Object.assign(s,{zoom:1,mobilePan:false,imageLayerDrag:null,panelDrag:null,emptyPhotoPress:null,viewGesture:null,panStart:null,suppressTouches:false,touchPoints:new Map([[1,{}],[2,{}]]),touchPair:()=>({x:50,y:50,d:distance}),cancelCanvasTouch(){},moveMultiMove:()=>false,size(){},viewport:{scrollLeft:0,scrollTop:0,addEventListener(type,fn){assert.equal(type,'pointermove');pinchMove=fn}}});s.canvas.getBoundingClientRect=()=>({left:0,top:0});
 const mobile=fs.readFileSync('public/mobile.js','utf8');vm.runInContext(mobile.split('\n').find(l=>l.startsWith('function beginViewGesture()')),s);vm.runInContext(mobile.split('\n').find(l=>l.startsWith("viewport.addEventListener('pointermove'")),s);s.beginViewGesture();distance=200;pinchMove({pointerId:1,clientX:50,clientY:50,preventDefault(){},stopImmediatePropagation(){}});return s;
}
a=setup('off');const initial=a.photo.w;let s=mobilePinch(a);assert.equal(s.zoom,2,'OFF pinches the whole canvas');assert.equal(a.photo.w,initial,'OFF preserves photo geometry');assert.equal(a.undos(),0);
a=setup('on');s=mobilePinch(a);assert.equal(s.zoom,1,'ON keeps the viewport scale');assert(a.photo.w>200,'ON pinches the clipped photo');assert.equal(a.undos(),1);
const gesture=s.panelPhotoZoomStart(a.photo,{x:50,y:50}),before=JSON.stringify(a.photo);a.mobileButton.onclick();assert.equal(s.zoomPanelPhoto(gesture,1.5),false,'turning OFF also blocks an already-created photo gesture');assert.equal(JSON.stringify(a.photo),before);
assert(/id="panelLayoutLock"[^]*?<\/button><button id="mobileScrollZoomToggle"/.test(html),'mobile toggle is directly beside frame lock');assert(css.includes('#mobileScrollZoomToggle{display:none}'));assert(css.includes('@media(max-width:800px){#mobileScrollZoomToggle{display:inline-flex'));
console.log('PASS mobile zoom: adjacent mobile button, shared labels/preference/no Undo, actual pinch routes OFF to canvas and ON to photo, mid-gesture lock, mobile wheel passthrough');
