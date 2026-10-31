'use strict';
class UpdateController {
 constructor({updater,version,configured=true,online=()=>true,notify=()=>{},timeoutMs=10000}){
  this.updater=updater;this.online=online;this.notify=notify;this.configured=configured;this.timeoutMs=timeoutMs;
  this.startupChecked=false;this.pending=null;this.busy=false;this.ready=false;
  this.state={phase:'idle',version,configured};
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;
  // v7+ uses autoInstallEvent; pinning v6 does not justify installing on quit.
  updater.on('error',()=>{}); // Check failures are reported only inside an explicit manual check.
  updater.on('download-progress',p=>{if(this.busy)this.set({phase:'downloading',percent:Math.max(0,Math.min(100,p.percent||0))})});
 }
 snapshot(){return {...this.state}}
 set(values){this.state={...this.state,...values};this.notify(this.snapshot())}
 async startup(){if(this.startupChecked)return this.snapshot();this.startupChecked=true;return this.check(false)}
 async check(manual=true){
  if(this.pending||this.busy||this.ready)return this.snapshot();
  if(!this.configured){if(manual)this.set({phase:'unconfigured',message:'업데이트 배포 주소가 아직 연결되지 않았습니다.'});return this.snapshot()}
  if(!this.online()){if(manual)this.set({phase:'unreachable',message:'지금은 업데이트를 확인할 수 없습니다. 편집은 계속할 수 있습니다.'});return this.snapshot()}
  const previous=this.snapshot();let available=null,timer,expired=false;
  const onAvailable=info=>{if(!expired)available=info};
  this.updater.on('update-available',onAvailable);
  const pending=Promise.resolve().then(()=>this.updater.checkForUpdates());this.pending=pending;
  if(manual)this.set({phase:'checking',message:'새 버전을 확인하고 있습니다.'});
  try{
   await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('timeout'))},this.timeoutMs)})]);
   if(available&&this.online()){
    const notes=typeof available.releaseNotes==='string'?available.releaseNotes:Array.isArray(available.releaseNotes)?available.releaseNotes.map(n=>n.note||'').join('\n'):'';
    this.set({phase:'available',nextVersion:available.version,notes:notes.slice(0,10000),size:available.files?.[0]?.size||0,message:'새 버전이 있습니다.'});
   }else if(manual)this.set({phase:'current',message:'최신 버전을 사용하고 있습니다.'});
  }catch{
   expired=true;
   if(manual)this.set({phase:'unreachable',message:'지금은 업데이트를 확인할 수 없습니다. 편집은 계속할 수 있습니다.'});
   else this.state=previous; // No toast, popup, notification, or background retry.
  }finally{
   clearTimeout(timer);expired=true;this.updater.removeListener('update-available',onAvailable);
   // A timed-out transport may still complete later. Never overlap it or surface its late result.
   pending.finally(()=>{if(this.pending===pending)this.pending=null}).catch(()=>{});
  }
  return this.snapshot();
 }
 async download(full=false){
  if(this.busy||!['available','full-required'].includes(this.state.phase))return this.snapshot();
  if(this.state.phase==='full-required'&&!full)return this.snapshot();
  this.busy=true;this.updater.fullDownloadAllowed=full;this.updater.disableDifferentialDownload=full;
  this.set({phase:'downloading',percent:0,message:'업데이트를 다운로드하고 있습니다.'});
  try{await this.updater.downloadUpdate();this.ready=true;this.set({phase:'downloaded',percent:100,message:'저장 후 새 버전을 설치할 수 있습니다.'})}
  catch(error){
   if(error.code==='FULL_DOWNLOAD_REQUIRED')this.set({phase:'full-required',message:'변경분 다운로드를 사용할 수 없어 전체 파일 다운로드가 필요합니다.'});
   else this.set({phase:'available',message:'다운로드하지 못했습니다. 현재 버전으로 계속 사용할 수 있습니다.'});
  }finally{this.busy=false;this.updater.fullDownloadAllowed=false;this.updater.disableDifferentialDownload=false}
  return this.snapshot();
 }
 install(){if(!this.ready||this.busy)throw Error('검증된 업데이트가 준비되지 않았습니다.');return this.updater.quitAndInstall(false,true)}
}
module.exports={UpdateController};
