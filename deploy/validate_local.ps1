# Mahalliy audit: tsc, eslint, build, Django test
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== tsc ===" -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== eslint ===" -ForegroundColor Cyan
npx eslint src/ --max-warnings 0
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== vite build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== Django health test ===" -ForegroundColor Cyan
Push-Location backend
python manage.py test accounts.tests.HealthCheckTests
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "=== OK: mahalliy tekshiruvlar o'tdi ===" -ForegroundColor Green
