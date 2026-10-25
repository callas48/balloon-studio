const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const pref=fs.readFileSync('public/text-font-preference.js','utf8'),app=fs.readFileSync('public/app.js','utf8'),lettering=fs.readFileSync('public/lettering.js','utf8'),rich=fs.readFileSync('public/rich-text.js','utf8');
const storage=new Map();let failStorage=false;
function session(){const fields=new Map(),$=id=>{if(!fields.has(id))fields.set(id,{value:'',scrollTop:0,textContent:'',children:[],style:{},dataset:{},classList:{toggle(){}},setAttribute(){},append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},querySelectorAll(){return []},close(){}});return fields.get(id)};
 const s=vm.createContext({console,structuredClone,crypto,Intl,$,fonts:{comic_gyeonggi_title_medium:'M',sans:'sans',serif:'serif',shout:'sans',cover_hs_bombaram_2:'HS',custom_saved:'custom'},state:{width:832,height:1216,items:[],templates:[]},selected:null,projectBusy:false,imageLayerSelected:null,imageLayerEraser:false,zoom:1,checkpoint(){},sync(){},status(){},render(){},markProjectDirty(){},setTool(){},balloonTailStyle:()=> 'speech',localStorage:{getItem(k){if(failStorage)throw Error('storage unavailable');return storage.get(k)??null},setItem(k,v){if(failStorage)throw Error('storage unavailable');storage.set(k,v)}},ensureComicFont:async id=>{s.lastLoad=id},document:{activeElement:null,createElement:()=>({style:{},append(){},setAttribute(){}})},current:()=>s.state.items.find(b=>b.id===s.selected),artOf:b=>({slant:0,...b.art})});
 vm.runInContext(pref,s);vm.runInContext(lettering.slice(0,lettering.indexOf('function textWidth')),s);for(const name of ['applyNextTemplate','chooseTemplate'])vm.runInContext(lettering.match(new RegExp('^function '+name+'\\(.*$','m'))[0],s);s.showTextTemplates=()=>{};vm.runInContext(rich,s);vm.runInContext(app.match(/^function add\(kind,preset,record=true\).*$/m)[0],s);
 return s;
}
const s=session();assert.equal(s.preferredTextFont(),'comic_gyeonggi_title_medium');s.initTextFontPreference();assert.equal(s.$('font').value,'comic_gyeonggi_title_medium');
for(const kind of ['text','round','narration','thought','shout','cloud','wavy']){s.add(kind);assert.equal(s.current().font,'comic_gyeonggi_title_medium')}
// Ordinary/quick font controls share the same whole-object setter.
s.updateRichTextProperty(s.current(),'font','serif');s.add('text');assert.equal(s.current().font,'serif');s.add('narration');assert.equal(s.current().font,'serif');
// Generic situation presets inherit; named-font presets intentionally change it.
s.chooseTemplate(vm.runInContext('situationTemplates.find(t=>t.id==="story")',s));s.add('thought');assert.equal(s.current().font,'serif');s.chooseTemplate({id:'named',name:'명시적 글꼴',font:'sans',fontSize:28});s.add('round');assert.equal(s.current().font,'sans');
s.updateRichTextProperty(s.current(),'font','custom_saved');s.add('narration');assert.equal(s.current().font,'custom_saved','Active template must not reset a later manual font choice');
// Selecting an older object and synchronizing must never change either its font or the preference.
const old=s.state.items[0];s.selected=old.id;s.sync();assert.equal(old.font,'comic_gyeonggi_title_medium');s.add('text');assert.equal(s.current().font,'custom_saved');
// Local emphasis does not become the next box's default.
const b=s.current();b.text='강조할 글자';const f=s.$('text');Object.assign(f,{id:'text',value:b.text,selectionStart:0,selectionEnd:3});s.captureRichTextSelection(f);s.updateRichTextProperty(b,'font','serif');assert.equal(b.font,'custom_saved');s.add('round');assert.equal(s.current().font,'custom_saved');
// Explicit shape/font presets are reusable and survive a fresh session.
s.add('text',{font:'cover_hs_bombaram_2'});s.add('round');assert.equal(s.current().font,'cover_hs_bombaram_2');const reload=session();reload.add('narration');assert.equal(reload.current().font,'cover_hs_bombaram_2');
// Missing/invalid fonts recover to M; blocked storage still remembers within the session.
storage.set('studio.lastTextFont','missing_font');assert.equal(session().preferredTextFont(),'comic_gyeonggi_title_medium');storage.set('studio.lastTextFont','<invalid>');assert.equal(session().preferredTextFont(),'comic_gyeonggi_title_medium');failStorage=true;const blocked=session();blocked.rememberTextFont('serif');blocked.add('text');assert.equal(blocked.current().font,'serif');failStorage=false;
assert(vm.runInContext('situationTemplates.slice(0,5).every(t=>t.font==="comic_gyeonggi_title_medium"&&t.inheritFont)',s));
console.log('PASS default font: M for all native kinds, whole-object sticky font, generic vs named presets, stale active-template override, existing-object/inline preservation, explicit custom/preset font, fresh session and missing/blocked storage fallback');
