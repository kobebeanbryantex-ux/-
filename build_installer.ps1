# Build a single-file Windows installer after build_desktop_app.ps1 succeeds.
# Run with: pwsh -NoProfile -File .\build_installer.ps1
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appFolder = Join-Path $projectRoot '桌面版输出/EUS_Surgery_Explainer'
$exe = Join-Path $appFolder 'EUS_Surgery_Explainer.exe'
if (-not (Test-Path -LiteralPath $exe)) { throw '请先运行 build_desktop_app.ps1 构建桌面程序。' }
Copy-Item -LiteralPath (Join-Path $projectRoot 'uninstall.ps1') -Destination (Join-Path $appFolder 'uninstall.ps1') -Force
$uninstallTarget = Join-Path $appFolder 'uninstall.ps1'
$uninstallText = [System.IO.File]::ReadAllText($uninstallTarget)
[System.IO.File]::WriteAllText($uninstallTarget, $uninstallText, (New-Object System.Text.UTF8Encoding($true)))

$buildFolder = Join-Path $projectRoot '桌面版构建缓存/installer'
$outputFolder = Join-Path $projectRoot '桌面版输出/完整安装包'
New-Item -ItemType Directory -Path $buildFolder, $outputFolder -Force | Out-Null
$payload = Join-Path $buildFolder 'app_payload.zip'
if (Test-Path -LiteralPath $payload) { Remove-Item -LiteralPath $payload -Force }
Add-Type -AssemblyName System.IO.Compression.ZipFile
[System.IO.Compression.ZipFile]::CreateFromDirectory($appFolder, $payload, [System.IO.Compression.CompressionLevel]::Optimal, $false)

$installerArgs = @(
    '--noconfirm', '--clean', '--windowed', '--onefile',
    '--name', 'EUS_Surgery_Explainer_Setup_20261008_1_0_2',
    '--distpath', $outputFolder,
    '--workpath', (Join-Path $buildFolder 'work'),
    '--specpath', $buildFolder,
    '--add-data', "$payload;.",
    (Join-Path $projectRoot 'installer_bootstrap.py')
)
& python -m PyInstaller @installerArgs
if ($LASTEXITCODE -ne 0) { throw "安装包构建失败，退出码 $LASTEXITCODE" }
$installer = Join-Path $outputFolder 'EUS_Surgery_Explainer_Setup_20261008_1_0_2.exe'
if (-not (Test-Path -LiteralPath $installer)) { throw "找不到安装包：$installer" }
Write-Host "完整安装包已生成：$installer"
