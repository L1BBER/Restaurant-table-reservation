# Local development only. Both servers bind to loopback by default.
$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$env:HOST = "127.0.0.1"
Start-Process -FilePath "node.exe" -ArgumentList "server/server.js" -WorkingDirectory $ProjectDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ProjectDir "api.out.log") -RedirectStandardError (Join-Path $ProjectDir "api.err.log")
Start-Process -FilePath "py.exe" -ArgumentList @("-m", "http.server", "8000", "--bind", "127.0.0.1") -WorkingDirectory $ProjectDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ProjectDir "web.out.log") -RedirectStandardError (Join-Path $ProjectDir "web.err.log")
Write-Host "Frontend: http://localhost:8000"
Write-Host "API: http://localhost:3000/health"
Write-Host "Servers run in the background. Logs are local and ignored by Git."
