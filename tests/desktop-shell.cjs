'use strict';
// Real main-process handlers with isolated Electron surfaces and real temp filesystem writes.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{EventEmitter}=require('node:events'),{fileURLToPath}=require('node:url');
const {UpdateController}=require('../desktop/update-controller.cjs');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'balloon-shell-'));let win,controller,permission,permissionCheck,protocolHandler,schemeConfig,installed=0,saveDialogs=0;
 const handlers=new Map(),paths=new Map([['appData',root]]),app=new EventEmitter(),dialogResults=[];
 Object.assign(app,{isPackaged:false,setAppUserModelId(){},getPath:name=>paths.get(name),setPath:(name,value)=>paths.set(name,value),requestSingleInstanceLock:()=>true,whenReady:async()=>{},getVersion:()=> '0.1.1',quit(){}});
 class Window extends EventEmitter{
  constructor(options){super();this.options=options;win=this;this.webContents=new EventEmitter();Object.assign(this.webContents,{mainFrame:{url:'studio://app/index.html'},send(){},setWindowOpenHandler:fn=>this.openHandler=fn});}
  isDestroyed(){return false}show(){this.shown=true}isVisible(){return !!this.shown}async loadURL(url){this.loadedURL=url;this.emit('ready-to-show');this.webContents.emit('did-finish-load')}isMinimized(){return false}focus(){}
 }
 const electron={app,BrowserWindow:Window,protocol:{registerSchemesAsPrivileged:schemes=>schemeConfig=schemes,handle:(scheme,fn)=>protocolHandler=fn},net:{isOnline:()=>false,fetch:async url=>new Response(await fs.readFile(fileURLToPath(url)))},
  ipcMain:{handle:(channel,fn)=>handlers.set(channel,fn)},dialog:{showOpenDialog:async()=>dialogResults.shift(),showSaveDialog:async()=>{saveDialogs++;return dialogResults.shift()},showMessageBoxSync:()=>0},
  Menu:{buildFromTemplate:items=>items,setApplicationMenu(){}},shell:{openExternal:async()=>{},openPath:async()=>{}},session:{defaultSession:{setPermissionRequestHandler:fn=>permission=fn,setPermissionCheckHandler:fn=>permissionCheck=fn}}};
 const source=sync.readFileSync('desktop/main.cjs','utf8'),requireMain=name=>{
  if(name==='electron')return electron;if(name==='./update-feed.json')return{url:null};
  if(name==='./update-controller.cjs')return{UpdateController:class extends UpdateController{constructor(options){super(options);controller=this;this.updater.quitAndInstall=()=>installed++}}};
  if(name.startsWith('./'))return require(path.resolve('desktop',name));return require(name);
 };
 try{
  vm.runInNewContext(source,{require:requireMain,__dirname:path.resolve('desktop'),process,console,Response,Headers,URL,setTimeout,clearTimeout});
  for(let i=0;i<10&&!win?.loadedURL;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(win.loadedURL,'studio://app/index.html');assert.equal(win.options.webPreferences.nodeIntegration,false);assert.equal(win.options.webPreferences.contextIsolation,true);assert.equal(win.options.webPreferences.sandbox,true);assert.equal(win.options.webPreferences.webSecurity,true);assert.equal(schemeConfig[0].privileges.secure,true);
  let permitted=true;permission(null,'notifications',value=>permitted=value);assert.equal(permitted,false);assert.equal(permissionCheck(),false);
  const event={sender:win.webContents,senderFrame:win.webContents.mainFrame},call=(channel,value)=>handlers.get(channel)(event,value);
  await assert.rejects(()=>handlers.get('studio:update-state')({...event,senderFrame:{url:event.senderFrame.url}}),'Subframes must not access native operations');
  await assert.rejects(()=>handlers.get('studio:update-state')({...event,sender:{}}),'Other web contents must not access native operations');
  assert.equal(controller.startupChecked,true);win.webContents.emit('did-finish-load');assert.equal(controller.startupChecked,true);assert.equal(controller.state.phase,'idle');
  const html=await protocolHandler({url:'studio://app/',method:'GET'});assert.equal(html.status,200);assert(html.headers.get('content-security-policy').includes("object-src 'none'"));assert((await html.text()).includes('desktop-client.js'));
  assert.deepEqual(await(await protocolHandler({url:'studio://app/api/shared-assets',method:'GET'})).json(),{assets:[]});assert.equal((await protocolHandler({url:'studio://evil/index.html',method:'GET'})).status,404);
  const first=path.join(root,'첫 번째.balloon.json'),second=path.join(root,'두 번째.balloon.json'),book=JSON.stringify({format:'balloon-studio',version:3,pages:[{id:'one',name:'첫 장',doc:{}}]});
  dialogResults.push({canceled:false,filePath:first},{canceled:false,filePath:second});
  assert((await call('studio:save-project',{documentId:'one',name:'first',text:book})).ok);
  assert((await call('studio:save-project',{documentId:'two',name:'second',text:book})).ok);assert.equal(saveDialogs,2,'A new document must not overwrite the previous file');
  assert((await call('studio:save-project',{documentId:'one',text:book.replace('첫 장','수정')})).ok);assert.equal(saveDialogs,2);assert((await fs.readFile(first,'utf8')).includes('수정'));assert.equal(await fs.readFile(second,'utf8'),book);
  dialogResults.push({canceled:false,filePaths:[second]});const opened=await call('studio:open-project');assert(opened.ok);assert((await call('studio:claim-project',{documentId:'three',token:opened.token})).ok);assert((await call('studio:save-project',{documentId:'three',text:book})).ok);assert.equal(saveDialogs,2);
  assert.equal((await call('studio:update-install','forged')).ok,false);assert.equal(installed,0);
  assert.equal((await call('studio:update-backup',book)).ok,false,'No recovery/install path before a verified download');
  controller.ready=true;const backup=await call('studio:update-backup',book);assert(backup.ok);assert.equal((await call('studio:update-install','forged')).ok,false);assert.equal(installed,0);assert((await call('studio:update-install',backup.token)).ok);assert.equal(installed,1);
  const recovery=path.join(paths.get('userData'),'update-recovery'),files=await fs.readdir(recovery);assert.equal(await fs.readFile(path.join(recovery,files[0]),'utf8'),book);
  console.log('PASS desktop shell: local protocol/CSP, isolated renderer and permissions, trusted IPC only, independent document save paths, open/claim, durable recovery and verified install gate');
 }finally{if(!path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep))throw Error('Unsafe cleanup');await fs.rm(root,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
