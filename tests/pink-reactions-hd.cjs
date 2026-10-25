const assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const catalog=JSON.parse(fs.readFileSync('docs/assets/pink-reactions/catalog.json')),base=JSON.parse(fs.readFileSync('docs/assets/pink-reactions/review/baseline-catalog.json'));
const s=vm.createContext({document:{createElement:()=>createCanvas(1,1)},customAssetRegistry:new Map(),imageFrom:src=>loadImage('public/'+src)});
vm.runInContext('const referenceBalloons='+JSON.stringify(catalog),s);
for(const f of ['sticker-assets.js','references.js','warp.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),s);
(async()=>{assert.equal(catalog.length,54);for(const r of catalog){const old=base.find(o=>o.id===r.id);assert(old);assert.equal(r.label,old.label);for(const k of ['fixed','preserveAlpha','collection','whitePaper','paperOpacity','defaultOpacity'])assert.equal(r[k],old[k]);
const im=await s.loadReference(r.id);assert.equal(im.width,r.box[2]);assert.equal(im.height,r.box[3]);
if(r.id>=752){assert.deepEqual(r,old);continue;}
assert(r.url.endsWith('-hd-v3.png'));assert.equal(im.width,r.id===742?792:old.box[2]*4);assert.equal(im.height,r.id===742?916:old.box[3]*4);
const canvas=createCanvas(im.width,im.height),g=canvas.getContext('2d');g.drawImage(im,0,0);const edge=g.getImageData(0,0,im.width,im.height).data;
for(let x=0;x<im.width;x++){assert.equal(edge[x*4+3],0);assert.equal(edge[((im.height-1)*im.width+x)*4+3],0)}for(let y=0;y<im.height;y++){assert.equal(edge[(y*im.width)*4+3],0);assert.equal(edge[(y*im.width+im.width-1)*4+3],0)}
const b={kind:'asset',assetId:r.id,x:15,y:20,w:280,h:420,color:r.color,fill:r.fill,opacity:1,assetRecolor:false},saved=JSON.stringify(b),out=createCanvas(350,500);s.drawReferenceBalloon(out.getContext('2d'),b);assert(out.getContext('2d').getImageData(0,0,350,500).data.some((v,i)=>i%4===3&&v));s.drawReferenceBalloon(out.getContext('2d'),{...b,warp:[.1,-.1,.1,0,0,.1,-.1,0]});assert.equal(JSON.stringify(b),saved,'render/warp cannot mutate saved geometry');
if(![714,742].includes(r.id)&&!r.whitePaper){const small=await sharp('public/'+r.url).resize(old.box[2],old.box[3]).ensureAlpha().raw().toBuffer(),raw=await sharp('public/'+old.url).ensureAlpha().raw().toBuffer();let error=0;for(let i=0;i<small.length;i++){const channel=i%4;error+=Math.abs((channel===3?small[i]:small[i]*small[i-channel+3]/255)-(channel===3?raw[i]:raw[i]*raw[i-channel+3]/255));}assert(error/small.length<6,r.label+' premultiplied round-trip image error');}
}
console.log('PASS HD reactions: 52 versioned enlarged PNGs, 2 unchanged restorations, metadata/transparent edges/native load/render/warp/saved geometry, source-image round-trip fidelity.');})();
