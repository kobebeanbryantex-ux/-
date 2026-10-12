$ErrorActionPreference = 'Stop'

$target = Join-Path $PSScriptRoot 'index.html'
$temporary = Join-Path $PSScriptRoot 'index.stopmotion-update.tmp'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$html = [System.IO.File]::ReadAllText($target, $utf8)
$optimizer = '  <script src="stopmotion_optimizer.js?v=20260911-4"></script>'
$twoD = '  <script src="two_d_workspace.js?v=20260917-22"></script>'
$combined = $optimizer + [Environment]::NewLine + $twoD

if ($html.Contains($combined)) {
  Write-Output '2D workspace links are already present.'
  exit 0
}

if ($html.Contains($optimizer)) {
  $updated = $html.Replace($optimizer, $combined)
} else {
  $closingBody = $html.LastIndexOf('</body>', [System.StringComparison]::OrdinalIgnoreCase)
  if ($closingBody -lt 0) { throw 'Closing body tag was not found.' }
  $updated = $html.Insert($closingBody, $combined + [Environment]::NewLine)
}

[System.IO.File]::WriteAllText($temporary, $updated, $utf8)
[System.IO.File]::Copy($temporary, $target, $true)
[System.IO.File]::Delete($temporary)
Write-Output 'Linked 2D workspace files.'
