param([Parameter(Mandatory=$true)][string]$Config)
$ErrorActionPreference='Stop'
$job = Get-Content -LiteralPath $Config -Encoding UTF8 -Raw | ConvertFrom-Json
$trace = Join-Path (Split-Path -Parent $Config) 'helper.log'
function Write-Stage([string]$stage) { [IO.File]::AppendAllText($trace,([DateTime]::UtcNow.ToString('o')+' '+$stage+[Environment]::NewLine)) }
$code = -1
$message = ''
try {
    Write-Stage 'started'
    if (Test-Path -LiteralPath $job.cancel) { throw 'Installer handoff canceled' }
    $stream = [IO.File]::OpenRead($job.filename)
    $hasher = [Security.Cryptography.SHA512]::Create()
    try { $digest = [Convert]::ToBase64String($hasher.ComputeHash($stream)) } finally { $stream.Dispose(); $hasher.Dispose() }
    if ($digest -ne $job.sha512) { throw 'MSI hash mismatch' }
    if ($job.filename -notlike '*.msi' -or $job.filename.Contains('"') -or $job.installDir.Contains('"')) { throw 'Invalid MSI path' }
    $engine = New-Object -ComObject WindowsInstaller.Installer
    $database = $engine.OpenDatabase($job.filename,0)
    $query = $database.OpenView("SELECT Value FROM Property WHERE Property='UpgradeCode'")
    $query.Execute(); $productCode = $query.Fetch().StringData(1)
    if ($productCode.Trim('{}') -ne $job.upgradeCode) { throw 'MSI product identity mismatch' }
    $query.Close()
    $query = $database.OpenView("SELECT Value FROM Property WHERE Property='ProductVersion'")
    $query.Execute(); $productVersion = ($query.Fetch().StringData(1).Split('.')[0..2] -join '.')
    if ($productVersion -ne $job.version) { throw 'MSI version mismatch' }
    $query.Close()
    [Runtime.InteropServices.Marshal]::FinalReleaseComObject($database) | Out-Null
    [Runtime.InteropServices.Marshal]::FinalReleaseComObject($engine) | Out-Null
    if (Test-Path -LiteralPath $job.cancel) { throw 'Installer handoff canceled' }
    Write-Stage 'validated'
    [IO.File]::WriteAllText($job.ready,'ready')
    $parent = Get-Process -Id $job.parentPid -ErrorAction SilentlyContinue
    if ($parent -and -not $parent.WaitForExit(120000)) { throw 'The editor did not exit; installation canceled' }
    if (Test-Path -LiteralPath $job.cancel) { throw 'Installer handoff canceled' }
    Write-Stage 'editor-exited'
    # MSI owns binary replacement and rollback. Never overwrite app files ourselves.
    $arguments = '/i "'+$job.filename+'" /passive /norestart REBOOT=ReallySuppress ALLUSERS=2 MSIINSTALLPERUSER=1 APPLICATIONFOLDER="'+$job.installDir+'" /l*v "'+$job.log+'"'
    $installer = Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\msiexec.exe') -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden
    $code = $installer.ExitCode
    Write-Stage ('msi-exit-'+$code)
    if ($code -notin @(0,3010)) { $message = 'MSI installation failed: '+$code }
} catch { $message = $_.Exception.Message }
@{version=$job.version;exitCode=$code;message=$message;log=$job.log} | ConvertTo-Json | Set-Content -LiteralPath $job.result -Encoding UTF8
[IO.File]::WriteAllText($job.done,'done')
if ((Test-Path -LiteralPath $job.exe) -and -not (Get-Process -Id $job.parentPid -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $job.exe -WorkingDirectory $job.installDir -WindowStyle Normal
}
