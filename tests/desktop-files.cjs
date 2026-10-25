'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {atomicWrite,readProject,localAsset,validateProject}=require('../desktop/files.cjs');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'공방 desktop '));
 try{
  const filename=path.join(root,'한글 프로젝트.balloon.json'),first=JSON.stringify({format:'balloon-studio',version:3,pages:[{id:'one',name:'첫 장',doc:{items:[]}}]});
  await atomicWrite(filename,first);assert.equal(await readProject(filename),first);
  const second=first.replace('첫 장','저장 후 업데이트');await atomicWrite(filename,second);assert.equal(await readProject(filename),second);
  await assert.rejects(()=>atomicWrite(filename,'broken'));assert.equal(await readProject(filename),second,'Failed save must preserve existing project');
  assert.equal((await fs.readdir(root)).filter(n=>n.endsWith('.tmp')).length,0);
  assert.throws(()=>validateProject(JSON.stringify({format:'other',version:3,pages:[{}]})));
  assert.throws(()=>validateProject(JSON.stringify({format:'balloon-studio',version:3,pages:[]})));
  await fs.writeFile(path.join(root,'index.html'),'offline editor');await fs.mkdir(path.join(root,'fonts'));await fs.writeFile(path.join(root,'fonts','local.ttf'),'font');
  assert.equal(await localAsset(root,'studio://app/'),path.join(root,'index.html'));
  assert.equal(await localAsset(root,'studio://app/fonts/local.ttf'),path.join(root,'fonts','local.ttf'));
  for(const url of ['studio://evil/index.html','https://app/index.html','studio://app/%2e%2e%2foutside.json','studio://app/fonts/..%5c..%5csecret','studio://app/.git/config','studio://app/missing'])assert.equal(await localAsset(root,url),null,url);
  console.log('PASS desktop files: atomic Unicode saves, replacement, failed-save preservation, temp cleanup, project validation and offline asset traversal/origin guards');
 }finally{await fs.rm(root,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
