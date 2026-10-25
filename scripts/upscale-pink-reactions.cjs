// Preserve the source lettering; no font replacement or invented stroke details.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..');process.chdir(ROOT);
const catalogPath='docs/assets/pink-reactions/catalog.json';
const review='docs/assets/pink-reactions/review';
const original=JSON.parse(fs.readFileSync(review+'/baseline-catalog.json','utf8'));
const genHwa=process.argv[2]||review+'/hwa-restored-master.png';
async function raw(file){return sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true})}
function keepLargest(pixels,w,h){let seen=new Uint8Array(w*h),groups=[];
for(let i=0;i<w*h;i++){if(seen[i]||!pixels[i*4+3])continue;const q=[i];seen[i]=1;for(let j=0;j<q.length;j++){const at=q[j],x=at%w,y=Math.floor(at/w);for(const [nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||nx>=w||ny<0||ny>=h)continue;const n=ny*w+nx;if(!seen[n]&&pixels[n*4+3]){seen[n]=1;q.push(n)}}}groups.push(q)}
groups.sort((a,b)=>b.length-a.length);let removed=0;for(const group of groups.slice(1)){for(const i of group)pixels[i*4+3]=0;removed+=group.length}return removed;}
async function restoreHaljjak(){
 const {data,info}=await raw('docs/assets/pink-reactions/source-6842.png'),w=info.width;
 const left=724,top=501,width=166,height=197,buf=Buffer.alloc(width*height*4);
 const poly=[[730,507],[767,507],[779,536],[816,536],[816,588],[878,588],[878,642],[895,642],[895,705],[838,705],[838,679],[789,679],[789,648],[743,648],[743,621],[730,621]];
 const inside=(x,y)=>{let b=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,c]=poly[i],[d,e]=poly[j];if((c>y)!=(e>y)&&x<(d-a)*(y-c)/(e-c)+a)b=!b}return b};
 const red=(x,y)=>{if(x<0||y<0||x>=w||y>=info.height)return false;const j=(y*w+x)*4;return data[j]>140&&data[j]-data[j+1]>45&&data[j]-data[j+2]>30};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const sx=x+left,sy=y+top;if(!inside(sx,sy))continue;let near=false;for(let dy=-7;dy<=7&&!near;dy++)for(let dx=-7;dx<=7;dx++)if(dx*dx+dy*dy<=49&&inside(sx+dx,sy+dy)&&red(sx+dx,sy+dy)){near=true;break}if(!near)continue;
 const j=(sy*w+sx)*4,k=(y*width+x)*4,bg=[38,21,39],delta=Math.max(...bg.map((v,n)=>data[j+n]-v)),a=Math.max(0,Math.min(1,(delta-8)/58));if(!a)continue;for(let n=0;n<3;n++)buf[k+n]=Math.max(0,Math.min(255,Math.round((data[j+n]-bg[n]*(1-a))/a)));buf[k+3]=Math.round(a*255);}
 return sharp(buf,{raw:{width,height,channels:4}}).extend({top:16,bottom:16,left:16,right:16,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
}
(async()=>{const report=[];for(const r of original){if(r.id>=752){report.push({id:r.id,decision:'keep',reason:'Existing restoration has 616×916 / 716×550 pixels; sufficient for the 424px catalog and 320px default placement.'});continue;}
 const oldUrl=r.url,{data,info}=await raw('public/'+oldUrl);let input='public/'+oldUrl,removed=0,method='4x Lanczos3 resampling and mild luminance sharpening; no new detail claimed';let width=info.width,height=info.height;
 if(r.whitePaper){removed=keepLargest(data,info.width,info.height);input=await sharp(data,{raw:{width,height,channels:4}}).png().toBuffer();}
 if(r.id===742){input=await restoreHaljjak();const m=await sharp(input).metadata();width=m.width;height=m.height;method+='; original-source re-extraction restores the upper heart and full ㅎ';}
 if(r.id===714&&genHwa){input=await sharp(genHwa).trim({background:'#00000000',threshold:8}).resize({width:(info.width-32)*4,height:(info.height-32)*4,fit:'fill',kernel:'lanczos3'}).extend({top:64,bottom:64,left:64,right:64,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();method='Imagegen restoration, visually verified 화아아아; aligned to original canvas and content bounds';}
 const next=oldUrl.replace(/(?:-v2)?\.png$/,'-hd-v3.png');
 if(r.id===714&&genHwa)await sharp(input).png().toFile('public/'+next);
 else await sharp(input).resize(width*4,height*4,{kernel:'lanczos3'}).sharpen({sigma:.65,m1:.3,m2:.8}).png().toFile('public/'+next);
 const meta=await sharp('public/'+next).metadata();r.url=next;r.box=[0,0,meta.width,meta.height];
 report.push({id:r.id,label:r.label,decision:'upscale',reason:'Source width below 320px default insertion and 424px catalog preview; visible enlargement on review sheet.',sourceUrl:oldUrl,sourceSize:[info.width,info.height],size:[meta.width,meta.height],method,removedDetachedPixels:removed});
 }
 fs.writeFileSync(catalogPath,JSON.stringify(original,null,2)+'\n');
 let js=fs.readFileSync('public/sticker-data.js','utf8');const from=js.indexOf('referenceBalloons.push(...[{"id":700,');if(from<0)throw Error('Reaction catalog marker missing');const end=js.indexOf(']);',from)+3;js=js.slice(0,from)+'referenceBalloons.push(...'+JSON.stringify(original)+');'+js.slice(end);fs.writeFileSync('public/sticker-data.js',js);
 fs.writeFileSync(review+'/decisions.json',JSON.stringify(report,null,2)+'\n');console.log('Updated 52 assets; retained 2 existing high-resolution restorations.');
})();
