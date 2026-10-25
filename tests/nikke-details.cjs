const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,GlobalFonts,Path2D}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('public/fonts/pretendard/Pretendard-Bold.woff2','Studio Nikke Pretendard');
const sb=vm.createContext({Path2D,gameUIPresets:[{},{},{}],gameUISVG:[],GAME_UI_FONT:'comic_gyeonggi_title_medium',crypto:require('node:crypto').webcrypto,btoa,postMediaImages:new Map(),state:{width:720,height:1560},document:{createElement:()=>createCanvas(1,1)},gameUIWrap:(c,t,w)=>[t]});
vm.runInContext(fs.readFileSync('public/nikke-ui.js','utf8'),sb);
const api=vm.runInContext('({nikkeLayer,nikkeBitmap,validateNikkeUI})',sb),photo=createCanvas(720,1560),pc=photo.getContext('2d');
const grad=pc.createLinearGradient(0,0,720,1560);grad.addColorStop(0,'#514a3c');grad.addColorStop(1,'#292a33');pc.fillStyle=grad;pc.fillRect(0,0,720,1560);
const pixel=(b,x,y)=>Array.from(b.getContext('2d').getImageData(x,y,1,1).data);
const colours=(b,x,y,w,h)=>{const data=b.getContext('2d').getImageData(x,y,w,h).data,unique=new Set();for(let i=0;i<data.length;i+=4)if(data[i+3])unique.add(`${data[i]},${data[i+1]},${data[i+2]}`);return unique.size};
for(const type of ['consult','confirm']){
 const layer=api.nikkeLayer(type);api.validateNikkeUI(layer);const saved=JSON.parse(JSON.stringify(layer));
 assert.deepEqual(api.nikkeBitmap(layer,photo).toBuffer('image/png'),api.nikkeBitmap(saved,photo).toBuffer('image/png'),'Saved and exported UI use identical artwork');
 const plain=api.nikkeBitmap(layer,null);assert.equal(pixel(plain,360,500)[3],type==='consult'?0:255,'Consultation overlay keeps the picture area transparent');
 if(type==='consult'){
  const maxLayer={...layer,nikkeBondIsMax:true,nikkeBond:0},maxBitmap=api.nikkeBitmap(maxLayer,null);
  assert.equal(pixel(maxBitmap,500,1147)[0],255,'MAX mode fills the entire bond bar regardless of stored numeric bond');
  assert.notDeepEqual(maxBitmap.toBuffer('image/png'),api.nikkeBitmap({...maxLayer,nikkeBondIsMax:false},null).toBuffer('image/png'));
  const maxSaved=JSON.parse(JSON.stringify(maxLayer));api.validateNikkeUI(maxSaved);
  assert.deepEqual(api.nikkeBitmap(maxSaved,null).toBuffer('image/png'),maxBitmap.toBuffer('image/png'),'MAX mode survives save/reload and export');
  assert.equal(maxSaved.nikkeBond,0,'MAX does not overwrite the numeric bond');
  const legacy={...layer};delete legacy.nikkeBondIsMax;api.validateNikkeUI(legacy);
  assert.deepEqual(api.nikkeBitmap(legacy,null).toBuffer('image/png'),plain.toBuffer('image/png'),'Old templates default to numeric mode');
  assert.throws(()=>api.validateNikkeUI({...layer,nikkeBondIsMax:'true'}));
  assert(colours(plain,177,94,34,35)>80,'Gem includes luminous facets, dark outline and highlights');
  assert(colours(plain,358,96,40,30)>50,'Credit card includes gold border and interior detail');
  assert.notDeepEqual(api.nikkeBitmap({...layer,nikkeTop:false},null).toBuffer('image/png'),plain.toBuffer('image/png'));
  assert.equal(pixel(api.nikkeBitmap({...layer,nikkeTop:false},null),195,111)[3],0,'Hiding top bar removes artwork too');
  assert.notDeepEqual(api.nikkeBitmap({...layer,nikkeFavorite:true},null).toBuffer('image/png'),plain.toBuffer('image/png'),'Favorite still changes the star state');
  assert.notDeepEqual(api.nikkeBitmap({...layer,nikkeBond:0,nikkeCount:0,nikkeGems:'123456',nikkeCredits:'123456 K'},null).toBuffer('image/png'),plain.toBuffer('image/png'),'Editable parameters remain effective');
 }
 for(const [w,h]of[[360,780],[832,1200]]){const b=api.nikkeBitmap({...layer,w,h},photo);assert.equal(b.width,w);assert.equal(b.height,h)}
 fs.writeFileSync('/tmp/nikke-'+type+'-details.png',api.nikkeBitmap(layer,photo).toBuffer('image/png'));
}
console.log('PASS: detailed currency pixels, transparent overlay, favorite/top toggles, editable counters, reload/export agreement, consultation and confirmation at three resolutions');
// Exercise the real inspector toggle and its undo checkpoint.
class El{constructor(){this.children=[];this.hidden=false}append(...v){this.children.push(...v)}replaceChildren(){this.children=[]}}
const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new El);return els.get(id)},selected=api.nikkeLayer('consult'),undo=[];
Object.assign(sb,{$:get,currentImageLayer:()=>selected,projectBusy:false,checkpoint:()=>undo.push(JSON.stringify(selected)),sync(){},document:{createElement:t=>t==='canvas'?createCanvas(1,1):new El,createTextNode:t=>t}});
const controls=vm.runInContext('syncNikkeControls',sb);controls();
let toggle=get('nikkeFields').children.find(e=>e.children.includes('호감도 MAX 모드')).children[0];toggle.checked=true;toggle.onchange();
assert.equal(selected.nikkeBondIsMax,true);assert.equal(undo.length,1);assert.equal(JSON.parse(undo[0]).nikkeBondIsMax,false);controls();
assert(!get('nikkeFields').children.some(e=>e.textContent==='호감도 현재'),'Numeric inputs hide in MAX mode');
toggle=get('nikkeFields').children.find(e=>e.children.includes('호감도 MAX 모드')).children[0];toggle.checked=false;toggle.onchange();controls();
assert.equal(selected.nikkeBond,280);assert(get('nikkeFields').children.some(e=>e.textContent==='호감도 현재'));
console.log('PASS: actual MAX inspector toggle, undo checkpoint, numeric mode restoration');

