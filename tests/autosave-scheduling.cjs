const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/autosave.js','utf8');
function setup(){
 let now=0,next=0;const timers=new Map(),events={},win={},nodes=new Map(),records=[];
 const get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:{toggle(){}},disabled:false});return nodes.get(id)};
 class Clock extends Date{static now(){return now}}
 const s=vm.createContext({Date:Clock,crypto:require('node:crypto').webcrypto,structuredClone,$:get,projectBusy:false,projectDirty:true,drag:null,retouchDrag:null,document:{addEventListener:(t,f)=>events[t]=f,querySelector:()=>null,visibilityState:'visible'},window:{addEventListener:(t,f)=>win[t]=f},setTimeout:(f,ms)=>{timers.set(++next,{f,at:now+ms});return next},clearTimeout:id=>timers.delete(id),activePage:()=>({thumbnail:'preview'}),serializableBook:()=>({title:'테스트',pages:[{id:'p',doc:{items:[{text:'원문'}],fonts:[{id:'custom',data:'font-bytes'}]}}]}),setProjectBusy:v=>s.projectBusy=v,status(){}});
 vm.runInContext(source.slice(0,source.lastIndexOf('initProjectStorage();')),s);
 s.writeLocal=async(record,expected)=>{records.push({record,expected})};s.readLocal=async()=>[];s.initProjectStorage();
 const run=code=>vm.runInContext(code,s);
 async function advance(ms){const target=now+ms;for(;;){const jobs=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at);if(!jobs.length)break;const [id,t]=jobs[0];timers.delete(id);now=t.at;await t.f();await Promise.resolve()}now=target;await Promise.resolve()}
 return {s,run,records,get,events,win,timers,advance,setNow:v=>{now=v},now:()=>now};
}
(async()=>{
 let c=setup();c.s.scheduleProjectSave();await c.advance(1500);assert.equal(c.records.length,0);await c.advance(18499);assert.equal(c.records.length,0);await c.advance(1);assert.equal(c.records.length,1);assert.equal(c.records[0].expected,0);assert.equal(c.run('localSaved'),1);assert.equal(c.s.projectDirty,false);assert.equal(c.timers.size,0);
 c=setup();c.s.scheduleProjectSave();await c.advance(19000);c.s.scheduleProjectSave();await c.advance(19999);assert.equal(c.records.length,0);await c.advance(1);assert.equal(c.records.length,1,'20 seconds counts from latest edit');
 c=setup();c.s.scheduleProjectSave();for(let i=0;i<11;i++){await c.advance(5000);c.s.scheduleProjectSave()}await c.advance(4999);assert.equal(c.records.length,0);await c.advance(1);assert.equal(c.records.length,1,'Continuous edits cannot move the first deadline past 60 seconds');assert.equal(c.records[0].record.book.pages[0].doc.fonts[0].data,'font-bytes');
 for(const interaction of ['pointer','composition','drag','imageLayerDrag','panelDrag','objectRotationDrag','textCornerDrag','protrusionDrag','viewGesture','busy']){
  c=setup();c.s.scheduleProjectSave();if(interaction==='pointer')c.events.pointerdown({pointerId:7});else if(interaction==='composition')c.events.compositionstart();else if(interaction==='busy')c.s.projectBusy=true;else c.s[interaction]={};
  await c.advance(21000);assert.equal(c.records.length,0,interaction+' defers save');
  if(interaction==='pointer')c.events.pointerup({pointerId:7});else if(interaction==='composition')c.events.compositionend();else if(interaction==='busy')c.s.projectBusy=false;else c.s[interaction]=null;
  await c.advance(500);assert.equal(c.records.length,1,interaction+' saves once safe');
 }
 c=setup();c.s.scheduleProjectSave();c.events.pointerdown({pointerId:9});c.events.compositionstart();await c.advance(21000);c.win.blur();await c.advance(500);assert.equal(c.records.length,1,'Lost focus releases stale gesture guards');
 c=setup();c.s.scheduleProjectSave();await c.s.saveLocalProject(true);assert.equal(c.records.length,1,'Explicit save is immediate');assert.equal(c.timers.size,0);
 c=setup();c.s.scheduleProjectSave();c.s.document.visibilityState='hidden';c.events.visibilitychange();await Promise.resolve();await Promise.resolve();assert.equal(c.records.length,1,'Hidden tab attempts an early save');
 c=setup();c.s.scheduleProjectSave();let release;c.s.writeLocal=(record,expected)=>{c.records.push({record,expected});return new Promise(resolve=>release=resolve)};
 const pending=c.s.saveLocalProject();await Promise.resolve();assert.equal(c.records.length,1);c.setNow(1000);c.s.scheduleProjectSave();assert.equal(c.run('localSaved'),0);release();await pending;assert.equal(c.run('localSaved'),1);assert.equal(c.run('localChanges'),2);assert.equal(c.s.projectDirty,true);assert.equal(c.run('localDirtySince'),1000);
 c.s.writeLocal=async(record,expected)=>{c.records.push({record,expected})};await c.advance(19999);assert.equal(c.records.length,1);await c.advance(1);assert.equal(c.records.length,2);assert.equal(c.records[1].expected,1);assert.equal(c.run('localSaved'),2);
 c=setup();c.s.scheduleProjectSave();c.s.writeLocal=async()=>{throw Error('다른 탭에서 변경된 프로젝트입니다.')};await c.advance(20000);assert.equal(c.run('localSaved'),0);assert(c.s.projectDirty);assert(c.get('autosaveStatus').textContent.includes('실패'));assert(c.get('localProjectMessage').textContent.includes('다른 탭'));assert.equal(c.timers.size,0);
 c.s.writeLocal=async(record,expected)=>{c.records.push({record,expected})};await c.get('retryAutosave').onclick();assert.equal(c.records.length,1,'Manual retry preserves revision and saves immediately');assert.equal(c.records[0].expected,0);
 c=setup();c.s.scheduleProjectSave();c.s.resetLocalIdentity('new',4);await c.advance(70000);assert.equal(c.records.length,0);assert.equal(c.run('localRevision'),4);c.s.scheduleProjectSave();await c.advance(20000);assert.equal(c.records[0].record.id,'new');assert.equal(c.records[0].expected,4);
 c=setup();c.s.scheduleProjectSave();let done;c.s.writeLocal=()=>new Promise(resolve=>done=resolve);const save=c.s.saveLocalProject();await Promise.resolve();const id=c.run('localProjectId');c.s.resetLocalIdentity(id,8);done();await save;assert.equal(c.run('localRevision'),8,'Old in-flight saves cannot overwrite a newly opened identity, even with the same id');
 console.log('PASS autosave: 20s idle / 60s maximum deadline, IME and pointer/drag deferral, forced/lifecycle save, in-flight edits, revision/conflict/failure and identity reset.');
})().catch(e=>{console.error(e);process.exitCode=1});
