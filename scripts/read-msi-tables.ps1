param([Parameter(Mandatory=$true)][string]$Msi,[Parameter(Mandatory=$true)][string]$Output)
$ErrorActionPreference='Stop'
$engine=New-Object -ComObject WindowsInstaller.Installer
$database=$engine.OpenDatabase([IO.Path]::GetFullPath($Msi),0)
$counts=@{Property=2;Directory=3;File=8;Component=6;Registry=6;Upgrade=7;InstallExecuteSequence=3;RegLocator=5}
$result=@{}
foreach($table in $counts.Keys){
 $view=$database.OpenView('SELECT * FROM `'+$table+'`');$view.Execute();$rows=@()
 while($null -ne($record=$view.Fetch())){$row=@();for($i=1;$i -le $counts[$table];$i++){$row+=$record.StringData($i)};$rows+=,@($row)}
 $view.Close();$result[$table]=$rows
}
$target=[IO.Path]::GetFullPath($Output);[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))|Out-Null
[IO.File]::WriteAllText($target,($result|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($database)|Out-Null
[Runtime.InteropServices.Marshal]::FinalReleaseComObject($engine)|Out-Null
