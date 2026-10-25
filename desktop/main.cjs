'use strict';
const {app,BrowserWindow,protocol,net,ipcMain,dialog,Menu,shell,session}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url'),{EventEmitter}=require('node:events');
const {UpdateController}=require('./update-controller.cjs');
const {atomicWrite,readProject,localAsset}=require('./files.cjs');
const {consentUpdaterClass}=require('./consent-updater.cjs');
const {OnceProvider}=require('./once-provider.cjs');
const feed=require('./update-feed.json');
const ORIGIN='studio://app';
protocol.registerSchemesAsPrivileged([{scheme:'studio',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.setAppUserModelId('kr.balloonstudio.desktop');
// This identity and origin stay stable across releases, preserving local projects/fonts.
app.setPath('userData',path.join(app.getPath('appData'),'BalloonStudio'));
if(!app.requestSingleInstanceLock()){app.quit()}else app.whenReady().then(start).catch(error=>{console.error('Startup failed:',error.code||error.name);app.quit()});
let window,updates,recovery=null;const documentPaths=new Map(),openedFiles=new Map();
function trusted(event){return window&&!window.isDestroyed()&&event.sender===window.webContents&&event.senderFrame===window.webContents.mainFrame&&new URL(event.senderFrame.url).origin===new URL(ORIGIN).origin&&event.senderFrame.url.startsWith(ORIGIN+'/')}
function handle(channel,callback){ipcMain.handle(channel,async(event,input)=>{if(!trusted(event))throw Error('허용되지 않은 요청입니다.');try{return await callback(input)}catch(error){return{ok:false,message:error.code==='ENOSPC'?'저장 공간이 부족합니다.':error.message||'처리하지 못했습니다.'}}})}
function documentId(value){if(typeof value!=='string'||!value||value.length>128)throw Error('문서가 올바르지 않습니다.');return value}
async function start(){
 const assets=app.isPackaged?path.join(process.resourcesPath,'editor'):path.join(__dirname,'../public');
 protocol.handle('studio',async request=>{
  const url=new URL(request.url);
  if(url.host!=='app')return new Response('Not found',{status:404});
  if(url.pathname.startsWith('/api/')){
   const json=body=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
   if(url.pathname==='/api/shared-assets/session'&&request.method==='GET')return json({owner:false});
   if(url.pathname==='/api/shared-assets'&&request.method==='GET')return json({assets:[]});
   if(url.pathname==='/api/analytics/visit'&&request.method==='POST')return new Response(null,{status:204});
   return new Response('Local editor',{status:503});
  }
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  try{
   const file=await localAsset(assets,request.url);if(!file)return new Response(null,{status:404});
   const response=await net.fetch(pathToFileURL(file).href),headers=new Headers(response.headers);
   headers.set('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' data: blob:; object-src 'none'; frame-src 'none'; base-uri 'self'");
   return new Response(response.body,{status:response.status,headers});
  }catch{return new Response(null,{status:404})}
 });
 session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 window=new BrowserWindow({width:1360,height:940,minWidth:900,minHeight:650,title:'말풍선 공방',icon:path.join(assets,'icons/studio-192.png'),show:false,
  webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 window.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//i.test(url))shell.openExternal(url).catch(()=>{});return{action:'deny'}});
 window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(ORIGIN+'/'))event.preventDefault()});
 window.webContents.on('will-attach-webview',event=>event.preventDefault());
 window.webContents.on('will-prevent-unload',event=>{
  const choice=dialog.showMessageBoxSync(window,{type:'question',buttons:['계속 편집','저장하지 않고 닫기'],defaultId:0,cancelId:0,message:'저장하지 않은 변경 사항이 있습니다.'});
  if(choice===1)event.preventDefault();
 });
 window.once('ready-to-show',()=>window.show());
 let updater=new EventEmitter(),configured=false;
 if(feed.url){
  const url=new URL(feed.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('업데이트 주소는 HTTPS여야 합니다.');
  const ConsentUpdater=consentUpdaterClass(require('electron-updater').NsisUpdater);
  updater=new ConsentUpdater({provider:'custom',updateProvider:OnceProvider,url:url.href});updater.disableWebInstaller=true;
  configured=app.isPackaged;
 }
 updates=new UpdateController({updater,version:app.getVersion(),configured,online:()=>net.isOnline(),notify:state=>{if(window&&!window.isDestroyed())window.webContents.send('studio:update-state',state)}});
 handle('studio:update-state',()=>updates.snapshot());
 handle('studio:update-check',()=>updates.check(true));
 handle('studio:update-download',full=>updates.download(full===true));
 handle('studio:open-project',async()=>{
  const result=await dialog.showOpenDialog(window,{properties:['openFile'],filters:[{name:'공방 프로젝트',extensions:['json']}]});if(result.canceled)return{ok:false,canceled:true};
  const filename=result.filePaths[0],text=await readProject(filename),token=crypto.randomUUID();openedFiles.clear();openedFiles.set(token,filename);return{ok:true,text,name:path.basename(filename),token};
 });
 handle('studio:claim-project',input=>{const id=documentId(input?.documentId),filename=openedFiles.get(input?.token);if(!filename)throw Error('열린 파일을 확인하지 못했습니다.');documentPaths.set(id,filename);openedFiles.delete(input.token);return{ok:true}});
 handle('studio:save-project',async input=>{
  const id=documentId(input?.documentId);let filename=!input.saveAs&&documentPaths.get(id);
  if(!filename){const name=typeof input.name==='string'?input.name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,100):'만화';const result=await dialog.showSaveDialog(window,{defaultPath:(name||'만화')+'.balloon.json',filters:[{name:'공방 프로젝트',extensions:['json']}],properties:['showOverwriteConfirmation','createDirectory']});if(result.canceled)return{ok:false,canceled:true};filename=result.filePath}
  await atomicWrite(filename,input.text);documentPaths.set(id,filename);return{ok:true,name:path.basename(filename)};
 });
 handle('studio:update-backup',async text=>{
  if(!updates.ready)throw Error('업데이트가 아직 준비되지 않았습니다.');
  const directory=path.join(app.getPath('userData'),'update-recovery');await fs.mkdir(directory,{recursive:true});
  const token=crypto.randomUUID(),filename=path.join(directory,'project-'+Date.now()+'.balloon.json');await atomicWrite(filename,text);recovery={token,filename};return{ok:true,token};
 });
 handle('studio:update-install',async token=>{
  if(!recovery||token!==recovery.token)throw Error('현재 작업을 먼저 저장해주세요.');await readProject(recovery.filename);
  updates.install();return{ok:true};
 });
 const command=name=>{if(window&&!window.isDestroyed())window.webContents.send('studio:command',name)};
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'파일',submenu:[{label:'프로젝트 열기',accelerator:'CmdOrCtrl+O',click:()=>command('open')},{label:'프로젝트 저장',accelerator:'CmdOrCtrl+S',click:()=>command('save')},{label:'다른 이름으로 저장',accelerator:'CmdOrCtrl+Shift+S',click:()=>command('save-as')},{type:'separator'},{role:'quit',label:'종료'}]},
  {label:'편집',submenu:[{role:'cut',label:'잘라내기'},{role:'copy',label:'복사'},{role:'paste',label:'붙여넣기'},{role:'selectAll',label:'모두 선택'}]},
  {label:'보기',submenu:[{role:'togglefullscreen',label:'전체 화면'},{role:'resetZoom',label:'기본 배율'},{role:'zoomIn',label:'확대'},{role:'zoomOut',label:'축소'}]},
  {label:'도움말',submenu:[{label:'업데이트 확인',click:()=>command('updates')},{label:'복구 저장본 폴더 열기',click:()=>shell.openPath(path.join(app.getPath('userData'),'update-recovery'))}]}
 ]));
 window.webContents.on('did-finish-load',()=>{void updates.startup()}); // No timer, focus, online, or resume listeners.
 await window.loadURL(ORIGIN+'/index.html');
}
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus()}});
app.on('window-all-closed',()=>app.quit());
