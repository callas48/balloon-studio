'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/desktop-client.js','utf8');
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.style={};this.hidden=false;this.disabled=false;this.textContent='';this.open=false;this.value=''}
 append(...children){this.children.push(...children)}setAttribute(){}showModal(){this.open=true}close(){this.open=false}
}
function environment(online=true){
 const head=new Element('head'),body=new Element('body'),menu=new Element('div'),ids=new Map();
 for(const id of ['title','projectMore','saveProject','openProject','installStudio','visitorStats'])ids.set(id,new Element('button'));ids.get('title').value='테스트 만화';
 const calls=[],listeners=new Map();let updateListener,commandListener;
 const initial={phase:'idle',version:'0.1.1',configured:true};
 const api={getUpdateState:async()=>initial,onUpdate:fn=>updateListener=fn,onCommand:fn=>commandListener=fn,
  checkUpdates:async()=>{calls.push('check');return initial},downloadUpdate:async full=>{calls.push('download:'+full);const state={...initial,phase:full?'downloaded':'full-required',nextVersion:'0.1.2',size:1048576};updateListener(state);return state},
  saveProject:async()=>{calls.push('save');return{ok:true,name:'테스트.balloon.json'}},backupBeforeUpdate:async()=>{calls.push('backup');return{ok:true,token:'saved'}},installUpdate:async()=>{calls.push('install');return{ok:true}},openProject:async()=>({ok:false,canceled:true}),claimProject:async()=>{calls.push('claim');return{ok:true}}};
 const state={console,File,window:{balloonDesktop:api,addEventListener:(name,fn)=>listeners.set(name,fn)},navigator:{onLine:online},document:{head,body,readyState:'complete',createElement:tag=>new Element(tag),querySelector:selector=>selector==='#projectMore .project-menu'?menu:null},
  $:id=>ids.get(id),projectBusy:false,projectDirty:true,localProjectId:'doc-one',localChanges:1,localSaved:0,
  localSaveInteractionActive:()=>false,serializableBook:()=>({format:'balloon-studio',version:3,pages:[{id:'one',doc:{}}]}),setProjectBusy:value=>state.projectBusy=value,
  saveLocalProject:async()=>{calls.push('local-save');state.localSaved=state.localChanges;return true},status:text=>calls.push('status:'+text),openBookFile:async()=>false};
 vm.runInNewContext(source,state);return{state,api,calls,body,menu,listeners,update:info=>updateListener({...initial,...info}),command:name=>commandListener(name),ids};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 // Web build: no native API means no changes and no requests at all.
 vm.runInNewContext(source,{window:{}});
 let e=environment();await tick();const notice=e.body.children[0],panel=e.body.children[1],actions=panel.children[5],download=actions.children[1],install=actions.children[2];
 assert.equal(notice.style.display,'none');assert.equal(e.calls.length,0);assert.deepEqual([...e.listeners.keys()],['offline']);
 e.update({phase:'available',nextVersion:'0.1.2'});assert.equal(notice.style.display,'flex');assert.equal(e.calls.length,0,'Availability must not download automatically');
 notice.children[1].onclick();await tick();assert(e.calls.includes('download:false'));assert.equal(panel.open,true);assert.equal(download.textContent,'전체 파일 다운로드 (1.0 MB)');assert(!e.calls.includes('download:true'));
 await download.onclick();assert(e.calls.includes('download:true'));assert.equal(install.hidden,false);assert(!e.calls.includes('install'));
 e.calls.length=0;await install.onclick();assert.deepEqual(e.calls.filter(c=>!c.startsWith('status:')),['save','backup','local-save','install']);assert.equal(e.state.projectBusy,false);
 // Cancelled disk save, failed recovery save and failed IndexedDB save all block installation.
 for(const failure of ['save','backup','local-save']){
  e=environment();await tick();const p=e.body.children[1],button=p.children[5].children[2];e.update({phase:'downloaded'});
  if(failure==='save')e.api.saveProject=async()=>({ok:false,canceled:true});
  if(failure==='backup')e.api.backupBeforeUpdate=async()=>({ok:false,message:'Disk full'});
  if(failure==='local-save')e.state.saveLocalProject=async()=>false;
  await button.onclick();assert(!e.calls.includes('install'),failure);assert.equal(e.state.projectBusy,false);
 }
 // Edits arriving while the native save dialog is open must not be lost on update.
 e=environment();await tick();e.api.saveProject=async()=>{e.state.localChanges++;return{ok:true,name:'old-snapshot.json'}};e.update({phase:'downloaded'});await e.body.children[1].children[5].children[2].onclick();assert(!e.calls.includes('install'));assert(!e.calls.includes('backup'));
 // Offline state does not raise an automatic banner, even for stale available data.
 e=environment(false);await tick();e.update({phase:'available',nextVersion:'0.1.2'});assert.equal(e.body.children[0].style.display,'none');assert.equal(e.calls.length,0);
 console.log('PASS desktop client: unchanged web mode, no automatic requests/downloads, explicit full selection, save/recovery/IDB ordering, all failure gates, edit races and silent offline UI');
})().catch(error=>{console.error(error);process.exitCode=1});
