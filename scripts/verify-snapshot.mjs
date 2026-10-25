// Verify the complete portable source snapshot, without installing dependencies.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(path.join(root,'GITHUB-SNAPSHOT.json'),'utf8'));
const seen=new Set();let bytes=0;
for(const file of manifest.files){
 const target=path.resolve(root,file.path);
 if(!target.startsWith(root+path.sep)||seen.has(file.path))throw Error('Invalid snapshot path: '+file.path);
 seen.add(file.path);
 const data=readFileSync(target);
 if(data.length!==file.bytes||createHash('sha256').update(data).digest('hex')!==file.sha256)throw Error('Snapshot mismatch: '+file.path);
 bytes+=data.length;
}
console.log(`PASS snapshot: ${seen.size} files, ${bytes} bytes, every SHA-256 matches`);
