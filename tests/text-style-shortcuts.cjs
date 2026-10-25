const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
let b={kind:'round',weight:'400',art:{slant:0,wave:4}},dialog=null;
const history=[],controls={};
const context={projectBusy:false,compositionBusy:false,compositionDraft:{weight:'400',art:{slant:0}},inputHistoryKey:null,props:['text','weight'],artControls:{artSlant:'slant'},document:{querySelector:()=>dialog},current:()=>b,canDirectTail:o=>o.kind==='round',artOf:o=>o.art||{},status(){},syncCompositionForm(){},Event:class{},$:id=>controls[id]};
for(const id of ['weight','artSlant'])controls[id]={value:'',dispatchEvent(){history.push(JSON.stringify(b));if(id==='weight')b.weight=this.value;else b.art={...b.art,slant:Number(this.value)}}};
vm.createContext(context);vm.runInContext(app.slice(app.indexOf('function handleTextStyleShortcut(')),context);
function target(id='',field=false,composer=false){return{id,isContentEditable:false,matches:s=>s==='[data-composition]'?composer:field,closest:()=>composer?{}:null}}
function press(key,t=target(),extra={}){const e={key,ctrlKey:true,target:t,preventDefault(){this.prevented=true},...extra};const handled=context.handleTextStyleShortcut(e);return{handled,prevented:!!e.prevented}}
assert(press('b',target('text',true)).handled);assert.equal(b.weight,'700');assert(press('b',target('layerMiniText',true)).handled);assert.equal(b.weight,'400');
assert(press('i',target('layerMiniText',true)).handled);assert.equal(b.art.slant,12);assert.equal(b.art.wave,4);assert(press('i').handled);assert.equal(b.art.slant,0);
const count=history.length;assert(press('b',target(),{repeat:true}).handled);assert.equal(history.length,count);
for(const extra of [{isComposing:true},{altKey:true},{ctrlKey:false}])assert(!press('b',target(),extra).handled);
assert(!press('b',target('title',true)).handled);assert.equal(b.weight,'400');
context.projectBusy=true;assert(!press('b').handled);context.projectBusy=false;
dialog={id:'fontPreviewDialog'};assert(!press('b').handled);
dialog={id:'assetComposerDialog'};assert(press('b',target('',true,true)).handled);assert.equal(context.compositionDraft.weight,'700');assert(press('i',target('',true,true)).handled);assert.equal(context.compositionDraft.art.slant,12);
dialog=null;b={kind:'text',weight:'900',art:{slant:0}};assert(press('b',target(),{ctrlKey:false,metaKey:true}).handled);assert.equal(b.weight,'400');
assert(history.length>=5,'style changes reach existing input/history controls');
assert(app.includes('if(handleTextStyleShortcut(e))return;'),'shortcut is wired before text-field and modal guards');
const shapes={};vm.createContext(shapes);vm.runInContext(fs.readFileSync('public/balloons.js','utf8'),shapes);
assert.equal(vm.runInContext("balloonChoices('thin').find(b=>b.kind==='wavy').innerLines",shapes),false);
shapes.drawInnerLines(new Proxy({}, {get(){throw Error('legacy wavy guides must never render')}}),{kind:'wavy',innerLines:true});
console.log('PASS: editor/quick/composer shortcuts, toggles, existing style history, repeat/IME/field guards, legacy wavy guides');
