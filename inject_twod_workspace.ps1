$ErrorActionPreference = 'Stop'

$target = Join-Path $PSScriptRoot 'index.html'
$temporary = Join-Path $PSScriptRoot 'index.twod-update.tmp'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$html = [System.IO.File]::ReadAllText($target, $utf8)
$old = '  <script src="stopmotion_optimizer.js?v=20260911-4"></script>'
$current = $old + [Environment]::NewLine + '  <script src="two_d_workspace.js?v=20260917-21"></script>'
$previous = $old + [Environment]::NewLine + '  <script src="two_d_workspace.js?v=20260917-20"></script>'
$new = $old + [Environment]::NewLine + '  <script src="two_d_workspace.js?v=20260917-22"></script>'

if ($html.Contains($new)) {
  Write-Output '2D workspace is already linked.'
  exit 0
}
if ($html.Contains($current)) {
  [System.IO.File]::WriteAllText($temporary, $html.Replace($current, $new), $utf8)
  [System.IO.File]::Copy($temporary, $target, $true)
  [System.IO.File]::Delete($temporary)
  Write-Output 'Updated 2D workspace version.'
  exit 0
}
if ($html.Contains($previous)) {
  [System.IO.File]::WriteAllText($temporary, $html.Replace($previous, $new), $utf8)
  [System.IO.File]::Copy($temporary, $target, $true)
  [System.IO.File]::Delete($temporary)
  Write-Output 'Updated legacy 2D workspace version.'
  exit 0
}
if (-not $html.Contains($old)) { throw 'Expected script link was not found.' }

[System.IO.File]::WriteAllText($temporary, $html.Replace($old, $new), $utf8)
[System.IO.File]::Copy($temporary, $target, $true)
[System.IO.File]::Delete($temporary)
Write-Output 'Linked 2D workspace.'
