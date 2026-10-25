const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
(async()=>{
 const {server}=await import('../scripts/dev-local.mjs');await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.equal(await page.text(),fs.readFileSync('public/index.html','utf8'));
  const font=await fetch(base+'/fonts/cover/hs-bombaram-2.ttf');assert.equal(font.headers.get('content-type'),'font/ttf');assert(Buffer.from(await font.arrayBuffer()).equals(fs.readFileSync('public/fonts/cover/hs-bombaram-2.ttf')));
  assert.deepEqual(await (await fetch(base+'/api/shared-assets/session')).json(),{owner:false});assert.deepEqual(await (await fetch(base+'/api/shared-assets')).json(),{assets:[]});assert.equal((await fetch(base+'/api/shared-assets',{method:'POST'})).status,503);assert.equal((await fetch(base+'/api/analytics/visit',{method:'POST'})).status,204);
  for(const p of ['/../package.json','/%2e%2e%2fpackage.json','/fonts/..%5c..%5cpackage.json','/.git/config','/missing.png'])assert.equal((await fetch(base+p)).status,404,p);
  assert.equal((await fetch(base+'/app.js',{method:'POST'})).status,405);assert.equal((await fetch(base+'/app.js',{method:'HEAD'})).status,200);
 }finally{await new Promise(r=>server.close(r))}
 const baseDir=fs.mkdtempSync(path.join(os.tmpdir(),'github-source-')),out=path.join(baseDir,'snapshot');
 try{
  execFileSync(process.execPath,['scripts/prepare-github.mjs',out],{stdio:'pipe'});assert(!fs.existsSync(path.join(out,'.openai')));assert(!fs.existsSync(path.join(out,'.git')));assert(!fs.existsSync(path.join(out,'node_modules')));
  const w=fs.readFileSync(path.join(out,'worker/index.js'),'utf8');assert(!w.includes('assetOwnerEmail'));assert(w.includes('const isAssetOwner=()=>false;'));
  assert.equal(fs.readFileSync(path.join(out,'public/app.js'),'utf8'),fs.readFileSync('public/app.js','utf8'));
  assert.equal(fs.readFileSync(path.join(out,'public/fonts/cover/HS-LICENSE.txt'),'utf8'),fs.readFileSync('public/fonts/cover/HS-LICENSE.txt','utf8'));
  execFileSync(process.execPath,['scripts/build.mjs'],{cwd:out,stdio:'pipe'});assert(fs.existsSync(path.join(out,'dist/client/romance-title-references.js')));
  assert.throws(()=>execFileSync(process.execPath,['scripts/prepare-github.mjs',out],{stdio:'pipe'}),'Existing directory must not be overwritten');
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'GITHUB-SNAPSHOT.json')));const crypto=require('node:crypto');for(const f of manifest.files){const data=fs.readFileSync(path.join(out,f.path));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),f.sha256,f.path)}
 }finally{fs.rmSync(baseDir,{recursive:true,force:true})}
 console.log('PASS GitHub preparation: local editor/fonts, read-only API stubs, traversal/method guards, clean snapshot/no history/hosting/admin identity, unchanged editor/license bytes, standalone build, per-file hashes and no overwrite');
})().catch(e=>{console.error(e);process.exitCode=1});
