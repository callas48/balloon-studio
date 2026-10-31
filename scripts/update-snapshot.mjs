import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const file='GITHUB-SNAPSHOT.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(p=>p&&p!==file&&fs.existsSync(p));
manifest.siteBaseline='4f72313067eb28dc3035c9ce9f5c6d0f688144b8';manifest.desktopBaseline={version:'0.3.3',sha256:'f1b45759ecdaa51601c9feb572372bffb387f13acf5b4e9fce7707120265af1c'};
manifest.files=[...new Set(paths)].sort().map(p=>{const target=path.resolve(p);if(!target.startsWith(process.cwd()+path.sep))throw Error('Invalid snapshot path');const data=fs.readFileSync(target);return{path:p,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')}});
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log('Updated '+manifest.files.length+' snapshot entries.');
