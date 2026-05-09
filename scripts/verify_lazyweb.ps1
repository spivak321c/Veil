<# Verify Lazyweb MCP setup and run a sample query if possible #>
param()

$ErrorActionPreference = 'Stop'

$token = '96c83f77-62d4-4154-b6e0-64c7f405fbac'
$mcpUrl = 'https://www.lazyweb.com/mcp'

Write-Host 'Verifying setup...'

# 1) Check local token file exists
$tokenPath = Join-Path $Env:USERPROFILE '.lazyweb\lazyweb_mcp_token'
if (Test-Path $tokenPath) {
  $readToken = Get-Content -Path $tokenPath -ErrorAction SilentlyContinue
  if ($readToken -eq $token) {
    Write-Host 'Token file present and matches expected token.'
  } else {
    Write-Warning 'Token file present but does not match expected value.'
  }
} else {
  Write-Warning 'Token file not found at $tokenPath'
}

# 2) Check .cursor/skll exists
if (Test-Path '.cursor/skills/lazyweb/SKILL.md') {
  Write-Host 'Lazyweb SKILL.md found in .cursor/skills/lazyweb/SKILL.md'
} else {
  Write-Warning 'Lazyweb SKILL.md not found at .cursor/skills/lazyweb/SKILL.md'
}

# 3) Try to list MCP tools via HTTP (best-effort)
try {
  $toolsResp = Invoke-RestMethod -Uri "$mcpUrl/tools" -Headers @{Authorization = "Bearer $token"} -Method Get -ErrorAction Stop
  Write-Host 'MCP tools response:'
  $toolsResp | ConvertTo-Json -Depth 2
} catch {
  Write-Warning 'Could not fetch MCP tools (endpoint may be unavailable locally).'
}

# 4) Run a sample search if possible
try {
  $query = @{ query = 'pricing page'; limit = 3 } | ConvertTo-Json
  $searchResp = Invoke-RestMethod -Uri "$mcpUrl/search" -Headers @{Authorization = "Bearer $token"} -Method Post -ContentType 'application/json' -Body $query -ErrorAction Stop
  Write-Host 'MCP search results:'
  $searchResp | ConvertTo-Json -Depth 2
} catch {
  Write-Warning 'Could not perform MCP search (endpoint may be unavailable locally).'
}

Write-Host 'Lazyweb verification script completed.'
