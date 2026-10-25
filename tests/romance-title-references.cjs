const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,GlobalFonts,Path2D}=require('@napi-rs/canvas');const nodes=new Map(),history=[];let waitFont=null;const imported=[];let readGate=null;
function el(){return{value:'',textContent:'',style:{},dataset:{},children:[],isConnected:true,classList:{toggle(){}},setAttribute(){},addEventListener(){},append(...n){this.children.push(...n)},replaceChildren(){this.children=[]},querySelectorAll(){return []},showModal(){this.open=true},close(){this.open=false}}}
const $=id=>{if(!nodes.has(id))nodes.set(id,id==='compoundTitlePreview'?createCanvas(600,460):el());return nodes.get(id)};
const s=vm.createContext({console,crypto,structuredClone,Path2D,$,fonts:{},state:{width:832,height:1216,items:[],imageLayers:[],templates:[]},selected:null,pickedDocument:null,pickedBalloons:new Set(),projectBusy:false,imageLayerSelected:null,imageLayerEraser:false,zoom:1,document:{createElement:t=>{if(t!=='canvas')return el();const c=createCanvas(1,1);c.setAttribute=()=>{};c.isConnected=true;return c},body:{append(){}},fonts:{add(){}}},Option:class{constructor(name,id){this.textContent=name;this.value=id}},FontFace:class{constructor(name,url){this.name=name;this.url=url;this.status='unloaded'}async load(){assert(GlobalFonts.register(fs.readFileSync('public/'+this.url.slice(4,-1)),this.name));this.status='loaded';return this}},current:()=>s.state.items.find(b=>b.id===s.selected),sync(){},status(){},checkpoint:()=>history.push(structuredClone(s.state)),markProjectDirty(){},render(){},setTool(){},applyNextTemplate(){},balloonTailStyle:()=> 'speech',emotionKinds:[],basePath:()=>new Path2D(),compositionTextRegion:b=>b,expressionTextBox:b=>b,drawExpressionDecoration(){},family:b=>s.fonts[b.font]||'sans-serif'});
const studio=fs.readFileSync('public/studio.js','utf8'),app=fs.readFileSync('public/app.js','utf8'),lettering=fs.readFileSync('public/lettering.js','utf8');vm.runInContext(studio.slice(studio.indexOf('const artDefaults'),studio.indexOf('function renderArtCards')),s);vm.runInContext(lettering.slice(lettering.indexOf('function textWidth'),lettering.indexOf('function applyNextTemplate')),s);vm.runInContext(app.slice(app.indexOf('function wrapText'),app.indexOf('let editorInputFrame')),s);vm.runInContext(app.match(/^function add\(kind,preset,record=true\).*$/m)[0],s);vm.runInContext(fs.readFileSync('public/comic-fonts.js','utf8'),s);s.registerComicFonts();vm.runInContext(fs.readFileSync('public/cover-title-templates.js','utf8'),s);vm.runInContext(fs.readFileSync('public/compound-title-templates.js','utf8'),s);

vm.runInContext(fs.readFileSync('public/romance-title-references.js','utf8'),s);
s.allAvailableCustomFonts=()=>imported;
s.loadFonts=async list=>{for(const f of list){const name=f.id;assert(GlobalFonts.register(Buffer.from(f.data.split(',')[1],'base64'),name));s.fonts[f.id]='"'+name+'"';if(!imported.some(x=>x.id===f.id))imported.push(f)}};
s.setProjectBusy=x=>s.projectBusy=x;s.customFontLibraryReady=Promise.resolve();s.customFontStorageError=false;s.read=async f=>{if(readGate)await readGate;return f.data};
vm.runInContext(fs.readFileSync('public/font-import.js','utf8'),s);

