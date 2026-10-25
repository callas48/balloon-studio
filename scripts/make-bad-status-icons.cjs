/* Exact 16px native pixel assets. Rebuild: node scripts/make-bad-status-icons.cjs */
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const out=path.resolve('public/bad-status-icons');fs.mkdirSync(out,{recursive:true});
const defs=[];
function icon(id,name,colors,draw){const px=Array.from({length:16},()=>Array(16).fill(0));
 const dot=(x,y,v=2)=>{if(x>=1&&x<=14&&y>=1&&y<=14)px[y][x]=v};
 const line=(x,y,a,b,v=2)=>{let dx=Math.abs(a-x),sx=x<a?1:-1,dy=-Math.abs(b-y),sy=y<b?1:-1,err=dx+dy;for(;;){dot(x,y,v);if(x===a&&y===b)break;let e=2*err;if(e>=dy){err+=dy;x+=sx}if(e<=dx){err+=dx;y+=sy}}};
 const poly=(points,v=2)=>{for(let y=1;y<15;y++)for(let x=1;x<15;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const[a,b]=points[i],[c,d]=points[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside}if(inside)dot(x,y,v)}for(let i=0;i<points.length;i++)line(...points[i],...points[(i+1)%points.length],v)};
 const run=(p,v=2)=>{for(let i=1;i<p.length;i++)line(...p[i-1],...p[i],v)};
 const drop=(x,y,v=2)=>poly([[x,y],[x-2,y+3],[x-2,y+5],[x,y+6],[x+2,y+5],[x+2,y+3]],v);
 const spark=(x,y,v=4)=>{dot(x,y,v);dot(x-1,y,v);dot(x+1,y,v);dot(x,y-1,v);dot(x,y+1,v)};
 draw({dot,line,poly,run,drop,spark});const body=px.map(r=>[...r]);for(let y=1;y<15;y++)for(let x=1;x<15;x++)if(body[y][x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!body[y+dy]?.[x+dx])px[y+dy][x+dx]=1;
 const palette=[null,'#222337',...colors];const can=createCanvas(16,16),c=can.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(px[y][x]){c.fillStyle=palette[px[y][x]];c.fillRect(x,y,1,1)}
 for(const size of [16,32]){const image=createCanvas(size,size),ic=image.getContext('2d');ic.imageSmoothingEnabled=false;ic.drawImage(can,0,0,size,size);fs.writeFileSync(path.join(out,id+'_'+size+'.png'),image.toBuffer('image/png'))}defs.push({id,name,palette:palette.slice(1),pixels:px.map(r=>r.join(''))});}
icon('poison','독',['#56b859','#baf071','#327c57'],({drop,dot,line})=>{drop(7,4);line(6,8,6,9,3);line(7,10,9,9,4);dot(11,3,3);dot(3,5,2)});
icon('fever','발열',['#e56848','#ffc966','#a83d4d'],({run,dot})=>{for(const x of [3,7,11]){run([[x,12],[x+1,10],[x+1,8],[x,6],[x,4],[x+1,2]]);dot(x,5,3);dot(x+1,11,4)}});
icon('arousal','흥분',['#e85d91','#ffb5c1','#9e3f6f'],({poly,run,line})=>{poly([[3,3],[5,3],[7,5],[9,3],[11,3],[12,5],[11,7],[7,10],[3,7],[2,5]]);line(4,4,5,4,3);run([[1,11],[4,11],[5,9],[7,13],[9,10],[10,11],[14,11]],4)});
icon('hypnosis','최면',['#a880df','#78dce9','#f2edff'],({run,dot})=>{run([[12,12],[5,12],[2,9],[2,5],[5,2],[10,2],[13,5],[13,8],[10,10],[6,10],[4,8],[4,6],[6,4],[9,4],[11,6],[10,8],[7,8],[7,6]],2);dot(7,6,4);dot(8,6,3);dot(12,4,3)});
icon('weakened','무력화',['#89899e','#bfc1d0','#555174'],({run,poly,line})=>{run([[4,2],[5,6],[3,9],[5,13]],2);run([[8,2],[7,6],[9,9],[7,13]],4);line(3,13,5,13,3);poly([[12,3],[13,3],[13,8],[14,8],[12,11],[10,8],[12,8]],3)});
icon('hypersense','감각증폭',['#e28ab7','#ffe797','#ab5a9b'],({run,dot})=>{dot(7,8,3);dot(8,8,3);run([[5,5],[4,6],[4,9],[5,10]],2);run([[10,5],[11,6],[11,9],[10,10]],2);run([[3,2],[1,5],[1,10],[3,13]],4);run([[12,2],[14,5],[14,10],[12,13]],4)});
icon('hyperreaction','과민반응',['#ffdb70','#f38db9','#b961a7'],({poly,run,line})=>{poly([[8,1],[4,7],[7,7],[5,13],[11,5],[8,5]],2);line(7,3,6,5,3);run([[1,6],[2,8],[1,10]],4);run([[13,6],[14,8],[13,10]],3)});
icon('shame','수치심',['#f6c7cb','#df617d','#fff0df'],({poly,line,dot})=>{poly([[4,3],[10,3],[12,5],[12,10],[10,12],[4,12],[2,10],[2,5]],2);line(4,6,5,6,4);line(9,6,10,6,4);line(3,8,5,8,3);line(9,8,11,8,3);line(7,9,7,10,4);dot(3,2,3);dot(12,2,3)});
function curves({run},v=2){run([[2,3],[2,5],[3,6],[5,7],[7,6],[8,5],[9,6],[11,7],[13,6],[13,3]],v)}
icon('lactation','모유체질',['#f1c9ce','#fff2d8','#8ecfe5'],g=>{curves(g);g.line(3,5,5,6,3);g.line(10,6,12,5,3);g.drop(8,8,4);g.dot(7,11,3)});
icon('mammary_active','유선 활성',['#f1b7d0','#f7f4e7','#81d4e2'],g=>{curves(g);g.drop(7,8,4);g.dot(6,11,3);g.spark(12,10,3);g.dot(4,4,3)});
icon('secretion','애액상시분비',['#edafca','#7cd6de','#4d96b4'],({run,line,drop,dot})=>{run([[2,2],[5,5],[7,6],[9,5],[12,2]],2);line(3,7,3,12,3);line(7,8,7,12,4);line(11,7,11,9,3);drop(11,8,3);dot(10,12,4)});
icon('secretion_boost','분비 촉진',['#83d9e9','#f6f5dc','#efcb6b'],({drop,poly,line,dot})=>{drop(5,6,2);line(4,10,4,11,3);poly([[11,2],[14,5],[12,5],[12,10],[10,10],[10,5],[8,5]],4);dot(5,3,3)});
// Three-/five-column pixel lettering stays legible at the native sixteen-pixel size.
function letters(g,text,x,y,color=2){const font={L:['100','100','100','100','111'],V:['101','101','101','101','010'],H:['101','101','111','101','101'],P:['110','101','110','100','100'],M:['10001','11011','10101','10001','10001']};let cursor=x;[...text].forEach(ch=>{font[ch].forEach((row,dy)=>[...row].forEach((on,dx)=>{if(on==='1')g.dot(cursor+dx,y+dy,color)}));cursor+=font[ch][0].length+2})}
icon('level_up','레벨 업',['#e9b94b','#fff1a8','#b77c37'],g=>{letters(g,'LV',1,7);g.poly([[11,2],[14,5],[12,5],[12,13],[10,13],[10,5],[8,5]],2);g.line(11,5,11,10,3);g.dot(2,11,4)});
function low(g,text){letters(g,text,text==='MP'?2:3,2);g.poly([[7,9],[8,9],[8,11],[11,11],[8,14],[4,11],[7,11]],2);g.line(7,10,7,12,3);g.dot(3,2,4)}
icon('hp_low','HP LOW',['#e25d70','#ffb1ae','#ad394e'],g=>low(g,'HP'));
icon('mp_low','MP LOW',['#69b1eb','#c6edff','#4766aa'],g=>low(g,'MP'));
icon('curse','저주받음',['#a77be0','#d9bbff','#704b9c'],g=>{g.poly([[5,2],[10,2],[12,4],[12,8],[10,10],[10,13],[5,13],[5,10],[3,8],[3,4]],2);g.line(5,3,9,3,3);for(const x of [5,9]){g.line(x,5,x+1,5,1);g.line(x,6,x+1,6,1)}g.dot(7,8,1);for(const x of [6,8,10])g.line(x,11,x,12,4)});
icon('bleeding','출혈',['#d94c64','#ff9a94','#982e4e'],g=>{g.poly([[8,2],[12,8],[12,11],[10,13],[6,13],[4,11],[4,8]],2);g.line(6,7,6,9,3);g.line(9,12,11,10,4)});
icon('armor_break','갑옷 파괴',['#849fb8','#d5e2eb','#edc56c'],g=>{g.poly([[3,3],[5,2],[6,5],[9,5],[10,2],[12,3],[13,7],[11,8],[11,13],[4,13],[4,8],[2,7]],2);g.line(4,4,4,6,3);g.line(5,10,5,12,3);g.poly([[9,4],[6,8],[9,8],[7,13],[11,7],[8,7]],1);g.run([[8,6],[7,8],[9,8],[8,10]],4)});
function abilityArrow(g,up){g.poly(up?[[11,2],[14,5],[12,5],[12,13],[10,13],[10,5],[8,5]]:[[10,2],[12,2],[12,10],[14,10],[11,13],[8,10],[10,10]],4)}
icon('level_down','레벨 다운',['#55627c','#929cb5','#39435f'],g=>{letters(g,'LV',1,7);g.poly([[10,2],[12,2],[12,10],[14,10],[11,13],[8,10],[10,10]],2);g.line(11,4,11,9,3);g.dot(2,11,4)});
function sword(g){g.poly([[6,2],[7,2],[7,5],[4,9],[2,7]],2);g.line(6,3,3,7,3);g.line(2,8,5,11,2);g.line(3,10,1,13,2);g.dot(1,13,3)}
function spellbook(g){g.poly([[1,4],[3,3],[4,4],[6,3],[7,4],[7,12],[5,11],[4,12],[2,11],[1,12]],2);g.line(2,5,2,9,3);g.line(3,6,3,10,3);g.line(5,6,5,10,3);g.line(6,5,6,9,3);g.line(4,5,4,11,1)}
for(const [up,ink]of [[true,'#edbf5a'],[false,'#596681']]){
 icon('atk_'+(up?'up':'down'),'ATK '+(up?'UP':'DOWN'),['#8ca9bf','#e0edf5',ink],g=>{sword(g);abilityArrow(g,up)});
 icon('mag_'+(up?'up':'down'),'MAG '+(up?'UP':'DOWN'),['#8877b5','#ddd8ef',ink],g=>{spellbook(g);abilityArrow(g,up)});
}
for(const d of defs)d.polarity=['level_up','atk_up','mag_up'].includes(d.id)?'good':'bad';
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(defs.map(({id,name,palette,polarity})=>({id,name,palette,polarity})),null,2)+'\n');
fs.writeFileSync('docs/design/bad-status/pixel-source.json',JSON.stringify(defs,null,2)+'\n');
GlobalFonts.registerFromPath('public/fonts/NanumGothic-Regular.ttf','Sheet Gothic');GlobalFonts.registerFromPath('public/fonts/NanumGothic-Bold.ttf','Sheet Gothic Bold');
const sheetHeight=140+Math.ceil(defs.length/4)*250;const sheet=createCanvas(1040,sheetHeight),c=sheet.getContext('2d');c.fillStyle='#111725';c.fillRect(0,0,1040,sheetHeight);c.fillStyle='#f5f0de';c.font='bold 28px "Sheet Gothic Bold"';c.fillText('RPG STATUS · 도트 아이콘 '+defs.length+'종',36,48);c.font='16px "Sheet Gothic"';c.fillStyle='#a4b4cb';c.fillText('16 × 16 원본 · 1px 외곽선 · 투명 PNG · 확대 미리보기 6배',36,80);
const {loadImage}=require('@napi-rs/canvas');(async()=>{for(let i=0;i<defs.length;i++){const d=defs[i],x=32+(i%4)*252,y=110+Math.floor(i/4)*250;c.fillStyle='#202b3e';c.fillRect(x,y,238,230);for(let a=0;a<14;a++)for(let b=0;b<8;b++){c.fillStyle=(a+b)%2?'#d1d5dc':'#eff1f5';c.fillRect(x+14+a*15,y+12+b*15,15,15)}const im=await loadImage(path.join(out,d.id+'_16.png'));c.imageSmoothingEnabled=false;c.drawImage(im,x+62,y+24,96,96);c.drawImage(im,x+188,y+102,16,16);c.fillStyle='#f3f1e6';c.font='bold 18px "Sheet Gothic Bold"';c.fillText(d.name,x+14,y+164);c.fillStyle='#a5b8d0';c.font='12px "Sheet Gothic"';c.fillText(d.id+'_16.png',x+14,y+191);c.fillStyle=d.polarity==='good'?'#edbf5a':'#a0aac3';c.fillText(d.polarity==='good'?'굿 스테이터스':'배드 스테이터스',x+14,y+215)}fs.writeFileSync('docs/design/bad-status/icon-sheet.png',sheet.toBuffer('image/png'));console.log('Built '+defs.length+' exact16px icons, 32px variants and labeled sheet.');})();