const vectorAPI=vm.runInContext('({nikkeDrawRank,nikkeDrawGift})',sb);
const vectorCanvas=createCanvas(720,1560),vc=vectorCanvas.getContext('2d');vc.fillText=()=>{throw Error('Vector rank must not use a system font')};
for(const rank of [0,1,2,3,4,5,6,7,8,9,30,999999]){vc.clearRect(0,0,720,1560);vectorAPI.nikkeDrawRank(vc,rank);assert.equal(vc.getImageData(105,1019,1,1).data[3],255)}
vc.clearRect(0,0,720,1560);vectorAPI.nikkeDrawGift(vc);assert.equal(vc.getImageData(193,1300,1,1).data[3],0,'Gift vertical ribbon gap is open');assert.equal(vc.getImageData(175,1299,1,1).data[3],0,'Gift horizontal ribbon gap is open');assert.equal(vc.getImageData(175,1290,1,1).data[3],255);assert.equal(vc.getImageData(175,1310,1,1).data[3],255);
console.log('PASS: vector rank draws all digits without fonts; gift has four separate blocks');

const buttonLayer=api.nikkeLayer('consult');assert.equal(buttonLayer.nikkeConsultLabel,'상담');const oldLayer={...buttonLayer};delete oldLayer.nikkeConsultLabel;api.validateNikkeUI(oldLayer);assert.deepEqual(api.nikkeBitmap(oldLayer,null).toBuffer('image/png'),api.nikkeBitmap(buttonLayer,null).toBuffer('image/png'));
selected.nikkeConsultLabel='대화하기';controls();const labelInput=get('nikkeFields').children.find(e=>e.textContent==='상담 버튼 문구').children[0];assert.equal(labelInput.value,'대화하기');assert.equal(labelInput.maxLength,100);const previousUndo=undo.length;labelInput.value='이야기 나누기';labelInput.onchange();assert.equal(selected.nikkeConsultLabel,'이야기 나누기');assert.equal(undo.length,previousUndo+1);assert.equal(JSON.parse(undo.at(-1)).nikkeConsultLabel,'대화하기');
const custom=JSON.parse(JSON.stringify(selected));api.validateNikkeUI(custom);assert.deepEqual(api.nikkeBitmap(custom,null).toBuffer('image/png'),api.nikkeBitmap(selected,null).toBuffer('image/png'));assert.notDeepEqual(api.nikkeBitmap(custom,null).toBuffer('image/png'),api.nikkeBitmap({...custom,nikkeConsultLabel:'상담'},null).toBuffer('image/png'));assert.throws(()=>api.validateNikkeUI({...custom,nikkeConsultLabel:123}));assert.throws(()=>api.validateNikkeUI({...custom,nikkeConsultLabel:'x'.repeat(101)}));
console.log('PASS: default and legacy 상담 label, inspector editing and undo, saved custom label rendering, validation');

