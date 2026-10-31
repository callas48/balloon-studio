'use strict';
// Recreate the installed 0.3.3 per-user MSI contract using the pinned builder's file list.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const baseline=require('../build/msi-0.3.3-identities.json');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const unescape=value=>value.replace(/&(amp|lt|gt|quot|apos);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[n]));
function uuid(name){const ns=Buffer.from(baseline.upgradeCode.replaceAll('-',''),'hex'),bytes=crypto.createHash('sha1').update(ns).update(name).digest().subarray(0,16);bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const h=bytes.toString('hex');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-').toUpperCase();}
function render(generated,version){
 if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('A three-part MSI version is required');
 const icon=generated.match(/<Icon\b[^>]*Id="([^"]+)"[^>]*SourceFile="([^"]+)"/);if(!icon)throw Error('Missing generated application icon');
 const fileNodes=[...generated.matchAll(/<File\b([^>]+?)(?:\/>|>)/g)];if(!fileNodes.length)throw Error('Missing packaged files');
 const dirs=new Map([['',{id:'APPLICATIONFOLDER',name:'BalloonStudioMSI',children:new Map()}]]),files=[];
 function dir(rel){if(dirs.has(rel))return dirs.get(rel);const parent=path.posix.dirname(rel)==='.'?'':path.posix.dirname(rel),node={id:'d'+crypto.createHash('md5').update(rel).digest('hex'),name:path.posix.basename(rel),children:new Map()};dir(parent).children.set(node.name,node);dirs.set(rel,node);return node;}
 const seen=new Set();
 for(const match of fileNodes){
  const source=match[1].match(/\bSource="([^"]+)"/);if(!source)throw Error('Packaged file is missing Source');
  const decoded=unescape(source[1]);if(!decoded.startsWith('$(var.appDir)\\'))throw Error('Unexpected MSI source root');
  const rel=decoded.slice('$(var.appDir)\\'.length).replaceAll('\\','/'),key=rel.toLowerCase();
  if(!rel||rel.split('/').includes('..')||seen.has(key))throw Error('Invalid or duplicate MSI file');seen.add(key);
  const identity=baseline.files[key]||{id:'c'+crypto.createHash('md5').update(key).digest('hex'),guid:uuid('file:'+key)};
  const parent=path.posix.dirname(rel)==='.'?'':path.posix.dirname(rel),directory=dir(parent);
  const main=rel==='말풍선 공방.exe',fileId=main?'mainExecutable':'f'+crypto.createHash('md5').update(key).digest('hex');
  const shortcuts=main?`<Shortcut Id="desktopShortcut" Directory="DesktopFolder" Name="말풍선 공방 MSI" WorkingDirectory="APPLICATIONFOLDER" Advertise="no" Icon="${icon[1]}"/><Shortcut Id="startMenuShortcut" Directory="ProgramMenuFolder" Name="말풍선 공방 MSI" WorkingDirectory="APPLICATIONFOLDER" Advertise="no" Icon="${icon[1]}"/>`:'';
  files.push(`<Component Id="${identity.id}" Guid="${identity.guid}" Directory="${directory.id}" Win64="yes"><File Id="${fileId}" Name="${escape(path.posix.basename(rel))}" Source="${source[1]}" ReadOnly="yes" KeyPath="no">${shortcuts}</File><RegistryValue Root="HKCU" Key="Software\\BalloonStudio\\MSI\\Files" Name="${identity.id}" Type="integer" Value="1" KeyPath="yes"/></Component>`);
 }
 if(!seen.has('말풍선 공방.exe')||!seen.has('resources/app.asar'))throw Error('Missing desktop payload');
 const tree=node=>`<Directory Id="${node.id}" Name="${escape(node.name)}">${[...node.children.values()].sort((a,b)=>a.name.localeCompare(b.name,'en')).map(tree).join('')}</Directory>`;
 const cleanup=[...dirs.values()].map(d=>`<RemoveFolder Id="remove_${d.id}" Directory="${d.id}" On="uninstall"/>`).join('');
 return `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs"><Product Id="*" Name="말풍선 공방" Manufacturer="Balloon Studio" Version="${version}.0" Language="1042" Codepage="65001" UpgradeCode="${baseline.upgradeCode}">
<Package Compressed="yes" InstallerVersion="500" InstallScope="perUser"/>
<MajorUpgrade Schedule="afterInstallInitialize" DowngradeErrorMessage="더 최신 버전의 말풍선 공방이 설치되어 있습니다."/>
<MediaTemplate CompressionLevel="high" EmbedCab="yes"/>
<Property Id="MSIINSTALLPERUSER" Secure="yes" Value="1"/><Property Id="WIXUI_INSTALLDIR" Value="APPLICATIONFOLDER"/>
<Property Id="ARPPRODUCTICON" Value="${icon[1]}"/><Icon Id="${icon[1]}" SourceFile="${icon[2]}"/>
<Property Id="STUDIO_PREVIOUS_INSTALLDIR"><RegistrySearch Id="PreviousStudioDirectory" Root="HKCU" Key="Software\\BalloonStudio\\MSI" Name="InstallLocation" Type="raw" Win64="yes"/></Property>
<SetProperty Id="APPLICATIONFOLDER" Value="[STUDIO_PREVIOUS_INSTALLDIR]" Before="CostFinalize" Sequence="both">STUDIO_PREVIOUS_INSTALLDIR AND NOT APPLICATIONFOLDER</SetProperty>
<SetProperty Id="ARPINSTALLLOCATION" Value="[APPLICATIONFOLDER]" After="CostFinalize" Sequence="both"/>
<Directory Id="TARGETDIR" Name="SourceDir"><Directory Id="LocalAppDataFolder"><Directory Id="LocalProgramsFolder" Name="Programs">${tree(dirs.get(''))}</Directory></Directory><Directory Id="DesktopFolder"/><Directory Id="ProgramMenuFolder"/></Directory>
<Feature Id="ProductFeature" Title="말풍선 공방" Level="1" Absent="disallow"><ComponentGroupRef Id="ProductComponents"/></Feature>
<ComponentGroup Id="ProductComponents">${files.join('\n')}
<Component Id="PerUserDirectoryCleanup" Guid="${baseline.cleanupGuid}" Directory="APPLICATIONFOLDER" Win64="yes">${cleanup}<RegistryValue Root="HKCU" Key="Software\\BalloonStudio\\MSI" Name="Installed" Type="integer" Value="1" KeyPath="yes"/><RegistryValue Root="HKCU" Key="Software\\BalloonStudio\\MSI" Name="InstallLocation" Type="string" Value="[APPLICATIONFOLDER]"/></Component></ComponentGroup>
<UIRef Id="WixUI_InstallDir"/>
</Product></Wix>\n`;
}
async function hook(projectFile){const version=require('../package.json').version;const output=render(await fs.readFile(projectFile,'utf8'),version);await fs.writeFile(projectFile,output);const audit=path.resolve('release/msi-project.wxs');await fs.mkdir(path.dirname(audit),{recursive:true});await fs.writeFile(audit,output);}
module.exports=hook;module.exports.render=render;module.exports.uuid=uuid;
