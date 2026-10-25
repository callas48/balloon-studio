const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
// An asynchronous IDB transaction harness persists across independent app sessions.
const rows=new Map();let rejectWrites=false;
const db={createObjectStore(){},close(){},transaction(store,mode){const tx={error:Error('QuotaExceededError')},writes=[];tx.objectStore=()=>({getAll(){const req={};setTimeout(()=>{req.result=structuredClone([...rows.values()]);req.onsuccess?.();setTimeout(()=>tx.oncomplete?.(),0)},0);return req},put(f){writes.push(structuredClone(f))}});if(mode==='readwrite')setTimeout(()=>{if(rejectWrites)tx.onabort?.();else{writes.forEach(f=>rows.set(f.id,f));tx.oncomplete?.()}},0);return tx}};
const indexedDB={open(){const req={};setTimeout(()=>{req.result=db;req.onupgradeneeded?.();req.onsuccess?.()},0);return req}};
function session(){const nodes=new Map();let fontLoads=0,checkpoints=0;const faces=[];const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',options:[],add(o){this.options.push(o)},classList:{remove(){},add(){}}});return nodes.get(id)};
 class FontFace{constructor(id,url){this.family=id;this.url=url}async load(){fontLoads++;const data=this.url.slice(4,-1);if(!GlobalFonts.register(Buffer.from(data.split(',')[1],'base64'),this.family))throw Error('Invalid font');this.status='loaded';return this}}
 const sb=vm.createContext({console,indexedDB,crypto,FontFace,Option:class{constructor(name,id){this.textContent=name;this.value=id}},document:{fonts:{add:f=>faces.push(f)},addEventListener(){}},fonts:{},state:{fonts:[],items:[],templates:[],imageLayers:[]},projectBook:{activeId:'a',pages:[]},projectBusy:false,structuredClone,$,setProjectBusy:v=>sb.projectBusy=v,read:async f=>f.data,current:()=>sb.state.items[0],checkpoint(){checkpoints++},sync(){},status(){},flushPage(){},textCornerCache:new Map([['old',1]]),streamCache:new Map([['old',1]])});
 for(const f of ['font-storage','font-import'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),sb);
 const app=fs.readFileSync('public/app.js','utf8');vm.runInContext(app.match(/^async function loadFonts\(list\).*$/m)[0],sb);
 const studio=fs.readFileSync('public/studio.js','utf8');vm.runInContext(studio.match(/^function serializableBook\(\).*$/m)[0],sb);
 return{sb,$,faces,get fontLoads(){return fontLoads},get checkpoints(){return checkpoints}};
}
(async()=>{
 const a=session(),bytes=fs.readFileSync('public/fonts/NanumGothic-Bold.ttf'),file={name:'내 테스트 고딕.ttf',data:'data:font/ttf;base64,'+bytes.toString('base64')};
 a.sb.initFontImport();await vm.runInContext('customFontLibraryReady',a.sb);await a.sb.importFontFiles([file]);assert.equal(rows.size,1);assert.equal(a.sb.state.fonts.length,1);assert.equal(a.checkpoints,1);assert.equal(a.sb.textCornerCache.size,0);assert.equal(a.sb.streamCache.size,0);
 const font=a.sb.state.fonts[0],first=a.sb.state;const second={fonts:[],items:[{font:font.id,text:'다른 페이지'}],imageLayers:[{font:font.id}],templates:[]};
 a.sb.projectBook.pages=[{id:'a',name:'폰트 등록 페이지',doc:first},{id:'b',name:'폰트 사용 페이지',doc:second}];a.sb.projectBook.activeId='b';a.sb.state=second;
 const saved=JSON.parse(JSON.stringify(a.sb.serializableBook()));assert.equal(saved.pages[1].doc.fonts[0].data,file.data,'Every referenced font is embedded on another page');assert.equal(second.fonts.length,0,'Saving does not mutate undo/page state');
 const b=session();b.sb.initFontImport();await vm.runInContext('customFontLibraryReady',b.sb);assert.equal(b.$('font').options[0].value,font.id,'Dropdown restored in a fresh app session');assert.equal(b.sb.allAvailableCustomFonts()[0].data,file.data);assert.equal(b.faces.length,1);assert.equal(b.sb.state.fonts.length,0,'Unused library fonts are not copied into empty documents');
 await b.sb.loadFonts([font]);await b.sb.loadFonts([font]);assert.equal(b.fontLoads,1,'One FontFace per font despite repeated page loads');
 b.sb.state={fonts:[],items:[{font:font.id}],imageLayers:[],templates:[]};b.sb.projectBook.pages=[{id:'new',name:'새 프로젝트',doc:b.sb.state}];assert.equal(b.sb.serializableBook().pages[0].doc.fonts[0].data,file.data,'Reused library fonts remain portable');
 await b.sb.importFontFiles([file]);assert.equal(b.sb.state.fonts[0].id,font.id,'Reimporting the same file keeps its original ID');assert.equal(rows.size,1);
 const legacy=JSON.parse(JSON.stringify(saved));legacy.pages[1].doc.fonts=[];assert.equal(await b.sb.prepareBookFonts(legacy),true,'Older multi-page project repaired from another page');assert.equal(legacy.pages[1].doc.fonts[0].id,font.id);
 rows.clear();const c=session();await c.sb.prepareBookFonts(saved);assert(c.faces.some(f=>f.family===font.id),'Portable project restores fonts on another browser with no font library');assert.equal(rows.size,1,'Project fonts retained for future restart');
 const canvas=createCanvas(500,80),g=canvas.getContext('2d');g.font='28px "'+font.id+'"';g.fillText('프로젝트를 다시 열어도 유지되는 폰트',10,40);assert(g.getImageData(0,0,500,80).data.some(v=>v>0));
 rejectWrites=true;const other={id:'custom_quota',name:'저장 실패 테스트',data:file.data};await c.sb.loadFonts([other]);assert.equal(vm.runInContext('customFontStorageError',c.sb),true);assert(c.faces.some(f=>f.family===other.id),'Storage failure still permits project embedding');c.sb.state={fonts:[],items:[{font:other.id}],imageLayers:[],templates:[]};c.sb.projectBook.pages=[{id:'quota',name:'백업',doc:c.sb.state}];assert.equal(c.sb.serializableBook().pages[0].doc.fonts[0].data,file.data);
 const html=fs.readFileSync('public/index.html','utf8');assert(html.indexOf('src="font-storage.js"')<html.indexOf('src="app.js"'));assert(fs.readFileSync('public/font-preview.js','utf8').includes('allAvailableCustomFonts()'));assert(fs.readFileSync('public/export.js','utf8').includes('await ensureCustomDocumentFonts(state)'));
 console.log('PASS: real font bytes, import → cross-page save → fresh session, library reuse, no duplicate faces, legacy repair, portable project restore and quota fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
