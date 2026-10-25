const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
if(fs.existsSync('C:/Windows/Fonts/malgun.ttf'))GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','Review Korean');
const phase=process.argv[2]||'after';
const catalog=JSON.parse(fs.readFileSync(phase==='before'?'docs/assets/pink-reactions/review/baseline-catalog.json':'docs/assets/pink-reactions/catalog.json','utf8'));
const s=vm.createContext({document:{createElement:()=>createCanvas(1,1)},referenceInfo:id=>catalog.find(a=>a.id===id)});
vm.runInContext(fs.readFileSync('public/sticker-assets.js','utf8'),s);
const dir='docs/assets/pink-reactions/review';fs.mkdirSync(dir,{recursive:true});
(async()=>{let stats=[];for(let page=0;page<3;page++){
const sheet=createCanvas(1800,1800),g=sheet.getContext('2d');
g.fillStyle='#263c38';g.fillRect(0,0,1800,1800);
for(let n=0;n<18;n++){const r=catalog[page*18+n];if(!r)continue;
const im=await loadImage('public/'+r.url),prepared=s.prepareSticker(im,r),x=n%6*300,y=Math.floor(n/6)*600;
const k=Math.min(270/im.width,510/im.height);g.drawImage(prepared,x+(300-im.width*k)/2,y+40,im.width*k,im.height*k);
g.fillStyle='#fff';g.font='16px "Review Korean", sans-serif';g.fillText(`${r.id} ${r.label}`,x+8,y+560,290);g.fillText(`${im.width} x ${im.height} (${k.toFixed(1)}x)`,x+8,y+585);
stats.push({id:r.id,label:r.label,width:im.width,height:im.height,url:r.url});}
fs.writeFileSync(`${dir}/${phase}-${page+1}.png`,sheet.toBuffer('image/png'));}
fs.writeFileSync(`${dir}/${phase}-dimensions.json`,JSON.stringify(stats,null,2)+'\n');
console.log('Rendered 54 assets through prepareSticker into three review sheets.');})();
