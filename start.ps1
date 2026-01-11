# start.ps1 — IP check -> update script.js -> 2s delay -> start servers
$ErrorActionPreference = "Stop"

$ProjectDir = "C:\Users\maxab\WebstormProjects\reservation"
$ScriptPath = Join-Path $ProjectDir "script.js"

# 1) Sprawdź / wybierz aktualny IPv4 (preferuj Wi-Fi)
$ipList = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -notlike "127.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object IPAddress, InterfaceAlias

if (-not $ipList -or $ipList.Count -eq 0) {
  Write-Host "Nie znaleziono IPv4. Sprawdź połączenie sieciowe." -ForegroundColor Red
  exit 1
}

# Preferuj Wi-Fi, potem Ethernet, potem cokolwiek
$ip = ($ipList | Where-Object { $_.InterfaceAlias -match "Wi-Fi" } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ip) { $ip = ($ipList | Where-Object { $_.InterfaceAlias -match "Ethernet" } | Select-Object -First 1 -ExpandProperty IPAddress) }
if (-not $ip) { $ip = ($ipList | Select-Object -First 1 -ExpandProperty IPAddress) }

Write-Host "Dostępne IPv4:" -ForegroundColor DarkGray
$ipList | ForEach-Object { Write-Host (" - {0} ({1})" -f $_.IPAddress, $_.InterfaceAlias) -ForegroundColor DarkGray }

Write-Host ("Wybrany IPv4: {0}" -f $ip) -ForegroundColor Cyan

# 2) Podmień API_URL w script.js (cała linijka)
if (-not (Test-Path $ScriptPath)) {
  Write-Host "Nie znaleziono script.js: $ScriptPath" -ForegroundColor Red
  exit 1
}

$content = Get-Content $ScriptPath -Raw

$pattern = 'const\s+API_URL\s*=\s*".*?:3000/api/tables";'
$replacement = 'const API_URL = "http://' + $ip + ':3000/api/tables";'

$newContent = [regex]::Replace($content, $pattern, $replacement)

if ($newContent -eq $content) {
  Write-Host "Uwaga: nie znalazłem linijki API_URL w script.js (sprawdź czy jest const API_URL = ""...:3000/api/tables"";)" -ForegroundColor Yellow
} else {
  Set-Content -Path $ScriptPath -Value $newContent -Encoding UTF8
  Write-Host ("Zaktualizowano API_URL -> http://{0}:3000/api/tables" -f $ip) -ForegroundColor Green
}

# 3) Zatrzymanie na 2 sekundy
Write-Host "Czekam 2 sekundy..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# 4) Start Node (Express) — w osobnym oknie
Write-Host "Startuję Node server.js..." -ForegroundColor Cyan
Start-Process -WorkingDirectory $ProjectDir -FilePath "powershell.exe" -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$ProjectDir`"; node server\server.js"
)

# 5) Start Python http.server 8000 — w osobnym oknie
Write-Host "Startuję Python http.server 8000..." -ForegroundColor Cyan
Start-Process -WorkingDirectory $ProjectDir -FilePath "powershell.exe" -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$ProjectDir`"; py -m http.server 8000"
)

Write-Host ""
Write-Host "Otwórz na tym PC:    http://localhost:8000" -ForegroundColor White
Write-Host ("Otwórz na telefonie: http://{0}:8000" -f $ip) -ForegroundColor White
Write-Host ("API:                http://{0}:3000/api/tables" -f $ip) -ForegroundColor White
