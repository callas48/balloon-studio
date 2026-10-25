// Compile the supplied sheets into individual transparent editor assets.
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const input=process.argv[2],output=path.resolve('dist/handdrawn-balloons');
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const sheets=[
 ['01-3737.png',[rect(0,0,615,495),rect(615,0,614,495),rect(0,495,620,505),rect(620,495,609,505),rect(0,1000,615,536),rect(615,1000,614,536)],['스케치 대화','스케치 외침','몽실 흔들림','별빛 외침','거친 긴장','하트 대화']],
 ['02-3734.png',[[[0,0],[615,0],[615,485],[360,548],[0,548]],rect(615,0,614,500),[[0,548],[360,548],[635,480],[780,480],[780,900],[390,1015],[350,940],[0,920]],[[780,540],[860,540],[860,475],[890,405],[1060,440],[1229,510],[1229,1000],[1130,1000],[980,1080],[780,1000]],[[0,920],[315,940],[390,1015],[630,1000],[630,1536],[0,1536]],[[630,1000],[780,1000],[980,1080],[1130,1000],[1229,1000],[1229,1536],[630,1536]]],['폭발 집중선','파편 외침','번개 외침','세로 격앙','거친 충격','먹선 폭발']],
 ['03-3733.png',[rect(0,0,605,480),rect(605,0,624,480),rect(0,480,605,515),rect(605,480,624,515),rect(0,995,610,541),rect(610,995,619,541)],['겹친 대화','찢어진 종이','흐르는 생각','기울어진 대화','머뭇거림','반짝 곡선']],
 ['04-3736.png',[[[0,0],[390,0],[390,550],[355,620],[200,680],[0,660]],rect(395,0,834,530),[[[0,665],[190,665],[300,555],[635,540],[635,1040],[0,1040]]][0],rect(640,530,589,470),rect(0,1040,580,496),rect(580,1000,649,536)],['세로 외침','가로 외침','날카로운 외침','덜덜 떨림','흘러내림','속도 충격']],
 ['05-3735.png',[rect(0,0,620,505),rect(620,0,609,505),rect(0,505,630,470),rect(630,505,599,470),rect(0,975,620,561),rect(620,975,609,561)],['둥근 하트','구름 생각','두루마리','반짝 몽실','부끄러운 대화','버럭 외침']]
];
function filter(a,w,h,r,max){let b=new Uint8Array(a.length),c=new Uint8Array(a.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=max?0:1;for(let k=Math.max(0,x-r);k<=Math.min(w-1,x+r);k++){if(max?v|=a[y*w+k]:v&=a[y*w+k],v===(max?1:0))break}b[y*w+x]=v}for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=max?0:1;for(let k=Math.max(0,y-r);k<=Math.min(h-1,y+r);k++){if(max?v|=b[k*w+x]:v&=b[k*w+x],v===(max?1:0))break}c[y*w+x]=v}return c}
(async()=>{let entries=[],thumbs=[];for(const [file,polygons,names] of sheets){const im=await loadImage(path.join(input,file));for(let k=0;k<6;k++){
 const poly=polygons[k],x=Math.min(...poly.map(p=>p[0]))-30,y=Math.min(...poly.map(p=>p[1]))-30,w=Math.max(...poly.map(p=>p[0]))-x+30,h=Math.max(...poly.map(p=>p[1]))-y+30;
 const c=createCanvas(w,h),g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,w,h);g.save();g.beginPath();poly.forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](px-x,py-y));g.closePath();g.clip();g.drawImage(im,-x,-y);g.restore();
 const pixels=g.getImageData(0,0,w,h),a=pixels.data,ink=new Uint8Array(w*h);for(let i=0;i<ink.length;i++)ink[i]=a[i*4]<170?1:0;
 const gapRadius=entries.length===5?16:4;const barrier=filter(filter(ink,w,h,gapRadius,true),w,h,gapRadius,false),outside=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;function visit(i){if(!outside[i]&&!barrier[i]){outside[i]=1;queue[tail++]=i}}for(let px=0;px<w;px++){visit(px);visit((h-1)*w+px)}for(let py=0;py<h;py++){visit(py*w);visit(py*w+w-1)}while(head<tail){const i=queue[head++],px=i%w;if(px)visit(i-1);if(px<w-1)visit(i+1);if(i>=w)visit(i-w);if(i<w*(h-1))visit(i+w)}
 const filled=Uint8Array.from(outside,v=>1-v);let left=w,top=h,right=0,bottom=0;
 for(let i=0;i<ink.length;i++){const j=i*4,lum=a[j],alpha=filled[i]?255:lum<235?255-lum:0;a[j]=a[j+1]=a[j+2]=filled[i]?lum:0;a[j+3]=alpha;if(alpha>20){left=Math.min(left,i%w);right=Math.max(right,i%w);top=Math.min(top,Math.floor(i/w));bottom=Math.max(bottom,Math.floor(i/w))}}
 g.putImageData(pixels,0,0);left=Math.max(0,left-8);top=Math.max(0,top-8);right=Math.min(w-1,right+8);bottom=Math.min(h-1,bottom+8);const cropped=createCanvas(right-left+1,bottom-top+1);cropped.getContext('2d').drawImage(c,-left,-top);
 const id=601+entries.length,name=names[k],url=`handdrawn-balloons/${id}.png`;fs.writeFileSync(path.join(output,id+'.png'),cropped.toBuffer('image/png'));
 const body=({609:[.15,.2,.62,.31],610:[.3,.22,.4,.54],613:[.2,.1,.6,.28],615:[.22,.22,.54,.34],619:[.25,.23,.5,.5],620:[.23,.32,.54,.32],623:[.2,.17,.6,.35],627:[.18,.22,.64,.42]})[id]||[.2,.22,.6,.48];entries.push({id,name,category:'handdrawn',url,box:[0,0,cropped.width,cropped.height],body,color:'#222222',tags:['손그림 말풍선']});thumbs.push(cropped);
 }}
 fs.writeFileSync('dist/handdrawn-data.js','referenceBalloons.push(...'+JSON.stringify(entries)+');\n');
 const sheet=createCanvas(1000,Math.ceil(thumbs.length/5)*245),g=sheet.getContext('2d');g.fillStyle='#94abbc';g.fillRect(0,0,sheet.width,sheet.height);thumbs.forEach((im,i)=>{let scale=Math.min(184/im.width,210/im.height),x=i%5*200,y=Math.floor(i/5)*245;g.drawImage(im,x+(200-im.width*scale)/2,y+5,im.width*scale,im.height*scale);g.fillStyle='black';g.font='18px sans-serif';g.fillText(String(entries[i].id),x+80,y+235)});fs.writeFileSync('/workspace/scratch/ff9cacd25b4f/handdrawn-check.png',sheet.toBuffer('image/png'));console.log(entries.length+' assets compiled');
})();
