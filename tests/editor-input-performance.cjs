// Real row reconciliation, input render scheduler and page thumbnail invalidation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const source=n=>fs.readFileSync('public/'+n+'.js','utf8');
let allocations=0,writes=0;
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.parentNode=null;this._text='';allocations++}
 append(...nodes){for(const n of nodes){if(n.parentNode)n.parentNode.removeChild(n);this.children.push(n);n.parentNode=this}}
 insertBefore(n,before){if(n===before)return;if(n.parentNode)n.parentNode.removeChild(n);this.children.splice(this.children.indexOf(before),0,n);n.parentNode=this}
 removeChild(n){const i=this.children.indexOf(n);assert(i>=0);this.children.splice(i,1);n.parentNode=null;return n}
 replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this.children=[];this.append(...nodes)}
 setAttribute(k,v){writes++;this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}
 addEventListener(k,f){(this.listeners??={})[k]=f}
 set textContent(v){writes++;this._text=v;this.replaceChildren()}get textContent(){return this._text}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node('div'));return nodes.get(id)};
const ctx=vm.createContext({console,$:get,document:{createElement:t=>new Node(t)},state:{items:[],imageLayers:[],panels:[]},orderedImageLayers(){return ctx.state.imageLayers},pickedBalloons:new Set(),imageLayerSelected:null,selectedPanel:null,projectBusy:false,referenceImages:new Map(),selected:null});
vm.runInContext(source('layer-panel'),ctx);
ctx.state.items=Array.from({length:300},(_,i)=>({id:'b'+i,kind:'text',text:'대사 '+i}));
ctx.state.imageLayers=[{id:'image',name:'사진',src:'data:image/png;base64,photo'}];
ctx.state.panels=[{id:'p',visible:true}];ctx.renderLayerList();
const host=get('layers'),rows=[...host.children],photoRow=rows[300],photoImg=photoRow.children[1].children[0].children[0],initial=allocations;
for(let i=0;i<100;i++){ctx.state.items[0].text='입력 '+i;ctx.renderLayerList('b0')}
assert.equal(allocations,initial,'100 text edits allocate no new DOM nodes');assert.deepEqual(host.children,rows);assert.equal(host.children[300].children[1].children[0].children[0],photoImg);
assert.equal(rows[299].children[1].children[1].children[1].textContent,'입력 99');
const unchangedWrites=writes;ctx.renderLayerList();assert.equal(writes,unchangedWrites,'Unchanged rows perform no text/aria writes');
ctx.pickedBalloons.add('b0');ctx.renderLayerList();assert(rows[299].children[1].className.includes('active'));
ctx.state.items.reverse();ctx.renderLayerList();assert.equal(host.children[0],rows[299]);assert.equal(allocations,initial);
const old=ctx.state.items.at(-1),replacement={...old,text:'Undo가 복원한 객체'};ctx.state.items[ctx.state.items.length-1]=replacement;ctx.renderLayerList();let selectedObject=null;ctx.selectEditorLayer=e=>{selectedObject=e.object};host.children[0].children[1].onclick({});assert.equal(selectedObject,replacement,'Reused handlers follow restored objects, not old references');
ctx.state.items.pop();ctx.state.items.push({id:'new',kind:'narration',text:'<img src=x onerror=alert(1)>'});ctx.renderLayerList();assert.equal(host.children.length,302);assert.equal(host.children[0].children[1].title,'<img src=x onerror=alert(1)>');
ctx.state.panels[0].visible=false;ctx.state.imageLayers[0].panelId='p';ctx.renderLayerList();assert(photoRow.className.includes('layer-hidden'));
ctx.projectBusy=true;ctx.renderLayerList();assert(photoRow.children[0].disabled&&photoRow.children[1].disabled);
ctx.state={items:[],imageLayers:[],panels:[]};ctx.renderLayerList();const empty=host.children[0];ctx.renderLayerList();assert.equal(host.children[0],empty);assert.equal(host.children.length,1);
// A legacy comparison is optional; sanitized exports do not contain Sites Git history.
if(process.env.BALLOON_LEGACY_LAYER_REF){
const oldSource=execFileSync('git',['show',process.env.BALLOON_LEGACY_LAYER_REF+':public/layer-panel.js'],{encoding:'utf8'});
const before=vm.createContext({$:get,document:{createElement:t=>new Node(t)},state:{items:Array.from({length:300},(_,i)=>({id:'x'+i,kind:'text',text:'대사'})),imageLayers:[],panels:[]},orderedImageLayers:()=>[],pickedBalloons:new Set(),imageLayerSelected:null,selectedPanel:null,projectBusy:false,referenceImages:new Map()});
vm.runInContext(oldSource,before);before.renderLayerList();const baselineStart=allocations;for(let i=0;i<100;i++){before.state.items[0].text='입력 '+i;before.renderLayerList()};const baselineNodes=allocations-baselineStart;assert(baselineNodes>=180000);console.log('PASS layer DOM workload: 300 objects × 100 edits; before '+baselineNodes+' new nodes, after 0. This is a DOM count, not a browser FPS benchmark.');
}else console.log('PASS current layer DOM workload: 300 objects × 100 edits allocate 0 new nodes; historical Git comparison not requested.');
const app=source('app'),frames=new Map();let frameId=0,renders=0;
const renderCtx=vm.createContext({requestAnimationFrame:f=>{frames.set(++frameId,f);return frameId},cancelAnimationFrame:id=>frames.delete(id),render(){renders++}});
vm.runInContext(app.slice(app.indexOf('let editorInputFrame=null;'),app.indexOf('function render(){')),renderCtx);
for(let i=0;i<100;i++)renderCtx.requestEditorInputRender();assert.equal(frames.size,1);assert.equal(renders,0);const callback=[...frames.values()][0];frames.clear();callback();assert.equal(renders,1);renderCtx.requestEditorInputRender();assert.equal(frames.size,1);
// Execute real input listeners from app.js and real mini editor (the latter also
// runs through tests/mini-edit-gesture.cjs). Check no accidental path was left behind.
assert(app.includes('updateLayers(b.id);syncReferenceControls();requestEditorInputRender()'));
assert(source('corner-fit').includes('updateLayers(b.id);requestEditorInputRender()'));
const inputs=new Map(),inputNode=id=>{if(!inputs.has(id))inputs.set(id,new Node('div'));return inputs.get(id)};
let inputFrame=null,inputPaints=0;const typed={id:'typed',kind:'text',text:'원래 대사'};
const inputCtx=vm.createContext({$:inputNode,document:{createElement:t=>new Node(t)},state:{items:[typed],imageLayers:[],panels:[]},current:()=>typed,props:['text'],inputHistoryKey:null,recordInput(){},shareBalloonStyle(){},syncReferenceControls(){},orderedImageLayers:()=>[],pickedBalloons:new Set(),referenceImages:new Map(),projectBusy:false,imageLayerSelected:null,selectedPanel:null,requestAnimationFrame:f=>{inputFrame=f;return 1},render(){inputPaints++;assert.equal(typed.text,'최종 대사')}});
vm.runInContext(source('layer-panel'),inputCtx);vm.runInContext('function updateLayers(id){renderLayerList(id)}',inputCtx);inputCtx.renderLayerList();
vm.runInContext(app.slice(app.indexOf('let editorInputFrame=null;'),app.indexOf('function render(){')),inputCtx);
const listenerStart=app.indexOf('for(const key of props){$(key).addEventListener');vm.runInContext(app.slice(listenerStart,app.indexOf('\n',listenerStart)),inputCtx);
const nativeRow=inputNode('layers').children[0];for(const value of ['한','한글 조합','최종 대사']){inputNode('text').value=value;inputNode('text').listeners.input()}
assert.equal(inputPaints,0);assert.equal(nativeRow.children[1].children[1].children[1].textContent,'최종 대사');inputFrame();assert.equal(inputPaints,1);assert.equal(inputNode('layers').children[0],nativeRow);
const pageNodes=new Map(),pg=id=>{if(!pageNodes.has(id))pageNodes.set(id,new Node('div'));return pageNodes.get(id)};
const pages=vm.createContext({crypto:require('node:crypto').webcrypto,document:{createElement:t=>new Node(t)},$:pg,state:{items:[],fonts:[]},history:[],future:[],selected:null,zoom:1,refreshCustomAssets(){},projectCustomFontPool:()=>[],embeddedDocumentFonts:d=>d.fonts||[],scheduleProjectSave(){}});
vm.runInContext(source('studio'),pages);let thumbnailCalls=0;pages.pageThumbnail=()=>{thumbnailCalls++;return 'preview-'+thumbnailCalls};
vm.runInContext("const p1=makePage('첫 장',state),p2=makePage('다음 장',{items:[],fonts:[]});p2.thumbnail='keep';projectBook={activeId:p1.id,pages:[p1,p2]};",pages);
pg('pageTitle').value='첫 장';pages.refreshPages();pages.flushPage();const card=pg('pageList').children[0],cardImage=card.children[0],pageAlloc=allocations;assert.equal(thumbnailCalls,1);
for(let i=0;i<20;i++){pages.flushPage();pages.refreshPages()}assert.equal(thumbnailCalls,1,'Unchanged active page keeps its thumbnail');assert.equal(allocations,pageAlloc,'Page buttons and images are reused');
pages.markProjectDirty();pages.state.items.push({id:'t',text:'수정'});assert.equal(thumbnailCalls,1,'Typing never rasterizes a thumbnail');pages.serializableBook();assert.equal(thumbnailCalls,2);assert.equal(card.children[0],cardImage);assert.equal(cardImage.src,'preview-2');pages.serializableBook();assert.equal(thumbnailCalls,2);
pages.state={items:[{id:'restored'}],fonts:[]};pages.flushPage();assert.equal(thumbnailCalls,3,'Document replacement invalidates old thumbnail');
vm.runInContext("projectBook.pages.reverse()",pages);pages.refreshPages();assert.equal(pg('pageList').children[1],card);vm.runInContext("projectBook.pages=projectBook.pages.filter(p=>p.id===projectBook.activeId)",pages);pages.refreshPages();assert.equal(pg('pageList').children.length,1);assert.equal(pg('pageList').children[0],card);
console.log('PASS input frame coalescing, incremental names/selection/order/visibility/Undo bindings, thumbnail reuse/invalidation and stable page buttons.');
