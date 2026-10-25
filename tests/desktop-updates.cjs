'use strict';
const assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {UpdateController}=require('../desktop/update-controller.cjs');
const {consentUpdaterClass}=require('../desktop/consent-updater.cjs');
class Fake extends EventEmitter {
 constructor(){super();this.checks=0;this.downloads=[];this.installs=0;this.checkAction=async()=>{}}
 async checkForUpdates(){this.checks++;return this.checkAction()}
 async downloadUpdate(){this.downloads.push({full:this.fullDownloadAllowed,disabled:this.disableDifferentialDownload});if(this.downloadError)throw this.downloadError;this.emit('download-progress',{percent:50});return ['verified.exe']}
 quitAndInstall(){this.installs++}
}
const next=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 // One startup check for the process, independent of repeated startup/load events.
 let u=new Fake(),events=[],c=new UpdateController({updater:u,version:'0.1.0',notify:s=>events.push(s)});
 await Promise.all([c.startup(),c.startup(),c.startup()]);assert.equal(u.checks,1);assert.equal(events.length,0);assert.equal(u.downloads.length,0);
 await c.check(true);assert.equal(u.checks,2);assert.equal(c.state.phase,'current');
 assert.equal(u.autoDownload,false);assert.equal(u.autoInstallOnAppQuit,false);
 // Both an offline OS signal and a real DNS/network rejection remain silent.
 u=new Fake();events=[];let online=false;c=new UpdateController({updater:u,version:'0.1.0',online:()=>online,notify:s=>events.push(s)});
 await c.startup();online=true;await c.startup();assert.equal(u.checks,0);assert.deepEqual(events,[]);
 await c.check(true);assert.equal(u.checks,1);
 u=new Fake();u.checkAction=async()=>{throw Object.assign(Error('DNS failed'),{code:'ENOTFOUND'})};events=[];c=new UpdateController({updater:u,version:'0.1.0',notify:s=>events.push(s)});
 await c.startup();await c.startup();assert.equal(u.checks,1);assert.deepEqual(events,[]);assert.equal(c.state.phase,'idle');
 await c.check(true);assert.equal(c.state.phase,'unreachable');assert.equal(u.checks,2);
 // A timed-out check cannot emit a late available notification or overlap a manual request.
 u=new Fake();let finish;u.checkAction=()=>new Promise(resolve=>{finish=resolve});events=[];c=new UpdateController({updater:u,version:'0.1.0',timeoutMs:5,notify:s=>events.push(s)});
 await c.startup();await c.check(true);assert.equal(u.checks,1);u.emit('update-available',{version:'9.0.0'});finish();await next();assert.deepEqual(events,[]);assert.equal(c.state.phase,'idle');await c.startup();assert.equal(u.checks,1);
 // A new version only notifies; bytes are not downloaded until explicitly requested.
 u=new Fake();u.checkAction=async()=>{u.emit('update-available',{version:'0.2.0',releaseNotes:'수정 사항',files:[{size:1048576}]})};events=[];c=new UpdateController({updater:u,version:'0.1.0',notify:s=>events.push(s)});
 await c.startup();assert.equal(c.state.phase,'available');assert.equal(c.state.nextVersion,'0.2.0');assert.equal(u.downloads.length,0);assert.throws(()=>c.install());
 u.downloadError=Object.assign(Error('needs full'),{code:'FULL_DOWNLOAD_REQUIRED'});await c.download();assert.equal(c.state.phase,'full-required');assert.deepEqual(u.downloads,[{full:false,disabled:false}]);assert.equal(c.ready,false);
 await c.download(false);assert.equal(u.downloads.length,1);u.downloadError=null;await c.download(true);assert.deepEqual(u.downloads[1],{full:true,disabled:true});assert.equal(c.state.phase,'downloaded');assert.equal(u.installs,0);c.install();assert.equal(u.installs,1);
 // Failure and duplicate clicks cannot cause an install or implicit full download.
 u=new Fake();u.checkAction=async()=>u.emit('update-available',{version:'0.2.0'});c=new UpdateController({updater:u,version:'0.1.0'});await c.startup();u.downloadError=Error('integrity mismatch');await c.download();assert.equal(c.state.phase,'available');assert.equal(u.installs,0);assert.equal(c.ready,false);
 // Missing feed never contacts the network or raises automatic notices.
 u=new Fake();events=[];c=new UpdateController({updater:u,version:'0.1.0',configured:false,notify:s=>events.push(s)});await c.startup();assert.equal(u.checks,0);assert.deepEqual(events,[]);await c.check(true);assert.equal(c.state.phase,'unconfigured');
 // Exercise the exact subclass hook used BEFORE the library's full-download branch.
 class Base{async differentialDownloadInstaller(){return this.needsFull}}
 const Consent=consentUpdaterClass(Base),guard=new Consent();guard.needsFull=true;await assert.rejects(()=>guard.differentialDownloadInstaller(),e=>e.code==='FULL_DOWNLOAD_REQUIRED');guard.fullDownloadAllowed=true;assert.equal(await guard.differentialDownloadInstaller(),true);guard.fullDownloadAllowed=false;guard.needsFull=false;assert.equal(await guard.differentialDownloadInstaller(),false);
 const fs=require('node:fs'),source=fs.readFileSync(require.resolve('electron-updater/out/NsisUpdater.js'),'utf8');assert(source.includes('await this.differentialDownloadInstaller('),'Pinned updater hook moved; review fallback guard');
 // Real GenericProvider replacement: one request even for the library's retryable ECONNREFUSED.
 const {OnceProvider}=require('../desktop/once-provider.cjs');let requests=0;
 const provider=new OnceProvider({url:'https://updates.example.invalid/'},{isAddNoCacheQuery:false},{platform:'win32',executor:{request:async()=>{requests++;throw Object.assign(Error('refused'),{code:'ECONNREFUSED'})}}});
 await assert.rejects(()=>provider.getLatestVersion());assert.equal(requests,1);
 let aborted=false;const timeoutProvider=new OnceProvider({url:'https://updates.example.invalid/',timeoutMs:5},{isAddNoCacheQuery:false},{platform:'win32',executor:{request:async(options,token)=>token.createPromise((resolve,reject,onCancel)=>onCancel(()=>{aborted=true}))}});
 await assert.rejects(()=>timeoutProvider.getLatestVersion());assert(aborted,'Timeout must cancel the actual request');
 console.log('PASS desktop updates: once per launch, no auto-download/retry/install, silent offline/DNS/timeout/late results, manual checks, explicit full fallback and pinned NSIS hook');
})().catch(error=>{console.error(error);process.exitCode=1});
