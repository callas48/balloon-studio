'use strict';
// Run under the pinned Electron runtime, loading the actual packaged ASAR.
// Only appData and test dialogs are redirected; the packaged application is unmodified.
const {app,dialog}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'work/qa/electron'),resources=path.join(root,'release/win-unpacked/resources');
fs.mkdirSync(path.join(qa,'profile'),{recursive:true});app.setPath('appData',path.join(qa,'profile'));
Object.defineProperty(app,'isPackaged',{value:true});Object.defineProperty(process,'resourcesPath',{value:resources});
app.getVersion=()=>require('../package.json').version;
dialog.showSaveDialog=async()=>({canceled:false,filePath:path.join(qa,'native.balloon.json')});
const errors=[],downloads=[];let finished=false;
const timeout=setTimeout(()=>finish(Error('Packaged Electron smoke test timed out')),90000);
function finish(error,report){if(finished)return;finished=true;clearTimeout(timeout);const output={...(report||{}),errors,error:error?.stack||null};fs.writeFileSync(path.join(qa,'result.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));app.exit(error?1:0);}
app.on('browser-window-created',(_,win)=>{
 win.once('ready-to-show',()=>setImmediate(()=>win.hide()));
 win.webContents.on('render-process-gone',(_,details)=>finish(Error(JSON.stringify(details))));
 win.webContents.on('console-message',(_,details)=>{if(details?.level==='error')errors.push(details.message);});
 win.webContents.once('did-finish-load',async()=>{try{
  win.webContents.session.on('will-download',(_,item)=>{
   const target=path.join(qa,item.getFilename());item.setSavePath(target);
   downloads.push(new Promise((resolve,reject)=>item.once('done',(_,state)=>state==='completed'?resolve(target):reject(Error('Download '+state)))));
  });
  await new Promise(r=>setTimeout(r,1000));
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const updates=await window.balloonDesktop.getUpdateState();
   if(updates.version!=='0.3.4'||updates.configured)throw Error('Unexpected packaged version/feed');
   if([typeof saveProjectPNGZip,typeof projectBookBlob,typeof drawCensorSign,typeof initLimbus].some(t=>t!=='function'))throw Error('Missing packaged editor module');
   const book=serializableBook();
   const saved=await window.balloonDesktop.saveProject(JSON.stringify(book),'MSI 시험',false,'qa-smoke');if(!saved.ok)throw Error(JSON.stringify(saved));
   scheduleProjectSave();const autosave=await saveLocalProject(true);if(!autosave)throw Error('IndexedDB save failed');
   await saveArtwork('png',0.95);await saveProjectPNGZip();
   return{version:updates.version,configured:updates.configured,pages:book.pages.length,nativeSave:saved.ok,realIndexedDBSave:autosave,scriptCount:document.scripts.length,title:document.title};
  })()`);
  for(let i=0;i<100&&downloads.length<2;i++)await new Promise(r=>setTimeout(r,100));
  assert.equal(downloads.length,2);const files=await Promise.all(downloads);assert(files.some(f=>f.endsWith('.png')));assert(files.some(f=>f.endsWith('.zip')));
  for(const f of files){const data=fs.readFileSync(f);if(f.endsWith('.png'))assert(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));else assert.equal(data.subarray(0,2).toString(),'PK');}
  assert.equal(JSON.parse(fs.readFileSync(path.join(qa,'native.balloon.json'),'utf8')).format,'balloon-studio');
  assert.equal(errors.length,0);finish(null,{...result,downloadFiles:files.map(f=>path.basename(f)),isolatedUserData:app.getPath('userData'),verified:true});
 }catch(error){finish(error);}});
});
require(path.join(resources,'app.asar/desktop/main.cjs'));
