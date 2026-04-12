@echo off
title DeepCheck - frontend + backend
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js / npm not found. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\concurrently" (
  echo Installing root dev helper ^(concurrently^)...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting backend ^(5000^) and frontend ^(5173^)...
echo Close this window to stop both.
echo.
call npm run dev
pause
