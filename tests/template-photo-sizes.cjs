const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');const {createCanvas}=require('@napi-rs/canvas');
let selected=null;const state={width:720,height:1560,imageLayers:[]},s=vm.createContext({crypto:crypto.webcrypto,structuredClone,state,document:{createElement:()=>createCanvas(1,1)},SOCIAL_ICON_GLYPHS:{},postMediaImages:new Map(),drawMaterialIcon:()=>false,socialIconRevision:()=>0,currentImageLayer:()=>selected,current:()=>null,imageLayerRect:l=>l.locked?{x:0,y:0,w:state.width,h:state.height}:l});
for(const f of ['camera-templates','frame-picker','sns-profiles','canvas-image-size'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),s);
for(const variant of ['galaxy','iphone'])for(const [ratio,w,h]of [['3:4',720,960],['9:16',540,960],['1:1',720,720]]){
 selected=s.cameraLayer(variant,true);selected.ratio=ratio;let lines=s.templatePhotoSizeLines(selected);assert(lines.includes(`촬영 사진 영역 권장 ${w} × ${h} px`));assert(lines.includes('갤러리 썸네일 영역 권장 92 × 92 px'));assert.equal(s.cameraBitmap(selected).width,720);
 state.width=360;state.height=780;lines=s.templatePhotoSizeLines(selected);assert(lines.includes(`촬영 사진 영역 권장 ${w/2} × ${h/2} px`));state.width=720;state.height=1560;
 selected.locked=false;selected.w=360;selected.h=780;selected.rotation=65;assert(s.templatePhotoSizeLines(selected).includes(`촬영 사진 영역 권장 ${w/2} × ${h/2} px`),'Movable rotated sizes use layer scale');
}
selected=s.cameraLayer('rec',true);state.width=1280;state.height=720;assert.equal(s.templatePhotoSizeLines(selected).length,1);assert(s.templatePhotoSizeLines(selected)[0].includes('1280 × 720 px'));assert.equal(s.cameraBitmap({...selected,...s.imageLayerRect(selected)}).height,720);
let recorded=[];s.record=(box)=>recorded.push(box);vm.runInContext('const actualDrawSNSPhoto=snsDrawPhoto;snsDrawPhoto=function(c,p,b,...args){record(b);return actualDrawSNSPhoto(c,p,b,...args)}',s);
for(const preset of ['kakao','kakaoFeed','instagram','twitter']){
 selected=s.snsProfileLayer(preset);state.width=selected.w;state.height=selected.h;recorded=[];s.snsProfileBitmap(selected);const info=s.snsProfilePhotoSlots(selected),lines=s.templatePhotoSizeLines(selected);assert(lines.length>=1);for(const box of recorded){assert(info.slots.some(slot=>slot.box.w===box.w&&slot.box.h===box.h),'Every rendered photo size is represented, including small avatars');const dims=`${Math.round(box.w*state.width/720)} × ${Math.round(box.h*state.height/info.h)} px`;assert(lines.some(line=>line.endsWith(dims)))}
 if(preset==='instagram'){assert(lines.some(l=>l.includes('피드 사진 1–9')));assert(lines.some(l=>l.includes('함께 아는 친구 사진 1–3')));selected.showMutual=false;assert(!s.templatePhotoSizeLines(selected).some(l=>l.includes('함께 아는')))}
 if(preset==='kakao')assert(lines.includes('프로필 사진 영역 권장 165 × 165 px'));
 const before=s.templatePhotoSizeLines(selected);state.width*=2;state.height*=2;assert.notDeepEqual(s.templatePhotoSizeLines(selected),before,'Fixed profile slots track actual canvas resize');assert(s.canvasSizeReadoutText(null).includes('영역 권장'));
}
selected=null;assert.equal(s.templatePhotoSizeLines(null).length,0);assert(!s.canvasSizeReadoutText(null).includes('영역 권장'));selected={kind:'image',w:100,h:100};assert.equal(s.templatePhotoSizeLines(selected).length,0);
console.log('PASS: actual camera/photo layouts, all aspect ratios, REC, movable/fixed scaling, SNS 4 presets matching every rendered photo slot, feed grouping, hidden mutual slots, resize and selection cleanup');
