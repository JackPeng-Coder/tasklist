param([string]$Base, [string]$Head, [string]$OutFile)
$lines = @()
$lines += "# Review package: ${Base}..${Head}"
$lines += ""
$lines += "## Commits"
$lines += (git log --oneline "${Base}..${Head}") -join "`n"
$lines += ""
$lines += "## Files changed"
$lines += (git diff --stat "${Base}..${Head}") -join "`n"
$lines += ""
$lines += "## Diff"
$lines += (git diff -U10 "${Base}..${Head}") -join "`n"
$dir = ".superpowers\sdd"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
if (-not $OutFile) {
  $b = git rev-parse --short $Base
  $h = git rev-parse --short $Head
  $OutFile = Join-Path $dir "review-${b}..${h}.diff"
}
Set-Content -Path $OutFile -Value ($lines -join "`n") -Encoding UTF8
$count = git rev-list --count "${Base}..${Head}"
Write-Output "wrote $OutFile : $count commit(s), $((Get-Item $OutFile).Length) bytes"
