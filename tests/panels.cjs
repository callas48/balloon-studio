const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const state={width:832,height:1200,panels:[],imageLayers:[]};
const sandbox=vm.createContext({state,crypto:require('node:crypto').webcrypto});
vm.runInContext(fs.readFileSync('dist/panels.js','utf8'),sandbox);
const api=vm.runInContext('({panelTemplate,layoutChoices,validatePanels,pointInPanel,panelPath})',sandbox);
let total=0;
for(const [w,h] of [[832,1200],[1200,832],[600,600],[832,2400]])for(let n=2;n<=8;n++)for(const choice of api.layoutChoices(n)){
 const panels=api.panelTemplate(n,choice.id,w,h);assert.equal(panels.length,n);api.validatePanels({width:w,height:h,panels,imageLayers:[]});
 const restored=JSON.parse(JSON.stringify(panels));api.validatePanels({width:w,height:h,panels:restored,imageLayers:[]});
 for(const p of panels){const center={x:p.x+p.w/2,y:p.y+p.h/2};assert(api.pointInPanel(center,p,panels));}
 for(let x=4;x<w;x+=17)for(let y=4;y<h;y+=19)assert(panels.filter(p=>api.pointInPanel({x,y},p,panels)).length<=1,`${n} ${choice.id} overlapping at ${x},${y}`);
 total++;
}
const panel=api.panelTemplate(2,'diagonal')[0],c=createCanvas(832,1200),g=c.getContext('2d');g.save();api.panelPath(g,panel);g.clip();g.fillStyle='red';g.fillRect(0,0,832,1200);g.restore();
for(let x=7;x<832;x+=31)for(let y=7;y<1200;y+=31){const inside=api.pointInPanel({x:x+.5,y:y+.5},panel),alpha=g.getImageData(x,y,1,1).data[3];if(alpha===0||alpha===255)assert.equal(alpha===255,inside,'Image clipping matches hit testing');}
assert.throws(()=>api.validatePanels({width:832,height:1200,panels:[{...panel,vertices:[[0,0],[1,1],[1,0],[0,1]]}]}));
const html=fs.readFileSync('dist/index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const id of ['panelTemplateDialog','panelCount','panelLayoutPreviews','panelTemplateApply','addRectPanel','addHexPanel'])assert(ids.includes(id));assert(!ids.includes('addInsetHexTemplate'));assert(!ids.includes('panelLayout'));
const sheet=createCanvas(900,490),sc=sheet.getContext('2d');sc.fillStyle='#f4f7f8';sc.fillRect(0,0,900,490);for(const [i,layout] of ['reference-columns','reference-bands','reference-six'].entries()){sc.save();sc.translate(20+i*300,20);const ps=api.panelTemplate(i===2?6:5,layout,260,420);for(const [j,p] of ps.entries()){api.panelPath(sc,p);sc.fillStyle='#e0e8eb';sc.fill();sc.strokeStyle='#263d43';sc.lineWidth=2;sc.stroke();sc.fillStyle='#263d43';sc.font='24px sans-serif';sc.fillText(String(j+1),p.x+p.w/2-7,p.y+p.h/2+8)}sc.restore()}fs.writeFileSync('/tmp/panel-layout-check.png',sheet.toBuffer('image/png'));
console.log(`PASS: ${total} layout/size combinations, polygon clipping, save/reload, malformed geometry, and dialog wiring`);
// Exercise the dialog handlers with real canvas previews and a small DOM adapter.
class Element{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.value='5';this.classList={toggle(){}};this.style={}}append(...xs){this.children.push(...xs)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attrs[k]=v}showModal(){this.open=true}close(){this.open=false}focus(){}getContext(){return createCanvas(this.width,this.height).getContext('2d')}}
const els=new Map(),el=id=>{if(!els.has(id))els.set(id,new Element(id));return els.get(id)};
Object.assign(sandbox,{$:el,document:{createElement:t=>new Element(t)},projectBusy:false,imageLayerSelected:null,selected:null,checkpoint:()=>{},setTool:()=>{},sync:()=>{},status:()=>{},canvas:{style:{}},confirm:()=>true});
vm.runInContext('openPanelTemplates()',sandbox);assert(el('panelTemplateDialog').open);assert.equal(el('panelLayoutPreviews').children.length,api.layoutChoices(5).length);
const ref=el('panelLayoutPreviews').children.find(b=>b.children[1].textContent==='상단 2 + 중간 1 + 하단 2');ref.onclick();vm.runInContext('addPanelTemplate()',sandbox);assert.equal(state.panels.length,5);assert(!el('panelTemplateDialog').open);
const saved=JSON.stringify(state);state.imageLayers=[{id:'picture',panelId:state.panels[0].id,protrusions:[]}];el('panelCount').value='6';sandbox.confirm=()=>false;vm.runInContext('openPanelTemplates();addPanelTemplate()',sandbox);assert.equal(state.panels.length,5,'Cancelled replacement keeps existing frames');sandbox.confirm=()=>true;vm.runInContext('addPanelTemplate()',sandbox);assert.equal(state.panels.length,6);assert.equal(state.imageLayers[0].panelId,undefined,'Old pictures survive replacement as ordinary layers');
console.log('PASS: preview choices, selection, apply, cancelled replacement, and retained image layers');

