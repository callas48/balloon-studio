const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,Path2D}=require('@napi-rs/canvas');
const sb=vm.createContext({Path2D,state:{imageLayers:[]},fonts:{sans:'sans-serif'},document:{createElement:()=>createCanvas(1,1)}});
vm.runInContext(fs.readFileSync('public/game-ui.js','utf8'),sb);
const api=vm.runInContext('({gamePictureBox,gamePictureBitmap,gameUIBitmap,gameUIDialogueLayout})',sb);
const photo=createCanvas(1280,832);photo.getContext('2d').fillStyle='#ff8020';photo.getContext('2d').fillRect(0,0,1280,832);
for(const [w,h]of[[1280,832],[832,1280]]){
 const l={id:'dialogue',gamePreset:0,w,h,gameFontSize:22,gameName:'히나',gameAffiliation:'게헨나선도부',gameText:'좋은 아침이야, 선생.'},m=api.gameUIDialogueLayout(l,createCanvas(1,1).getContext('2d'));
 const box=api.gamePictureBox(l,[l]),bitmap=api.gameUIBitmap(l,null,[l]);
 assert.equal(bitmap.getContext('2d').getImageData(10,Math.floor(m.y+m.h*.12),1,1).data[3],0,'Gradient starts lower without moving the name or dialogue');
 const alpha=bitmap.getContext('2d').getImageData(10,h-10,1,1).data[3];
 assert(w>=h?alpha>80&&alpha<180:alpha>240,'Landscape gradient is translucent; portrait keeps its existing gradient');
 const picture=api.gamePictureBitmap(l,photo,[l]),bottom=picture.getContext('2d').getImageData(10,h-10,1,1).data;
 assert(Math.abs(box.h-(w>=h?h:m.y+m.h*.15))<1e-7);assert(w>=h?bottom[0]===255:bottom[0]===52,'Landscape photo continues behind the dialogue instead of ending above it');
 const recorded=[],ctx=createCanvas(1,1).getContext('2d'),fill=ctx.fillText.bind(ctx);ctx.fillText=(text,x,y,...rest)=>{recorded.push({text,y});return fill(text,x,y,...rest)};
 sb.document.createElement=()=>({width:0,height:0,getContext:()=>ctx});api.gameUIBitmap(l,null,[l]);sb.document.createElement=()=>createCanvas(1,1);
 assert.equal(recorded.find(t=>t.text==='히나').y,m.y+m.h*130/280);assert.equal(recorded.find(t=>t.text===l.gameText).y,m.y+m.h*169/280);
 assert.deepEqual(api.gameUIBitmap(JSON.parse(JSON.stringify(l)),null,[l]).toBuffer('image/png'),bitmap.toBuffer('image/png'));
}
console.log('PASS: landscape translucency and full picture, lower gradient and picture boundary in portrait, original name and dialogue positions and reload/export consistency');
