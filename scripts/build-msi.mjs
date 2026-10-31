import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {parseArgs} from 'node:util';
const require=createRequire(import.meta.url),{build,Platform,Arch}=require('electron-builder');
if(process.platform!=='win32')throw Error('MSI builds require Windows');
const config=require('../electron-builder.cjs'),pkg=require('../package.json');
const {values:options}=parseArgs({options:{'base-msi':{type:'string'},'skip-ice-validation':{type:'boolean'},prepackaged:{type:'boolean'},'metadata-only':{type:'boolean'}}});
if(options['skip-ice-validation'])config.msi.additionalLightArgs.push('-sval');
if(!options['metadata-only'])await build({targets:Platform.WINDOWS.createTarget(['msi'],Arch.x64),config,publish:'never',prepackaged:options.prepackaged?path.resolve('release/win-unpacked'):undefined});
const installer=path.resolve(`release/Balloon-Studio-Setup-${pkg.version}-x64.msi`);
if(!fs.existsSync(installer))throw Error('MSI artifact is missing');
const {buildBlockMap}=require('app-builder-lib/out/targets/blockmap/blockmap');
async function artifact(file){
 const bytes=fs.readFileSync(file),map=file+'.blockmap';
 await buildBlockMap(file,'gzip',map);
 const blockmap=fs.readFileSync(map);
 return{url:path.basename(file),size:bytes.length,sha512:crypto.createHash('sha512').update(bytes).digest('base64'),blockmap:{url:path.basename(map),size:blockmap.length,sha256:crypto.createHash('sha256').update(blockmap).digest('hex')}};
}
const bases=[];
if(options['base-msi']){const base=path.resolve(options['base-msi']);const digest=crypto.createHash('sha256').update(fs.readFileSync(base)).digest('hex');if(digest!==require('../build/msi-0.3.3-identities.json').sourceSha256)throw Error('The MSI base must be the verified 0.3.3 release');const local=path.resolve('release',path.basename(base));if(base!==local)fs.copyFileSync(base,local);bases.push({version:'0.3.3',...await artifact(local)});}
const info={schema:1,version:pkg.version,releaseNotes:'사이트 v260 편집기 개선과 MSI 빌드 설정 복원',files:[await artifact(installer)],bases};
fs.writeFileSync('release/latest-msi.json',JSON.stringify(info,null,2)+'\n');
const sha256=crypto.createHash('sha256').update(fs.readFileSync(installer)).digest('hex');
fs.writeFileSync('release/SHA256SUMS.txt',sha256+'  '+path.basename(installer)+'\n');
console.log(JSON.stringify({installer,version:pkg.version,sha256,bytes:fs.statSync(installer).size,baseVersions:bases.map(b=>b.version),iceValidation:options['skip-ice-validation']?'skipped-explicitly':'enabled'},null,2));
