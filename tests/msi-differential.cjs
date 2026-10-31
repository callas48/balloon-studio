'use strict';
// Real MSI/blockmap transfer over localhost. This test never invokes Windows Installer.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {NodeHttpExecutor}=require('builder-util/out/nodeHttpExecutor'),{ElectronHttpExecutor}=require('electron-updater/out/electronHttpExecutor');
const {MsiUpdater}=require('../desktop/msi-updater.cjs'),{UpdateController}=require('../desktop/update-controller.cjs');
class Executor extends NodeHttpExecutor{download(...args){return ElectronHttpExecutor.prototype.download.apply(this,args)}}
async function digest(file){const h=crypto.createHash('sha256');for await(const b of sync.createReadStream(file))h.update(b);return h.digest('hex');}
(async()=>{
 const info=JSON.parse(await fs.readFile('release/latest-msi.json','utf8')),base=info.bases.find(b=>b.version==='0.3.3');assert(base,'Build with --base-msi first');
 const current=info.files[0],release=path.resolve('release'),qa=path.resolve('work/qa');await fs.mkdir(qa,{recursive:true});const temp=await fs.mkdtemp(path.join(qa,'msi-delta-'));
 let metadataRequests=0,rangeRequests=0,fullRequests=0,installerBytes=0;
 const server=http.createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1));
  if(name==='latest-msi.json'){metadataRequests++;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(info));}
  if(![base.url,base.blockmap.url,current.url,current.blockmap.url].includes(name)){res.writeHead(404);return res.end();}
  const file=path.join(release,name),stat=await fs.stat(file),range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=stat.size-1;
  if(range){start=Number(range[1]);end=range[2]?Math.min(end,Number(range[2])):end;if(start>end){res.writeHead(416);return res.end();}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
  res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
  if(name===current.url){installerBytes+=end-start+1;if(range)rangeRequests++;else fullRequests++;}
  sync.createReadStream(file,{start,end}).pipe(res);
 }catch{res.writeHead(500);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 async function create(name,source){
  const updater=new MsiUpdater({version:'0.3.3',url,cacheDir:path.join(temp,name),request:fetch,executor:new Executor(),findSource:async()=>source?path.join(release,base.url):null,install:async()=>{throw Error('This test must never install');},allowHttp:true});
  const controller=new UpdateController({updater,version:'0.3.3'});await controller.startup();await controller.startup();assert.equal(controller.state.phase,'available');return{updater,controller};
 }
 try{
  const missing=await create('missing',false);assert.equal(metadataRequests,1);assert.equal(installerBytes,0);await missing.controller.download();assert.equal(missing.controller.state.phase,'full-required');assert.equal(installerBytes,0);assert.equal(fullRequests,0);
  await missing.controller.download(true);assert.equal(missing.controller.state.phase,'downloaded');assert.equal(fullRequests,1);assert.equal(installerBytes,current.size);assert.equal(missing.updater.autoInstallOnAppQuit,false);
  installerBytes=rangeRequests=fullRequests=0;
  const seeded=await create('seeded',true);assert.equal(metadataRequests,2);await seeded.controller.download();assert.equal(seeded.controller.state.phase,'downloaded');assert.equal(fullRequests,0);assert(rangeRequests>0);assert(installerBytes<current.size);
  const expected=await digest(path.join(release,current.url)),actual=await digest(seeded.updater.readyFile);assert.equal(actual,expected);
  const report={oldVersion:'0.3.3',newVersion:info.version,fullBytes:current.size,differentialBytes:installerBytes,rangeRequests,savedPercent:Math.round((1-installerBytes/current.size)*10000)/100,sha256:actual,verified:true,installed:false};
  await fs.writeFile('release/msi-differential-verification.json',JSON.stringify(report,null,2)+'\n');console.log('PASS real MSI differential update: '+JSON.stringify(report));
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));if(!temp.startsWith(qa+path.sep))throw Error('Unsafe QA cleanup');await fs.rm(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