for(let count=2;count<=8;count++)for(const choice of api.layoutChoices(count).filter(c=>['full-page-inset','slanted-pair-inset','wide-slanted-stacks','slanted-tall-pairs','pair-slanted-side-stack','wide-staggered-columns','slanted-triple-inset-pair','side-tall-open-space','wide-pair-wide','asymmetric-pairs-hero','pair-wide-side-stack','wide-center','top-three-hero','two-bands-bottom-pair','hero-bottom-three','top-three-strip-hero','side-tall-bottom-wide','slanted-cascade','three-wide-pair','strips-side-insets'].includes(c.id))){
 el('panelCount').value=String(count);vm.runInContext('openPanelTemplates()',sandbox);
 const card=el('panelLayoutPreviews').children.find(b=>b.children[1].textContent===choice.name);assert(card);card.onclick();
 vm.runInContext('addPanelTemplate()',sandbox);assert.equal(state.panels.length,count);
 api.validatePanels(state);
}
console.log('PASS: all twenty additional layouts are selectable and applied with the correct cut count');
const openSpace=api.panelTemplate(4,'side-tall-open-space',832,1200);
assert(!openSpace.some(p=>api.pointInPanel({x:832*.49,y:1200*.80},p)),'Open-space layout retains empty lower center');
console.log('PASS: intentional empty space remains outside every clipping frame');
// Inset cut selection and paint order stay correct even when photos arrive in reverse order.
const insetPanels=api.panelTemplate(2,'full-page-inset',832,1200),inset=insetPanels[1],insetPoint={x:inset.x+inset.w/2,y:inset.y+inset.h/2};
assert(api.pointInPanel(insetPoint,inset,insetPanels));assert(!api.pointInPanel(insetPoint,insetPanels[0],insetPanels));
assert.throws(()=>api.validatePanels({width:832,height:1200,panels:[{...insetPanels[0],overlayOn:'missing'},inset]}));
const red=createCanvas(1,1),blue=createCanvas(1,1);red.getContext('2d').fillStyle='#ff0000';red.getContext('2d').fillRect(0,0,1,1);blue.getContext('2d').fillStyle='#0000ff';blue.getContext('2d').fillRect(0,0,1,1);
state.panels=insetPanels;state.imageLayers=[{id:'inset-photo',panelId:inset.id,visible:true,src:'blue',x:0,y:0,w:832,h:1200},{id:'base-photo',panelId:insetPanels[0].id,visible:true,src:'red',x:0,y:0,w:832,h:1200}];
Object.assign(sandbox,{imageLayerRect:l=>l,isSocialLayer:()=>false,isPolaroid:()=>false,socialWarped:()=>false,layerBitmap:l=>l.id==='inset-photo'?blue:red});
const layerSource=fs.readFileSync('dist/image-layers.js','utf8');vm.runInContext(layerSource.slice(layerSource.indexOf('function imageFramePriority('),layerSource.indexOf('function drawImageLayerSelection(')),sandbox);
const painted=createCanvas(832,1200);sandbox.paint=painted.getContext('2d');vm.runInContext('drawImageLayers(paint)',sandbox);
assert.deepEqual([...sandbox.paint.getImageData(Math.round(insetPoint.x),Math.round(insetPoint.y),1,1).data],[0,0,255,255]);
state.imageLayers=state.imageLayers.slice(1);vm.runInContext('drawImageLayers(paint)',sandbox);assert.deepEqual([...sandbox.paint.getImageData(Math.round(insetPoint.x),Math.round(insetPoint.y),1,1).data],[255,255,255,255]);
console.log('PASS: inset hit testing, invalid links, reverse photo order, and empty inset hides the base image');
const overview=createCanvas(1400,1050),og=overview.getContext('2d');og.fillStyle='#111816';og.fillRect(0,0,1400,1050);
for(const [i,[n,id]]of [[2,'full-page-inset'],[4,'slanted-pair-inset'],[5,'wide-slanted-stacks'],[5,'slanted-tall-pairs'],[6,'pair-slanted-side-stack'],[7,'wide-staggered-columns'],[8,'slanted-triple-inset-pair']].entries()){
 og.save();og.translate((i%4)*350,Math.floor(i/4)*525);og.fillStyle='#20D6A3';og.font='16px sans-serif';og.fillText(n+' cuts / '+id,10,25);og.fillStyle='#fff';og.fillRect(10,40,320,470);
 for(const [j,p]of api.panelTemplate(n,id,320,470).entries()){og.save();og.translate(10,40);api.panelPath(og,p);if(p.overlayOn){og.strokeStyle='#fff';og.lineWidth=6;og.stroke()}og.fillStyle='#dce6e1';og.fill();og.strokeStyle='#263d35';og.lineWidth=2;og.stroke();og.fillStyle='#263d35';og.font='22px sans-serif';og.fillText(String(j+1),p.x+p.w/2-6,p.y+p.h/2+7);og.restore()}og.restore();
}fs.writeFileSync('/tmp/v64-layouts.png',overview.toBuffer('image/png'));
// Restored page thumbnails use the same panel order as the editor/export renderer.
const studioSource=fs.readFileSync('dist/studio.js','utf8');vm.runInContext(studioSource.slice(studioSource.indexOf('async function restorePageThumbnail('),studioSource.indexOf('function flushPage(')),sandbox);
sandbox.document={createElement:()=>createCanvas(1,1)};sandbox.imageFrom=async src=>src==='blue'?blue:red;
sandbox.thumbnailPage={doc:{width:832,height:1200,panels:insetPanels,imageLayers:[{id:'small',src:'blue',panelId:inset.id,x:0,y:0,w:832,h:1200},{id:'big',src:'red',panelId:insetPanels[0].id,x:0,y:0,w:832,h:1200}]}};
(async()=>{await vm.runInContext('restorePageThumbnail(thumbnailPage)',sandbox);const bitmap=await require('@napi-rs/canvas').loadImage(sandbox.thumbnailPage.thumbnail),out=createCanvas(120,150),g=out.getContext('2d');g.drawImage(bitmap,0,0);const scale=.125,px=Math.round(8+insetPoint.x*scale),py=Math.round(insetPoint.y*scale),pixel=g.getImageData(px,py,1,1).data;assert(pixel[2]>200&&pixel[0]<40,'Reloaded thumbnail keeps the inset on top');console.log('PASS: restored page thumbnail preserves inset order after saving');})().catch(e=>{console.error(e);process.exitCode=1});
