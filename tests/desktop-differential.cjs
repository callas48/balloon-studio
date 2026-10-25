'use strict';
// Real pinned NSIS updater + real installer blockmaps over a local HTTP Range server.
// Never installs an app and never contacts the production update service.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const {NsisUpdater}=require('electron-updater'),{NodeHttpExecutor}=require('builder-util/out/nodeHttpExecutor');
const {ElectronHttpExecutor}=require('electron-updater/out/electronHttpExecutor');
class TestHttpExecutor extends NodeHttpExecutor{download(...args){return ElectronHttpExecutor.prototype.download.apply(this,args)}}
const {consentUpdaterClass}=require('../desktop/consent-updater.cjs'),{OnceProvider}=require('../desktop/once-provider.cjs'),{UpdateController}=require('../desktop/update-controller.cjs');
(async()=>{
 const oldDir=path.resolve(process.argv[2]||'release'),newDir=path.resolve(process.argv[3]||'release');
 const oldName='Balloon-Studio-Setup-0.1.0-x64.exe',newName='Balloon-Studio-Setup-0.1.1-x64.exe';
 const oldFile=path.join(oldDir,oldName),newFile=path.join(newDir,newName),data=await fs.readFile(newFile),sha512=crypto.createHash('sha512').update(data).digest('base64');
 const routes=new Map([[oldName,oldFile],[oldName+'.blockmap',oldFile+'.blockmap'],[newName,newFile],[newName+'.blockmap',newFile+'.blockmap']]);
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'balloon-delta-'));let metadataRequests=0,installerBytes=0,fullRequests=0,rangeRequests=0;
 const server=http.createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1));
  if(name==='latest.yml'){metadataRequests++;res.setHeader('Content-Type','application/yaml');return res.end(JSON.stringify({version:'0.1.1',files:[{url:newName,sha512,size:data.length}]}))}
  const file=routes.get(name);if(!file){res.writeHead(404);return res.end()}
  const stat=await fs.stat(file);const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=stat.size-1;
  if(range){start=Number(range[1]);end=range[2]?Math.min(end,Number(range[2])):end;if(start>end){res.writeHead(416);return res.end()}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`)}
  res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
  if(name===newName){installerBytes+=end-start+1;if(range)rangeRequests++;else fullRequests++}
  sync.createReadStream(file,{start,end}).pipe(res);
 }catch{res.writeHead(500);res.end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
 const logger={info(){},warn(){},error(){},debug(){}};
 async function create(label,seed){
  const home=path.join(root,label);await fs.mkdir(home,{recursive:true});const config=path.join(home,'app-update.yml');await fs.writeFile(config,JSON.stringify({provider:'generic',url:base,updaterCacheDirName:'updater'}));
  const adapter={version:'0.1.0',name:'Balloon Studio delta test',isPackaged:true,appUpdateConfigPath:config,userDataPath:home,baseCachePath:path.join(home,'cache'),whenReady:async()=>{},onQuit(){},quit(){throw Error('This test must never install or quit')},relaunch(){throw Error('Unexpected relaunch')}};
  const Consent=consentUpdaterClass(NsisUpdater),updater=new Consent(null,adapter);updater.httpExecutor=new TestHttpExecutor();updater.logger=logger;updater.on('error',error=>{updater.testLastError=error});updater.disableWebInstaller=true;updater.setFeedURL({provider:'custom',updateProvider:OnceProvider,url:base});
  const controller=new UpdateController({updater,version:'0.1.0'});await controller.startup();await controller.startup();assert.equal(controller.state.phase,'available');
  const helper=await updater.getOrCreateDownloadHelper();await fs.mkdir(helper.cacheDir,{recursive:true});if(seed)await fs.copyFile(oldFile,path.join(helper.cacheDir,'installer.exe'));
  return {updater,controller};
 }
 try{
  // No previous installer: differential attempt must NOT silently fall back to a full EXE.
  const missing=await create('missing-cache',false);assert.equal(metadataRequests,1);assert.equal(installerBytes,0);await missing.controller.download();assert.equal(missing.controller.state.phase,'full-required');assert.equal(fullRequests,0);assert.equal(installerBytes,0);
  await missing.controller.download(true);if(missing.controller.state.phase!=='downloaded')throw missing.updater.testLastError||Error(JSON.stringify(missing.controller.state));assert.equal(fullRequests,1);assert.equal(installerBytes,data.length);assert.equal(missing.updater.autoInstallOnAppQuit,false);
  installerBytes=fullRequests=rangeRequests=0;
  // Actual old installer and actual new artifact: reconstruct exactly from HTTP changed ranges.
  const delta=await create('seeded-cache',true);assert.equal(metadataRequests,2);assert.equal(installerBytes,0);await delta.controller.download();if(delta.controller.state.phase!=='downloaded')throw delta.updater.testLastError||Error(JSON.stringify(delta.controller.state));assert.equal(fullRequests,0);assert(rangeRequests>0);assert(installerBytes<data.length,'Differential download must be smaller than full installer');
  const helper=await delta.updater.getOrCreateDownloadHelper(),downloaded=await fs.readFile(helper.file);assert(downloaded.equals(data),'Reconstructed installer must exactly match the new release');
  const report={oldVersion:'0.1.0',newVersion:'0.1.1',fullBytes:data.length,differentialBytes:installerBytes,rangeRequests,savedPercent:Math.round((1-installerBytes/data.length)*10000)/100,sha512,verified:true};
  const reportPath=path.resolve('release/differential-verification.json');await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log('PASS real NSIS differential update: '+JSON.stringify(report));
 }finally{await new Promise(resolve=>server.close(resolve));if(!path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep))throw Error('Unsafe test cleanup');await fs.rm(root,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
