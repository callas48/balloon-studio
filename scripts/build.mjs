import {execFileSync} from 'node:child_process';
import {cpSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist/server',{recursive:true});cpSync('public','dist/client',{recursive:true});
let source=readFileSync('worker/index.js','utf8');source=source.replace('const appHTML=null;', 'const appHTML='+JSON.stringify(readFileSync('public/index.html','utf8'))+';');writeFileSync('dist/server/index.js',source);
if(existsSync('.openai/hosting.json')){mkdirSync('dist/.openai',{recursive:true});cpSync('.openai/hosting.json','dist/.openai/hosting.json')};
execFileSync(process.execPath,['scripts/check-deployment-entry.cjs'],{stdio:'inherit'});
console.log('Built editor assets and analytics Worker');
