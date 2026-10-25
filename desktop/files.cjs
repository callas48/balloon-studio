'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const LIMIT=256*1024*1024;
function validateProject(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>LIMIT)throw Error('프로젝트 파일이 너무 큽니다.');
 const book=JSON.parse(text);if(book.format!=='balloon-studio'||![undefined,1,2,3].includes(book.version))throw Error('공방 프로젝트 파일이 아닙니다.');
 if(book.version===3&&(!Array.isArray(book.pages)||!book.pages.length||book.pages.length>100))throw Error('프로젝트 이미지 목록이 올바르지 않습니다.');
 return text;
}
async function atomicWrite(filename,text){
 validateProject(text);const temporary=path.join(path.dirname(filename),'.'+path.basename(filename)+'.'+crypto.randomUUID()+'.tmp');
 try{const handle=await fs.open(temporary,'wx');try{await handle.writeFile(text,'utf8');await handle.sync()}finally{await handle.close()}await fs.rename(temporary,filename)}finally{await fs.rm(temporary,{force:true}).catch(()=>{})}
}
async function readProject(filename){const stat=await fs.stat(filename);if(!stat.isFile()||stat.size>LIMIT)throw Error('프로젝트 파일이 너무 크거나 읽을 수 없습니다.');const text=await fs.readFile(filename,'utf8');validateProject(text);return text}
async function localAsset(root,url){
 const parsed=new URL(url);if(parsed.protocol!=='studio:'||parsed.host!=='app')return null;
 const pathname=decodeURIComponent(parsed.pathname);if(pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.')))return null;
 const realRoot=await fs.realpath(root),file=await fs.realpath(path.resolve(realRoot,'.'+(pathname==='/'?'/index.html':pathname))).catch(()=>null);
 if(!file||!file.startsWith(realRoot+path.sep)||!(await fs.stat(file)).isFile())return null;return file;
}
module.exports={atomicWrite,readProject,validateProject,localAsset,LIMIT};
