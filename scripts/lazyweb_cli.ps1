<# Lightweight Lazyweb CLI (PowerShell) to call MCP endpoints. #>
param(
  [Parameter(Mandatory=$true)][ValidateSet('health','search')][string]$cmd,
  [Parameter(Mandatory=$false)][string]$payloadJson
)

$ErrorActionPreference = 'Stop'

$tokenPath = Join-Path $Env:USERPROFILE '.lazyweb\lazyweb_mcp_token'
if (-not (Test-Path $tokenPath)) {
  Write-Error 'Lazyweb MCP token not found at $tokenPath. Run the setup script first.'
  exit 1
}
$token = Get-Content -Path $tokenPath -ErrorAction Stop
$mcpUrl = 'https://www.lazyweb.com/mcp'

switch ($cmd) {
  'health' {
    try {
      $resp = Invoke-RestMethod -Uri "$mcpUrl/health" -Headers @{Authorization = "Bearer $token"} -Method Get -ErrorAction Stop
      $resp | ConvertTo-Json -Depth 2
    } catch {
      Write-Error "Health check failed: $_"
      exit 2
    }
  }
  'search' {
    if (-not $payloadJson) {
      Write-Error 'Payload JSON required for search command.'
      exit 3
    }
    try {
      $payload = $payloadJson | ConvertFrom-Json
      $body = $payloadJson
      $resp = Invoke-RestMethod -Uri "$mcpUrl/search" -Headers @{Authorization = "Bearer $token"} -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop
      $resp | ConvertTo-Json -Depth 2
    } catch {
      Write-Error "Search failed: $_"
      exit 4
    }
  }
}
