# Opens 3 PowerShell windows running cloudflared quick tunnel to gateways 5003, 5001, 5002.
# Copy the https://....trycloudflare.com URL from EACH window into Render env vars.
# Requires: cloudflared installed; antilogin (5003), ai-gateway (5001), upload-ai-gateway (5002) already running.

$ErrorActionPreference = "Stop"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Error "cloudflared not found in PATH. Install: winget install Cloudflare.cloudflared"
}

$tunnels = @(
    @{ Port = 5003; Label = "antilogin (ANTI_SPOOF) -> copy URL for ANTI_SPOOF_PREDICT_URL" },
    @{ Port = 5001; Label = "ai-gateway (DETECT/COMPARE) -> copy URL for AI_GATEWAY_*" },
    @{ Port = 5002; Label = "upload-ai -> copy URL for UPLOAD_AI_PREDICT_URL" }
)

foreach ($t in $tunnels) {
    $title = "cloudflared :$($t.Port) $($t.Label)"
    $cmd = "Write-Host '=== $($t.Label) ===' -ForegroundColor Cyan; cloudflared tunnel --url http://127.0.0.1:$($t.Port)"
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", $cmd)
    Start-Sleep -Milliseconds 400
}

Write-Host ""
Write-Host "Three tunnel windows opened. Copy each https://....trycloudflare.com URL into Render (see docs/HUONG-DAN-QUICK-TUNNEL-BAO-VE.md)." -ForegroundColor Green
