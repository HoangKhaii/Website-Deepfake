# Opens 3 PowerShell windows: antilogin 5003, ai-gateway 5001, upload-ai-gateway 5002
# Run AFTER start-local-fastapi.ps1 (6 windows total with FastAPI).
# If a folder has no node_modules, npm install runs first (upload-ai may print audit/multer warnings — normal).

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$gateways = @(
    "antilogin-gateway",
    "ai-gateway",
    "upload-ai-gateway"
)

foreach ($name in $gateways) {
    $dir = Join-Path $ProjectRoot $name
    if (-not (Test-Path $dir)) {
        Write-Error "Missing: $dir"
    }
    $cmd = "Set-Location -LiteralPath '$dir'; Write-Host '=== $name ===' -ForegroundColor Cyan; if (-not (Test-Path node_modules)) { npm install }; npm start"
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", $cmd)
    Start-Sleep -Milliseconds 500
}

Write-Host "Opened 3 gateway windows. Test: http://127.0.0.1:5003/health" -ForegroundColor Green
