# Opens 3 PowerShell windows: Silent-Face :8010, deepfake_ai :8000, upload_ai :8001
# This IS the three "python -m api.main" processes — do not run them again manually.
# Next step: .\start-local-gateways.ps1 (3 more windows for Node gateways).
# Adjust $AIRoot if your folders are not next to back_font_end.

$ErrorActionPreference = "Stop"

$WebsiteDeepfake = Resolve-Path (Join-Path $PSScriptRoot "..")
$AIRoot = Resolve-Path (Join-Path $WebsiteDeepfake "..\..")

$silent = Join-Path $AIRoot "Silent-Face-Anti-Spoofing-master"
$deepfake = Join-Path $AIRoot "deepfake_ai"
$upload = Join-Path $AIRoot "upload_ai"

foreach ($pair in @(
        @{ Path = $silent; Name = "Silent-Face :8010"; Cmd = "python -m api.main" },
        @{ Path = $deepfake; Name = "deepfake_ai :8000"; Cmd = "python -m api.main" },
        @{ Path = $upload; Name = "upload_ai :8001"; Cmd = "python -m api.main" }
    )) {
    if (-not (Test-Path $pair.Path)) {
        Write-Warning "Skip (folder missing): $($pair.Path)"
        continue
    }
    $inner = "Set-Location -LiteralPath '$($pair.Path)'; Write-Host '=== $($pair.Name) ===' -ForegroundColor Cyan; $($pair.Cmd)"
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", $inner)
    Start-Sleep -Milliseconds 500
}

Write-Host "Opened 3 FastAPI windows from AIRoot: $AIRoot" -ForegroundColor Green
Write-Host "If python not found, activate venv first or edit this script." -ForegroundColor Yellow
