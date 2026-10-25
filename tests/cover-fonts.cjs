const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {GlobalFonts,createCanvas}=require('@napi-rs/canvas');
const nodes=new Map(),faces=[];let checkpoints=0,redraws=0;
function el(){return{value:'',children:[],dataset:{},style:{},classList:{toggle(){}},append(...n){this.children.push(...n)},replaceChildren(){this.children=[]},querySelectorAll(){return this.children},setAttribute(){},close(){this.open=false}}}
const $=id=>{if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)};
const sb=vm.createContext({console,$,fonts:{},projectBusy:false,state:{items:[{font:'sans',text:'악녀의 봄바람'}],imageLayers:[]},document:{createElement:el,fonts:{add:f=>faces.push(f)}},FontFace:class{constructor(family,url){this.family=family;this.url=url;this.status='unloaded'}async load(){const path='public/'+this.url.slice(4,-1);assert(GlobalFonts.register(fs.readFileSync(path),this.family));this.status='loaded';return this}},Option:class{constructor(name,id){this.textContent=name;this.value=id}},allAvailableCustomFonts:()=>[{id:'custom_demo',name:'직접 불러온 글꼴'}],current:()=>sb.state.items[0],checkpoint:()=>checkpoints++,sync(){},render:()=>redraws++,status(){},IntersectionObserver:class{observe(){}unobserve(){}disconnect(){}}});
for(const f of ['comic-fonts','font-preview'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),sb);
(async()=>{
 vm.runInContext('registerComicFonts()',sb);const group=$('font').children.find(n=>n.label==='표지용');assert.equal(group.children.length,4);assert(faces.every(f=>f.status==='unloaded'));
 $('fontCategory').value='cover';assert.equal(vm.runInContext('filteredPreviewFonts().length',sb),4);
 $('fontSearch').value='클래식';assert.equal(vm.runInContext('filteredPreviewFonts()[0].id',sb),'cover_cafe24_classic_type');
 $('fontSearch').value='NO MATCH';assert.equal(vm.runInContext('filteredPreviewFonts().length',sb),0);
 $('fontSearch').value='';$('fontCategory').value='custom';assert.equal(vm.runInContext('filteredPreviewFonts()[0].id',sb),'custom_demo');
 $('fontCategory').value='all';const count=vm.runInContext('availablePreviewFonts().length',sb);assert(count>40);assert.equal(vm.runInContext('filteredPreviewFonts().length',sb),count);
 const cover=vm.runInContext('COMIC_FONTS.filter(f=>f.category==="cover")',sb);
 for(const f of cover){
  vm.runInContext(`previewFontId=${JSON.stringify(f.id)};applyPreviewFont()`,sb);assert.equal(sb.state.items[0].font,f.id);
  sb.state=JSON.parse(JSON.stringify(sb.state));await vm.runInContext('ensureDocumentComicFonts()',sb);
  const face=faces.find(x=>x.family==='Studio '+f.id);assert.equal(face.status,'loaded');
  const canvas=createCanvas(640,100),ctx=canvas.getContext('2d');ctx.font=`48px "${face.family}"`;ctx.fillText('악녀의 봄바람',5,65);assert(ctx.getImageData(0,0,640,100).data.some((n,i)=>i%4===3&&n));
 }
 assert.equal(checkpoints,4);assert.equal(redraws,4);assert(fs.existsSync('public/fonts/cover/HS-LICENSE.txt'));assert(fs.existsSync('public/fonts/cover/License-Classictype.pdf'));
 const html=fs.readFileSync('public/index.html','utf8');assert.equal((html.match(/id="fontCategory"/g)||[]).length,1);assert(html.includes('<option value="cover">표지용</option>'));
 console.log('Cover fonts: filters, search, native group, lazy loading, apply/Undo, JSON restore, actual font rendering and license files passed');
})().catch(e=>{console.error(e);process.exitCode=1});