const dragAPI=vm.runInContext('({beginNikkeDiaryPointer,moveNikkeDiaryPointer,endNikkeDiaryPointer,cancelNikkeDiaryPointer})',sb),tall=createCanvas(300,1800),tc=tall.getContext('2d');
for(let y=0;y<1800;y+=100){tc.fillStyle=`rgb(${Math.floor(y/8)},${255-Math.floor(y/8)},80)`;tc.fillRect(0,y,300,100)}
sb.postMediaImages.set(selected.id,tall);Object.assign(sb,{state:{width:720,height:1560,items:[]},editTool:'select',window:{mobileMultiSelect:false},imageLayerRect:l=>({x:0,y:0,w:720,h:1560}),socialLocalPoint:(l,p)=>({x:p.x-l.x,y:p.y-l.y}),pos:e=>e.p,hitWarpedBalloon:()=>false,render(){},canvas:{setPointerCapture(){},hasPointerCapture:()=>false}});
const event=(dy,type)=>({button:0,pointerId:1,pointerType:type,p:{x:616-Math.sin(.075)*dy,y:1044+Math.cos(.075)*dy}});
for(const type of ['mouse','touch']){selected.nikkeDiaryPhotoY=50;const start=api.nikkeBitmap(selected,tall),count=undo.length;assert(dragAPI.beginNikkeDiaryPointer(event(-30,type)));dragAPI.moveNikkeDiaryPointer(event(40,type));dragAPI.moveNikkeDiaryPointer(event(70,type));assert(dragAPI.endNikkeDiaryPointer(event(70,type)));assert(selected.nikkeDiaryPhotoY<50);assert.equal(undo.length,count+1,'One undo checkpoint per photo gesture');const after=api.nikkeBitmap(selected,tall);assert.notDeepEqual(after.toBuffer('image/png'),start.toBuffer('image/png'));assert.deepEqual(pixel(after,360,600),pixel(start,360,600),'Background photo position stays unchanged');const savedPhoto=JSON.parse(JSON.stringify(selected));api.validateNikkeUI(savedPhoto);assert.deepEqual(api.nikkeBitmap(savedPhoto,tall).toBuffer('image/png'),after.toBuffer('image/png'))}
selected.nikkeDiaryPhotoY=50;assert(dragAPI.beginNikkeDiaryPointer(event(-30,'touch')));dragAPI.moveNikkeDiaryPointer(event(-10000,'touch'));assert.equal(selected.nikkeDiaryPhotoY,100);dragAPI.cancelNikkeDiaryPointer();assert.equal(dragAPI.moveNikkeDiaryPointer(event(0,'touch')),false);
const oldDiary={...selected};delete oldDiary.nikkeDiaryPhotoY;api.validateNikkeUI(oldDiary);assert.deepEqual(api.nikkeBitmap(oldDiary,tall).toBuffer('image/png'),api.nikkeBitmap({...selected,nikkeDiaryPhotoY:50},tall).toBuffer('image/png'));assert.throws(()=>api.validateNikkeUI({...selected,nikkeDiaryPhotoY:101}));
console.log('PASS: direct mouse/touch diary crop drag, one undo per gesture, clamping/cancellation, independent background, saved position and legacy centered crop');
