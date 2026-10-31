'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const pkg=require('../package.json'),baseline=require('../build/msi-0.3.3-identities.json');
const msi=path.resolve(process.argv[2]||`release/Balloon-Studio-Setup-${pkg.version}-x64.msi`),output=path.resolve('work/qa/msi-tables.json');
const powershell=path.join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
cp.execFileSync(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.resolve('scripts/read-msi-tables.ps1'),'-Msi',msi,'-Output',output],{stdio:'pipe',windowsHide:true});
const t=JSON.parse(fs.readFileSync(output,'utf8')),props=Object.fromEntries(t.Property);
assert.equal(props.UpgradeCode.replace(/[{}]/g,''),baseline.upgradeCode);assert.equal(props.ProductVersion,pkg.version+'.0');assert.equal(props.ProductLanguage,'1042');assert.equal(props.ProductName,'말풍선 공방');assert.notEqual(props.ALLUSERS,'1');assert.equal(props.MSIINSTALLPERUSER,'1');
assert.notEqual(props.ProductCode,'{EAF0722E-C14F-49B2-A9A4-629640BAAB7B}');
const dirs=new Map(t.Directory.map(r=>[r[0],r])),components=new Map(t.Component.map(r=>[r[0],r]));
assert.equal(dirs.get('APPLICATIONFOLDER')[1],'LocalProgramsFolder');assert.equal(dirs.get('APPLICATIONFOLDER')[2].split('|').at(-1),'BalloonStudioMSI');assert.equal(dirs.get('LocalProgramsFolder')[1],'LocalAppDataFolder');
function dir(id){if(id==='APPLICATIONFOLDER')return '';const d=dirs.get(id);assert(d,id);return path.posix.join(dir(d[1]),d[2].split('|').at(-1));}
let retained=0;const paths=new Set(),guids=new Set();
for(const f of t.File){const c=components.get(f[1]),rel=path.posix.join(dir(c[2]),f[2].split('|').at(-1)).toLowerCase();assert(!paths.has(rel));paths.add(rel);const previous=baseline.files[rel];if(previous){assert.equal(c[1],previous.guid,'Changed MSI component identity: '+rel);retained++;}assert(!guids.has(c[1]),'Duplicate component GUID');guids.add(c[1]);assert(Number(c[3])&4,'Per-user files need a registry key path');const key=t.Registry.find(r=>r[0]===c[5]);assert(key);assert.equal(key[1],'1');assert.equal(key[2],'Software\\BalloonStudio\\MSI\\Files');}
assert.equal(retained,Object.keys(baseline.files).length,'An existing MSI file/component was lost');
const sequence=Object.fromEntries(t.InstallExecuteSequence.map(r=>[r[0],Number(r[2])]));assert(sequence.RemoveExistingProducts>sequence.InstallInitialize);assert(sequence.RemoveExistingProducts<sequence.InstallFiles);
assert(t.Upgrade.some(r=>r[0]===props.UpgradeCode&&r[2]===props.ProductVersion&&r[6]==='WIX_UPGRADE_DETECTED'));
assert(t.RegLocator.some(r=>r[1]==='1'&&r[2]==='Software\\BalloonStudio\\MSI'&&r[3]==='InstallLocation'));
assert(paths.has('resources/editor/project-memory.js'));assert(paths.has('resources/editor/batch-export.js'));assert(paths.has('resources/editor/censor-signs.js'));
const report={version:pkg.version,productCode:props.ProductCode,upgradeCode:props.UpgradeCode,language:props.ProductLanguage,fileCount:t.File.length,retainedComponentGuids:retained,rollbackSchedule:sequence.RemoveExistingProducts,verified:true,installed:false};
fs.writeFileSync('release/msi-package-verification.json',JSON.stringify(report,null,2)+'\n');console.log('PASS compiled MSI: '+JSON.stringify(report));
