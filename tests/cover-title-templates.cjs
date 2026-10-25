const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const nodes=new Map(),history=[];let selected=null,dirty=0,waitFont=null;
function element(){return{children:[],style:{},dataset:{},value:'',classList:{toggle(){}},append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},querySelectorAll(){return this.children.flatMap(c=>c.children||[]).filter(b=>b.dataset?.coverApply)},isConnected:true}}
const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
const sb=vm.createContext({console,structuredClone,crypto,fonts:{},state:{width:832,height:1216,items:[],templates:[]},projectBusy:false,$,current:()=>sb.state.items.find(b=>b.id===selected),checkpoint:()=>history.push(structuredClone(sb.state)),sync(){sb.syncCoverTitleTemplates()},markProjectDirty:()=>dirty++,status(){},ensureComicFont:()=>waitFont||Promise.resolve(),document:{createElement(tag){if(tag==='canvas'){const c=createCanvas(480,200);c.setAttribute=()=>{};c.isConnected=true;return c}return element()}},imageLayerSelected:null,imageLayerEraser:false,setTool(){},zoom:1,balloonTailStyle:()=> 'plain',applyNextTemplate(){}});
const studio=fs.readFileSync('public/studio.js','utf8');vm.runInContext(studio.slice(studio.indexOf('const artDefaults'),studio.indexOf('function renderArtCards')),sb);
vm.runInContext(fs.readFileSync('public/comic-fonts.js','utf8').split('const comicFontFaces')[0],sb);
for(const f of vm.runInContext('COMIC_FONTS.filter(f=>f.category==="cover")',sb)){const family='Test '+f.id;assert(GlobalFonts.register(fs.readFileSync('public/fonts/'+f.file),family));sb.fonts[f.id]='"'+family+'"'}
vm.runInContext(fs.readFileSync('public/cover-title-templates.js','utf8'),sb);
// Use the app's native object constructor and its real checkpoint choice.
const app=fs.readFileSync('public/app.js','utf8');vm.runInContext(app.match(/^function add\(kind,preset,record=true\).*$/m)[0].replace('selected=b.id','setSelected(b.id)'),sb);sb.setSelected=id=>selected=id;
const lettering=fs.readFileSync('public/lettering.js','utf8');vm.runInContext(lettering.slice(lettering.indexOf('function validateLettering'),lettering.indexOf('function initLettering')),sb);
(async()=>{
 const templates=vm.runInContext('coverTitleTemplates',sb);assert.equal(templates.length,6);
 sb.initCoverTitleTemplates();assert.equal($('coverTitleTemplates').children.length,6);assert($('coverTitleTemplates').querySelectorAll().every(b=>b.disabled));
 $('coverTitleFont').value='cover_hs_bombaram_2';$('coverTitleFont').onchange();assert.equal($('coverTitleTemplates').children.length,3);
 const sheet=createCanvas(960,660),sc=sheet.getContext('2d');
 for(const [i,t] of templates.entries()){
  const before=history.length;await sb.useCoverTitleTemplate(t.id);assert.equal(history.length,before+1);const b=sb.current();assert.equal(b.kind,'text');assert.equal(b.font,t.font);assert.equal(b.tail,false);assert.equal(b.opacity,1);assert(b.x>=0&&b.y>=0&&b.x+b.w<=832&&b.y+b.h<=1216);sb.validateLettering({items:[b]});assert.equal(b.art.wave,0);assert.equal(b.art.slant,0);
  const c=createCanvas(480,200);sb.paintCoverTitlePreview(c.getContext('2d'),t);sc.drawImage(c,(i%2)*480,Math.floor(i/2)*220);sc.fillStyle='#667788';sc.fillRect((i%2)*480,Math.floor(i/2)*220+200,480,20);
  // Saved style survives JSON and produces exactly the same shared glyph renderer pixels.
  function draw(object){const c=createCanvas(500,200),ctx=c.getContext('2d');ctx.font=`400 ${object.fontSize}px ${sb.fonts[object.font]}`;ctx.textAlign='center';ctx.textBaseline='middle';sb.paintGlyph(ctx,object,'새벽의 약속',250,100);return c.toBuffer('image/png')}
  assert(draw(b).equals(draw(JSON.parse(JSON.stringify(b)))));
 }
 if(process.env.COVER_TITLE_PREVIEW)fs.writeFileSync(process.env.COVER_TITLE_PREVIEW,sheet.toBuffer('image/png'));
 const b=sb.current();Object.assign(b,{text:'내 제목은 그대로',fontSize:52,x:31,y:42,w:480,h:160});const original=structuredClone(b);await sb.useCoverTitleTemplate(templates[0].id,true);for(const key of ['text','x','y','w','h','fontSize'])assert.equal(b[key],original[key]);assert.equal(b.font,templates[0].font);b.art.stroke='#123456';assert.notEqual(templates[0].art.stroke,b.art.stroke);
 // Applying to a non-text object or busy project must be a no-op.
 b.kind='round';let n=history.length;await sb.useCoverTitleTemplate(templates[1].id,true);assert.equal(history.length,n);sb.projectBusy=true;await sb.useCoverTitleTemplate(templates[0].id);assert.equal(history.length,n);sb.projectBusy=false;
 // Asynchronous font resolution must not add a title to a newly opened document.
 let resolve;waitFont=new Promise(r=>resolve=r);const task=sb.useCoverTitleTemplate(templates[0].id);sb.state={width:320,height:480,items:[],templates:[]};selected=null;resolve();await task;assert.equal(sb.state.items.length,0);waitFont=null;
 await sb.useCoverTitleTemplate(templates[3].id);assert(sb.current().x+sb.current().w<=320);assert(sb.current().y+sb.current().h<=480);
 console.log('PASS cover titles: six actual font/paint previews, per-font filter, native add/one Undo, style-only text/geometry preservation, independent art, JSON pixels, busy/type/stale guards, 320px fit');
})().catch(e=>{console.error(e);process.exitCode=1});
