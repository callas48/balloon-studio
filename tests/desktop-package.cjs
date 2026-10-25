'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),asar=require('@electron/asar');
const root=path.resolve(process.argv[2]||'release/win-unpacked'),archive=path.join(root,'resources/app.asar');
for(const name of ['main.cjs','preload.cjs','once-provider.cjs','consent-updater.cjs','update-controller.cjs','files.cjs','update-feed.json'])assert(asar.extractFile(archive,path.join('desktop',name)).equals(fs.readFileSync(path.join('desktop',name))),'Stale packaged desktop code: '+name);
const updater=JSON.parse(asar.extractFile(archive,path.join('node_modules','electron-updater','package.json')));assert.equal(updater.version,require('../package.json').dependencies['electron-updater']);
const packaged=JSON.parse(asar.extractFile(archive,'package.json'));assert.equal(packaged.version,require('../package.json').version);assert.equal(packaged.main,'desktop/main.cjs');
let count=0;
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const filename=path.join(directory,entry.name);if(entry.isDirectory())walk(filename);else{const relative=path.relative('public',filename);assert(fs.readFileSync(filename).equals(fs.readFileSync(path.join(root,'resources/editor',relative))),'Stale packaged asset: '+relative);count++}}}
walk('public');console.log('PASS packaged desktop: exact main/preload/updater code, pinned runtime, version and '+count+' complete offline editor/font/asset files');
