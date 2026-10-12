# Capture current editable source + runtime assets, never from a built app.
param([string]$PackageName = 'EUS_手术解说工具_最新源码_20261011')
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$verifyParent = Join-Path $sourceRoot 'scratch_verify'
if ($PackageName -notmatch '^[\p{L}\p{N}_-]+$') { throw '源码包名称含不安全字符。' }
$workRoot = Join-Path $verifyParent ($PackageName + '_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$stageRoot = Join-Path $workRoot $PackageName
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
$files = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($file in Get-ChildItem -LiteralPath $sourceRoot -File) {
    if ($file.Extension -in @('.js', '.css', '.py', '.ps1', '.md', '.jpg', '.png') -or $file.Name -eq 'index.html') {
        $files.Add($file)
    }
}
foreach ($folder in @(
    'scripts', 'tools', 'tests', 'media',
    '00_AI自主生成顶级医学照片库', '01_器械360度高清图片帧',
    '02_手术推演连贯高清图片帧/00_AI纯净全流程定格帧',
    '03_开源BodyParts3D提取模型'
)) {
    $directory = Join-Path $sourceRoot $folder
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) { throw "缺少源目录：$folder" }
    foreach ($file in Get-ChildItem -LiteralPath $directory -Recurse -File) {
        if ($file.FullName -notmatch '[\\/](__pycache__|node_modules|\.git)[\\/]' -and $file.Extension -ne '.pyc') {
            $files.Add($file)
        }
    }
}
# Keep small provenance documents, not original lecture videos or presentations.
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $sourceRoot '资料') -File) {
    if ($file.Extension -in @('.txt', '.md', '.pdf', '.doc', '.jpg', '.png')) { $files.Add($file) }
}
# The appendix extraction script uses this reference atlas; do not include the
# obsolete frontend checkout beside it.
$referenceModel = Join-Path $sourceRoot 'EUS_手术解说工具/06_前端项目/public/models/digestive_system.glb'
if (Test-Path -LiteralPath $referenceModel -PathType Leaf) { $files.Add((Get-Item -LiteralPath $referenceModel)) }
$manifest = foreach ($file in $files | Sort-Object FullName -Unique) {
    $relative = [IO.Path]::GetRelativePath($sourceRoot, $file.FullName)
    $destination = Join-Path $stageRoot $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    Copy-Item -LiteralPath $file.FullName -Destination $destination
    if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $sourceHash) {
        throw "复制前后内容不同：$relative"
    }
    [pscustomobject]@{ path = $relative.Replace('\', '/'); bytes = $file.Length; sha256 = $sourceHash }
}
[IO.File]::WriteAllText((Join-Path $stageRoot 'SOURCE_MANIFEST.json'), ($manifest | ConvertTo-Json -Depth 4), [Text.UTF8Encoding]::new($false))
[pscustomobject]@{
    source = $sourceRoot; stage = $stageRoot; work = $workRoot
    copiedFiles = $manifest.Count; sourceBytes = ($manifest | Measure-Object bytes -Sum).Sum
} | ConvertTo-Json
