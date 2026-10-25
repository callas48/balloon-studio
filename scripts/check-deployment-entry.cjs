// Validate the files actually being published, including an optional final archive.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const reactionAssets=JSON.parse(fs.readFileSync('docs/assets/pink-reactions/catalog.json','utf8')).map(r=>r.url);
const archive=process.argv[2];let extracted;
if(archive){extracted=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'balloon-archive-check-'));process.on('exit',()=>fs.rmSync(extracted,{recursive:true,force:true}));const names=[...fs.readFileSync('public/index.html','utf8').matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]).filter(n=>!/^https?:/.test(n));for(const n of names)assert(!n.includes('..')&&!path.isAbsolute(n));const members=[...reactionAssets.map(n=>'client/'+n),'client/index.html','server/index.js',...names.map(n=>'client/'+n),...['blue','pink','orange'].map(c=>'client/pixel-rpg/positive-'+c+'-pair.png')];execFileSync('tar',['-xzf',archive,'-C',extracted,...members.map(n=>'dist/'+n)],{stdio:'pipe'})}
const read=relative=>fs.readFileSync(path.join(extracted?path.join(extracted,'dist'):'dist',relative));
const source=fs.readFileSync('public/index.html'),entry=read('client/index.html');
assert(entry.equals(source),'Deployment HTML differs from current source; rebuild before packaging');
const html=entry.toString(),scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]).filter(s=>!/^https?:/.test(s));
assert(scripts.includes('pixel-rpg-positive.js'),'Deployment entry is missing positive glass module');
assert(scripts.indexOf('pixel-rpg-positive.js')>scripts.indexOf('pixel-rpg.js'),'Positive module must follow pixel RPG');
for(const name of scripts){assert(!name.includes('..'));assert(read('client/'+name).equals(fs.readFileSync(path.join('public',name))),'Stale script in deployment: '+name)}
const server=read('server/index.js').toString();assert(server.includes('const appHTML='+JSON.stringify(html)+';'),'Worker HTML fallback must match static entry');
for(const color of ['blue','pink','orange']){const name='pixel-rpg/positive-'+color+'-pair.png';assert(read('client/'+name).equals(fs.readFileSync('public/'+name)),'Stale glass PNG: '+color)}
for(const name of reactionAssets)assert(read('client/'+name).equals(fs.readFileSync('public/'+name)),'Stale reaction PNG: '+name);
console.log('PASS deployment entry: current HTML, '+scripts.length+' exact scripts, positive module order, Worker fallback and three PNGs'+(archive?' in final archive':''));
