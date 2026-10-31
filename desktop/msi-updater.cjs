'use strict';
const {EventEmitter}=require('node:events'),fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const semver=require('semver'),{CancellationToken}=require('builder-util-runtime');
const {GenericDifferentialDownloader}=require('electron-updater/out/differentialDownloader/GenericDifferentialDownloader');
const {guardExecutor}=require('./msi-transport.cjs');
const validName=name=>typeof name==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(name)&&!name.includes('..');
function artifact(value){
 if(!value||!validName(value.url)||!value.url.endsWith('.msi')||!Number.isSafeInteger(value.size)||value.size<1||value.size>4*1024**3||!/^[-A-Za-z0-9+/]{86}==$/.test(value.sha512||''))throw Error('MSI 업데이트 파일 정보가 올바르지 않습니다.');
 const map=value.blockmap;if(!map||!validName(map.url)||!Number.isSafeInteger(map.size)||map.size<1||map.size>8*1024**2||!/^[a-f0-9]{64}$/.test(map.sha256||''))throw Error('MSI 블록맵 정보가 올바르지 않습니다.');return value;
}
function metadata(value){
 if(!value||value.schema!==1||!/^\d{1,3}\.\d{1,3}\.\d{1,5}$/.test(value.version)||!semver.valid(value.version)||!Array.isArray(value.files)||value.files.length!==1||!Array.isArray(value.bases)||value.bases.length>8)throw Error('MSI 업데이트 메타데이터가 올바르지 않습니다.');
 artifact(value.files[0]);for(const base of value.bases){if(!semver.valid(base.version))throw Error('기준 버전이 올바르지 않습니다.');artifact(base);}return value;
}
async function matches(filename,info){try{if((await fs.stat(filename)).size!==info.size)return false;const digest=crypto.createHash('sha512');for await(const chunk of sync.createReadStream(filename))digest.update(chunk);return digest.digest('base64')===info.sha512;}catch{return false;}}
class MsiUpdater extends EventEmitter{
 constructor({version,url,cacheDir,request,executor,findSource=async()=>null,install=async()=>{},allowHttp=false,timeoutMs=10000}){
  super();this.version=version;this.base=new URL(url.endsWith('/')?url:url+'/');
  if(this.base.username||this.base.password||this.base.search||this.base.hash||(this.base.protocol!=='https:'&&!(allowHttp&&this.base.protocol==='http:'&&['127.0.0.1','localhost'].includes(this.base.hostname))))throw Error('업데이트 주소는 HTTPS여야 합니다.');
  Object.assign(this,{cacheDir,request,executor:guardExecutor(executor,this.base),findSource,launchInstall:install,timeoutMs});this.autoDownload=false;this.autoInstallOnAppQuit=false;this.fullDownloadAllowed=false;this.disableDifferentialDownload=false;this.readyFile=null;
 }
 async bytes(name,limit,timeoutMs=this.timeoutMs){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await this.request(new URL(name,this.base).href,{signal:controller.signal,redirect:'error',cache:'no-store'});
   if(!response.ok)throw Error('업데이트 서버 응답을 확인하지 못했습니다.');
   if(Number(response.headers.get('content-length'))>limit)throw Error('업데이트 정보가 너무 큽니다.');
   const reader=response.body.getReader(),chunks=[];let length=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('업데이트 정보가 너무 큽니다.');chunks.push(Buffer.from(value));}}catch(e){await reader.cancel().catch(()=>{});throw e;}return Buffer.concat(chunks);
  }finally{clearTimeout(timer);}
 }
 async checkForUpdates(){
  // Exactly one metadata request; no automatic download, retry, or source scan.
  const info=metadata(JSON.parse((await this.bytes('latest-msi.json',256*1024)).toString('utf8')));
  if(semver.gt(info.version,this.version)){this.info=info;this.emit('update-available',info);}return{updateInfo:info};
 }
 file(info,version){return path.join(this.cacheDir,version,info.url);}
 async map(info){
  const bytes=await this.bytes(info.blockmap.url,info.blockmap.size);
  if(bytes.length!==info.blockmap.size||crypto.createHash('sha256').update(bytes).digest('hex')!==info.blockmap.sha256)throw Error('블록맵 검증에 실패했습니다.');
  const map=JSON.parse(zlib.gunzipSync(bytes,{maxOutputLength:32*1024**2}));
  if(map.version!=='2'||!Array.isArray(map.files))throw Error('지원하지 않는 블록맵입니다.');return map;
 }
 async downloadUpdate(){
  if(!this.info)throw Error('먼저 새 버전을 확인해주세요.');
  const info=this.info.files[0],target=this.file(info,this.info.version),temporary=target+'.'+crypto.randomUUID()+'.partial';await fs.mkdir(path.dirname(target),{recursive:true});
  if(await matches(target,info)){this.readyFile=target;return[target];}
  this.executor.expectedInstallerSize=info.size;
  const token=new CancellationToken(),timer=setTimeout(()=>token.cancel(),20*60*1000);
  try{
   if(this.disableDifferentialDownload&&this.fullDownloadAllowed){
    await this.executor.download(new URL(info.url,this.base),temporary,{cancellationToken:token,sha512:info.sha512,onProgress:p=>this.emit('download-progress',p)});
   }else{
    try{
     const base=this.info.bases.find(b=>b.version===this.version);if(!base)throw Error('기준 MSI 정보가 없습니다.');
     let oldFile=this.file(base,this.version);
     if(!await matches(oldFile,base)){const source=await this.findSource();if(!source||!await matches(source,base))throw Error('기준 MSI 캐시가 없습니다.');await fs.mkdir(path.dirname(oldFile),{recursive:true});await fs.copyFile(source,oldFile);}
     const oldMap=await this.map(base),newMap=await this.map(info);
     await new GenericDifferentialDownloader(info,this.executor,{newUrl:new URL(info.url,this.base),oldFile,newFile:temporary,isUseMultipleRangeRequest:false,logger:{info(){},warn(){},error(){},debug:null},cancellationToken:token,onProgress:p=>this.emit('download-progress',p)}).download(oldMap,newMap);
    }catch(cause){const error=Error('변경분 다운로드를 사용할 수 없어 전체 MSI 다운로드가 필요합니다.',{cause});error.code='FULL_DOWNLOAD_REQUIRED';throw error;}
   }
   if(!await matches(temporary,info))throw Error('다운로드한 MSI의 크기 또는 해시가 일치하지 않습니다.');
   // Retain the complete source MSI for the next differential update and MSI repair.
   await fs.rm(target,{force:true});await fs.rename(temporary,target);this.readyFile=target;return[target];
  }finally{clearTimeout(timer);await fs.rm(temporary,{force:true}).catch(()=>{});}
 }
 async quitAndInstall(){
  if(!this.readyFile||!this.info||!await matches(this.readyFile,this.info.files[0]))throw Error('검증된 MSI 업데이트가 준비되지 않았습니다.');
  return this.launchInstall({filename:this.readyFile,sha512:this.info.files[0].sha512,version:this.info.version});
 }
}
module.exports={MsiUpdater,metadata,matches};