(async()=>{
 const all=vm.runInContext('coverTitleTemplates',s),refs=all.filter(t=>t.referenceKey);assert.equal(all.length,24);assert.equal(refs.length,15);assert.equal(new Set(refs.map(t=>t.referenceFont)).size,15);
 assert.equal(vm.runInContext('COMIC_FONTS.length',s),44,'paid fonts must not appear as installed fonts');
 const sheet=createCanvas(1800,2300),ctx=sheet.getContext('2d');
 for(const [i,t] of refs.entries()){
  s.openCompoundTitleDialog(t.id);assert.equal($('compoundTitleFont').value,t.font);assert.match($('compoundTitleReferenceNote').textContent,t.referenceKey==='hs'?/등록|HS봄바람체 2.0/:/대체 글꼴/);
  await s.ensureTitleFont(t.font);const tile=createCanvas(600,460);s.paintCompoundTitlePreview(tile.getContext('2d'),t,600,460);ctx.drawImage(tile,(i%3)*600,Math.floor(i/3)*460);
  const n=s.state.items.length,h=history.length;assert(await s.placeCompoundTitle());assert.equal(history.length,h+1);assert.equal(s.state.items.length,n+3);const parts=s.state.items.slice(-3);assert.equal(new Set(parts.map(b=>b.objectGroup)).size,1);assert(new Set(parts.map(b=>b.fontSize)).size>1);assert(parts.every(b=>b.x>=0&&b.y>=0&&b.x+b.w<=832+1&&b.y+b.h<=1216+1));
  function draw(items){const c=createCanvas(832,1216);for(const b of items)s.drawBalloon(c.getContext('2d'),b);return c.toBuffer('image/png')}
  assert(draw(parts).equals(draw(JSON.parse(JSON.stringify(parts)))));
 }
 if(process.env.ROMANCE_TITLE_PREVIEW)fs.writeFileSync(process.env.ROMANCE_TITLE_PREVIEW,sheet.toBuffer('image/png'));
 // Reference-family filters and honest actual-font labels.
 $('coverTitleFont').value='references';s.renderCoverTitleTemplates();assert.equal($('coverTitleTemplates').children.length,15);
 $('coverTitleFont').value='ref:rose-thorn';s.renderCoverTitleTemplates();assert.equal($('coverTitleTemplates').children.length,1);assert.match($('coverTitleTemplates').children[0].children[0].children[2].textContent,/Rix.*대체/);
 // Actual importer loads and connects a font without changing the old selected text.
 s.state.fonts=[];const old=s.current(),fontBefore=old.font;const file={name:'my-licensed-font.ttf',data:'data:font/ttf;base64,'+fs.readFileSync('public/fonts/cover/hs-bombaram-2.ttf').toString('base64')};
 s.openCompoundTitleDialog(refs[0].id);await s.importCompoundTitleFont([file]);assert.equal(old.font,fontBefore);assert.equal(s.state.fonts.length,1);const id=s.state.fonts[0].id;assert.equal($('compoundTitleFont').value,id);assert.match($('compoundTitleReferenceNote').textContent,/보유 폰트/);assert.equal(s.projectBusy,false);assert.equal(vm.runInContext('compoundTitleBusy',s),false);
 assert(await s.placeCompoundTitle());assert(s.state.items.slice(-3).every(b=>b.font===id));s.openCompoundTitleDialog(refs[1].id);const beforeDuplicate=history.length;await s.importCompoundTitleFont([file]);assert.equal($('compoundTitleFont').value,id);assert.equal(history.length,beforeDuplicate);assert.equal(s.state.fonts.length,1);
 // Reuse a restored library font on a fresh page: one Undo embeds original bytes.
 s.state={width:320,height:480,items:[],imageLayers:[],fonts:[]};s.selected=null;s.openCompoundTitleDialog(refs[5].id);assert($('compoundTitleFont').children.some(o=>o.value===id));$('compoundTitleFont').value=id;s.readCompoundTitleForm();const h=history.length;assert(await s.placeCompoundTitle());assert.equal(history.length,h+1);assert.equal(s.state.fonts[0].data,file.data);assert(s.state.items.every(b=>b.font===id&&b.x+b.w<=321&&b.y+b.h<=481));
 // Unknown font or a document replacement while importing never mutates a new page.
 s.openCompoundTitleDialog(refs[0].id);vm.runInContext("compoundTitleDraft.font='custom_missing'",s);const n=s.state.items.length;assert.equal(await s.placeCompoundTitle(),false);assert.equal(s.state.items.length,n);
 let release;readGate=new Promise(r=>release=r);s.openCompoundTitleDialog(refs[0].id);const task=s.importCompoundTitleFont([{...file,name:'other-font.ttf',data:file.data+' '}]);s.state={width:320,height:480,items:[],imageLayers:[],fonts:[]};release();await task;assert.equal(s.state.items.length,0);assert.equal(s.state.fonts.length,0);assert.equal(s.projectBusy,false);assert.equal(vm.runInContext('compoundTitleBusy',s),false);readGate=null;
 console.log('PASS romance references: 15 honest font profiles/6 layouts, 24 catalog cards, actual font rendering, grouped native text/one Undo/JSON/320px fit, reference filters, real importer without selected-object mutation, restored font embedding, missing/stale guards');
})().catch(e=>{console.error(e);process.exitCode=1});
