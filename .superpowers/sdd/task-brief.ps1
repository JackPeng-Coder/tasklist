param([string]$Plan = "docs\superpowers\plans\2026-08-14-tasklist-app.md", [int]$N)
$lines = Get-Content $Plan
$out = @()
$infence = $false
$intask = $false
$pattern = "^#{1,6}[ \t]+Task[ \t]+[0-9]+"
foreach ($line in $lines) {
  if ($line -match '^```') { $infence = -not $infence }
  if (-not $infence -and $line -match $pattern) {
    if ($line -match ("^#{1,6}[ \t]+Task[ \t]+" + $N + "([^0-9]|$)")) { $intask = $true } else { $intask = $false }
  }
  if ($intask) { $out += $line }
}
$dir = ".superpowers\sdd"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$file = Join-Path $dir ("task-" + $N + "-brief.md")
Set-Content -Path $file -Value ($out -join "`n") -Encoding UTF8
if ($out.Count -eq 0) { Write-Error "task $N not found"; exit 3 }
Write-Output "wrote $file : $($out.Count) lines"
