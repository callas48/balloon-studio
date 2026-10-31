'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const powershell=()=>path.join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
const quote=value=>"'"+value.replace(/'/g,"''")+"'";
async function runScript(script){return(await promisify(execFile)(powershell(),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from('[Console]::OutputEncoding=[Text.Encoding]::UTF8;$ErrorActionPreference=\'Stop\';'+script,'utf16le').toString('base64')],{windowsHide:true,timeout:10000,maxBuffer:16384})).stdout.trim();}
async function findInstalledSource(upgradeCode){
 if(!/^[A-Fa-f0-9-]{36}$/.test(upgradeCode))throw Error('Invalid MSI upgrade code');
 const script=`[Console]::OutputEncoding=[Text.Encoding]::UTF8;$ErrorActionPreference='Stop';$installer=New-Object -ComObject WindowsInstaller.Installer;foreach($id in $installer.RelatedProducts('{${upgradeCode}}')){try{$source=$installer.ProductInfo($id,'InstallSource');$name=$installer.ProductInfo($id,'PackageName');$file=Join-Path $source $name;if(Test-Path -LiteralPath $file){[Console]::Write($file);break}}catch{}}`;
 try{return(await promisify(execFile)(powershell(),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:10000,maxBuffer:16384})).stdout.trim()||null;}catch{return null;}
}
async function launchInstaller({app,filename,sha512,version,cacheDir,exe,parentPid=process.pid,readyTimeoutMs=120000}){
 if(typeof exe!=='string'||!path.isAbsolute(exe)||!Number.isInteger(parentPid)||parentPid<1)throw Error('설치 대상 프로그램을 확인하지 못했습니다.');
 const job=path.join(cacheDir,'install-'+crypto.randomUUID());await fs.mkdir(job,{recursive:true});
 const script=path.join(job,'install.ps1'),config=path.join(job,'config.json'),ready=path.join(job,'ready'),cancel=path.join(job,'cancel'),done=path.join(job,'done');
 await fs.copyFile(path.join(__dirname,'msi-install.ps1'),script);
 await fs.writeFile(config,JSON.stringify({filename,sha512,version,upgradeCode:require('./msi-config.json').upgradeCode,parentPid,exe,installDir:path.dirname(exe),ready,cancel,done,result:path.join(cacheDir,'last-install.json'),log:path.join(job,'msi.log')}));
 // Windows PowerShell can exit without executing under Node's DETACHED_PROCESS flag.
 // Start-Process creates an independent hidden helper with its own valid process context.
 const command='& '+quote(script)+' -Config '+quote(config),args='-NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand '+Buffer.from(command,'utf16le').toString('base64');
 let child;
 try{child=JSON.parse(await runScript('$p=Start-Process -FilePath '+quote(powershell())+' -ArgumentList '+quote(args)+' -WorkingDirectory '+quote(job)+' -WindowStyle Hidden -RedirectStandardError '+quote(path.join(job,'helper-error.log'))+' -RedirectStandardOutput '+quote(path.join(job,'helper-output.log'))+' -PassThru;@{pid=$p.Id;created=$p.StartTime.ToUniversalTime().Ticks.ToString()}|ConvertTo-Json -Compress'));}
 catch(error){await fs.writeFile(cancel,'cancel');throw Error('MSI 설치 도우미를 시작하지 못했습니다. 현재 작업을 계속할 수 있습니다.',{cause:error});}
 // The helper must validate the MSI and acknowledge readiness before the app exits.
 const deadline=Date.now()+readyTimeoutMs;while(Date.now()<deadline){if(await fs.stat(ready).catch(()=>null)){setImmediate(()=>app.quit());return;}if(await fs.stat(done).catch(()=>null))break;await new Promise(r=>setTimeout(r,100));}
 // Never leave a delayed helper eligible to install after a failed handoff.
 await fs.writeFile(cancel,'cancel');
 if(Number.isInteger(child.pid)&&/^\d+$/.test(child.created))await runScript('$p=Get-Process -Id '+child.pid+' -ErrorAction SilentlyContinue;if($p -and $p.StartTime.ToUniversalTime().Ticks.ToString() -eq '+quote(child.created)+'){$p.Kill()}').catch(()=>{});
 throw Error('MSI 설치 도우미를 시작하지 못했습니다. 현재 작업을 계속할 수 있습니다.');
}
module.exports={findInstalledSource,launchInstaller};
