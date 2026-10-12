$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$installation = Split-Path -Parent $MyInvocation.MyCommand.Path
if ((Split-Path -Leaf $installation) -ne 'EUS_Surgery_Explainer') { throw '安装路径不符合预期，停止卸载。' }
if (-not (Test-Path -LiteralPath (Join-Path $installation 'EUS_Surgery_Explainer.exe'))) { throw '找不到本工具程序，停止卸载。' }

$answer = [System.Windows.Forms.MessageBox]::Show('卸载 EUS 手术解说工具？本机审核记录和器械自定义数据会保留。', 'EUS 手术解说工具', 'YesNo', 'Question')
if ($answer -ne 'Yes') { exit 0 }

$exe = Join-Path $installation 'EUS_Surgery_Explainer.exe'
$active = Get-CimInstance Win32_Process -Filter "name = 'EUS_Surgery_Explainer.exe'" | Where-Object { $_.ExecutablePath -eq $exe }
if ($active) { throw '请先关闭 EUS 手术解说工具，再执行卸载。' }

foreach ($folder in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
    $shortcut = Join-Path $folder 'EUS 手术解说工具.lnk'
    if (Test-Path -LiteralPath $shortcut) { Remove-Item -LiteralPath $shortcut -Force }
}
Remove-Item -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\EUS_Surgery_Explainer' -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $installation -Recurse -Force
[System.Windows.Forms.MessageBox]::Show('卸载完成。本机审核记录仍保存在用户数据目录中。', 'EUS 手术解说工具') | Out-Null
