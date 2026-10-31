const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,Path2D,GlobalFonts,loadImage}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('public/fonts/pretendard/Pretendard-Regular.woff2','Studio Messenger');
GlobalFonts.registerFromPath('public/fonts/pretendard/Pretendard-Bold.woff2','Studio Messenger');
for(const [style,file]of [['outlined','MaterialIconsOutlined-Regular.otf'],['regular','MaterialIcons-Regular.ttf']])GlobalFonts.registerFromPath('public/fonts/material-icons/'+file,'Studio Material '+style);
class FontFace{constructor(name,url){this.family=name;this.url=url}async load(){this.status='loaded';return this}}
let checkpoints=0;
const sb=vm.createContext({FontFace,Path2D,crypto,console,document:{fonts:{add(){}},createElement:()=>createCanvas(1,1)},builtinFontReady:Promise.resolve(),render(){},imageFrom:loadImage,isPolaroid:()=>false,isStream:()=>false,validatePolaroid(){},projectBusy:false,state:{width:1080,height:2400,imageLayers:[]},checkpoint(){checkpoints++},status(){},read:async f=>f.src,$:()=>({}),syncSNSProfileControls(){}});
require('./helpers/image-erase-schema.cjs')(sb);
for(const f of ['social-icons','image-layers','sns-profiles'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),sb);
(async()=>{
 await sb.ensureSocialIconFonts();
 const colorPhoto=(color)=>{const c=createCanvas(300,400),g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,300,400);g.fillStyle='#ffffff66';g.fillRect(35,50,220,200);return c.toDataURL('image/png')};
 const colors=['#e44d56','#e2a035','#43a17a','#467be2','#9263b9','#bc758d','#3985a0','#967049','#485761'];
 for(const [preset,n]of [['kakao',0],['kakaoFeed',6],['instagram',9],['twitter',0]]){
  const l=sb.snsProfileLayer(preset);assert.equal(l.feed.length,n);sb.validateImageLayers({imageLayers:[l]});
  l.avatar.src=colorPhoto('#596d87');l.cover.src=colorPhoto('#628f92');l.postPhoto.src=colorPhoto('#d19e66');l.feed.forEach((p,i)=>p.src=colorPhoto(colors[i]));l.mutualPhotos.forEach(p=>p.src=colorPhoto('#87629d'));
  await sb.loadImageLayers([l]);const regions=sb.snsProfileRegions(l),height=l.h/1.5;
  for(const b of regions.feed){const hit=sb.snsProfileTarget(l,{x:(b.x+b.w/2)*1.5,y:(b.y+b.h/2)*1.5});assert.equal(hit.snsPhoto,b.photo,'Filled feed photos remain editable');assert(b.y+b.h<=height)}
  const a=regions.avatar;assert.equal(sb.snsProfileTarget(l,{x:(a.x+a.w/2)*1.5,y:(a.y+a.h/2)*1.5}).snsPhoto,l.avatar);
  const image=sb.snsProfileBitmap(l),before=image.toBuffer('image/png');assert.equal(image.height,l.h);
  const reload=JSON.parse(JSON.stringify(l));await sb.loadImageLayers([reload]);assert.deepEqual(sb.snsProfileBitmap(reload).toBuffer('image/png'),before,'Project reload preserves photo crops and font output');
  fs.writeFileSync(require('./helpers/qa-output.cjs')('sns-')+preset+'-qa.png',before);
  if(n){const b=regions.feed[0],pixel=image.getContext('2d').getImageData(Math.round((b.x+3)*1.5),Math.round((b.y+3)*1.5),1,1).data;assert.equal(pixel[0],228,'Actual feed photo rendered')}
  const invalid=JSON.parse(JSON.stringify(l));invalid.avatar.zoom=0;assert.throws(()=>sb.validateImageLayers({imageLayers:[invalid]}));
 }
 const l=sb.snsProfileLayer('instagram');sb.state.imageLayers=[l];vm.runInContext('imageLayerSelected=state.imageLayers[0].id',sb);const file={type:'image/png',size:100,src:colorPhoto('#123456')};
 sb.syncSNSProfileControls=()=>{};
 vm.runInContext('snsProfileUpload={layer:state.imageLayers[0],photo:state.imageLayers[0].feed[0],doc:state,bulk:true}',sb);
 await sb.uploadSNSProfilePhotos([file,file,file]);assert(l.feed.slice(0,3).every(p=>p.src===file.src));assert.equal(l.feed[3].src,'');assert.equal(checkpoints,1);
 vm.runInContext('snsProfileUpload={layer:state.imageLayers[0],photo:state.imageLayers[0].avatar,doc:state,bulk:false}',sb);const oldState=sb.state;sb.state={imageLayers:[]};await sb.uploadSNSProfilePhotos([file]);assert.equal(l.avatar.src,'','Stale page upload ignored');sb.state=oldState;
 const html=fs.readFileSync('public/index.html','utf8');assert(html.indexOf('src="sns-profiles.js"')<html.indexOf('src="app.js"'));for(const id of ['addSNSProfile','snsProfileDialog','snsProfileChoices','snsProfileInspector','snsProfileFile'])assert(html.includes('id="'+id+'"'));
 console.log('PASS: four templates, editable filled photos, grid bounds, actual photo rendering, save/reload parity, validation, bulk upload and stale page protection');
})().catch(e=>{console.error(e);process.exitCode=1});
