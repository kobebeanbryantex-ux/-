# Build the portable Windows desktop application from the current webpage.
# Run from this project directory: pwsh -NoProfile -File .\build_desktop_app.ps1
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectRoot

$assetEntries = @(
    'index.html',
    'stopmotion_optimizer.js',
    'stopmotion_optimizer.css',
    'esd_interaction.js',
    'esd_interaction.css',
    'medical_review_registry.js',
    'two_d_workspace.js',
    'two_d_workspace.css',
    'media/two_d_surgery',
    'media/official_photos',
    'media/models',
    'media/inst_sequences',
    '00_AI自主生成顶级医学照片库',
    '02_手术推演连贯高清图片帧/00_AI纯净全流程定格帧'
)

$args = @(
    '--noconfirm',
    '--clean',
    '--windowed',
    '--onedir',
    '--name', 'EUS_Surgery_Explainer',
    '--contents-directory', '_internal',
    '--distpath', (Join-Path $projectRoot '桌面版输出'),
    '--workpath', (Join-Path $projectRoot '桌面版构建缓存'),
    '--specpath', (Join-Path $projectRoot '桌面版构建缓存'),
    '--collect-submodules', 'webview',
    '--collect-data', 'webview'
)

foreach ($entry in $assetEntries) {
    $source = Join-Path $projectRoot $entry
    if (-not (Test-Path -LiteralPath $source)) { throw "缺少运行文件：$source" }
    $relativeParent = Split-Path -Parent $entry
    # PyInstaller copies a directory's *contents* into its destination.
    # Keep each asset directory name in the destination so relative URLs work.
    $target = if (Test-Path -LiteralPath $source -PathType Container) {
        Join-Path 'app_content' $entry
    } elseif ($relativeParent) {
        Join-Path 'app_content' $relativeParent
    } else {
        'app_content'
    }
    $args += @('--add-data', "$source;$target")
}
$args += (Join-Path $projectRoot 'desktop_app.py')

& python -m PyInstaller @args
if ($LASTEXITCODE -ne 0) { throw "PyInstaller 构建失败，退出码 $LASTEXITCODE" }

$exe = Join-Path $projectRoot '桌面版输出/EUS_Surgery_Explainer/EUS_Surgery_Explainer.exe'
if (-not (Test-Path -LiteralPath $exe)) { throw "构建后找不到程序：$exe" }
$contentRoot = Join-Path $projectRoot '桌面版输出/EUS_Surgery_Explainer/_internal/app_content'
foreach ($relativeAsset in @(
    'media/two_d_surgery/eus_ge_obstruction_base_v1.png',
    'media/official_photos/02_eus_scope_angle1_full.jpg',
    'media/models/cecum_appendix/cecum_appendix.data.js'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $contentRoot $relativeAsset))) {
        throw "构建后素材路径错误：$relativeAsset"
    }
}
& node (Join-Path $projectRoot 'tests/desktop-assets.cjs') $contentRoot
if ($LASTEXITCODE -ne 0) { throw '构建后的运行素材引用检查失败。' }
Write-Host "桌面程序已生成：$exe"
