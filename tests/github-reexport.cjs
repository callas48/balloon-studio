const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'balloon-reexport-'));
const initial=path.join(temporary,'initial'),first=path.join(temporary,'first'),second=path.join(temporary,'second');
function git(cwd,args){return execFileSync('git',args,{cwd,stdio:'pipe'})}
function track(cwd){git(cwd,['init']);git(cwd,['add','.']);git(cwd,['-c','user.name=Snapshot Test','-c','user.email=snapshot@example.invalid','commit','-m','Fixture']);}
try{
 fs.mkdirSync(path.join(initial,'scripts'),{recursive:true});fs.mkdirSync(path.join(initial,'worker'));
 for(const file of ['scripts/prepare-github.mjs','scripts/build.mjs','worker/index.js','package.json','.gitignore','AGENTS.md'])fs.copyFileSync(file,path.join(initial,file));
 fs.writeFileSync(path.join(initial,'GITHUB-SNAPSHOT.json'),'{}');
 track(initial);
 execFileSync(process.execPath,['scripts/prepare-github.mjs',first],{cwd:initial,stdio:'pipe'});
 track(first);
 execFileSync(process.execPath,['scripts/prepare-github.mjs',second],{cwd:first,stdio:'pipe'});
 for(const root of [first,second]){
  execFileSync(process.execPath,['--check','scripts/build.mjs'],{cwd:root,stdio:'pipe'});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'GITHUB-SNAPSHOT.json'),'utf8'));
  assert(!manifest.files.some(file=>file.path==='GITHUB-SNAPSHOT.json'),'Manifest must not hash its previous version');
  for(const file of manifest.files){const data=fs.readFileSync(path.join(root,file.path));assert.equal(data.length,file.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),file.sha256,file.path)}
 }
 assert.equal(fs.readFileSync(path.join(first,'scripts/build.mjs'),'utf8'),fs.readFileSync(path.join(second,'scripts/build.mjs'),'utf8'));
 console.log('PASS portable re-export: two Git generations, valid build imports, no self-hash, every file hash matches');
}finally{fs.rmSync(temporary,{recursive:true,force:true})}
