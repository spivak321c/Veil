<# Automated Lazyweb MCP setup (Windows/PowerShell friendly).
This script writes the bearer token to the user home, configures Codex placeholder, and prepares local MCP config.
#>
param()

$ErrorActionPreference = 'Stop'

$token = '96c83f77-62d4-4154-b6e0-64c7f405fbac'
$mcpUrl = 'https://www.lazyweb.com/mcp'

# 1) Write token to user home (hidden config)
$lazywebDir = Join-Path $Env:USERPROFILE '.lazyweb'
if (-not (Test-Path $lazywebDir)) {
  New-Item -ItemType Directory -Path $lazywebDir -Force | Out-Null
}
$tokenPath = Join-Path $lazywebDir 'lazyweb_mcp_token'
Set-Content -Path $tokenPath -Value $token -Force
Write-Host "Wrote Lazyweb MCP token to $tokenPath"

# 2) Codex integration (if Codex is installed locally with a known config path)
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $Env:USERPROFILE '.codex' }
try {
  if (Test-Path $codexHome) {
    $configPath = Join-Path $codexHome 'config.toml'
    if (-not (Test-Path $configPath)) {
      New-Item -ItemType File -Path $configPath -Force | Out-Null
    }
    $content = "[plugins]`nlazyweb@lazyweb = true`n"
    if (-not (Select-String -Quiet -Pattern 'lazyweb@lazyweb' -Path $configPath)) {
      Add-Content -Path $configPath -Value $content
    }
    Write-Host "Configured Codex plugin flag in $configPath (lazyweb@lazyweb = true)"
  } else {
    Write-Host "Codex home not found at $codexHome; skipping config.toml update."
  }
} catch {
  Write-Warning "Codex config update skipped: $($_.Exception.Message)"
}

# 3) Guidance for users to perform marketplace installation
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host '  - Run: codex plugin marketplace add https://github.com/aboul3ata/lazyweb-skill' -ForegroundColor Yellow
Write-Host '  - Ensure [plugins."lazyweb@lazyweb"] enabled = true in CODEX_HOME/.codex/config.toml' -ForegroundColor Yellow
Write-Host '  - Restart Codex to apply changes' -ForegroundColor Yellow

Write-Host "`nLazyweb MCP setup script completed." -ForegroundColor Green
