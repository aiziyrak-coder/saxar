#Requires -Version 5.1
<#
.SYNOPSIS
  SaxarERP: main branchni GitHubga push (tarmoq xatolari uchun qayta urinish + yo'riqnoma).

.DESCRIPTION
  Loyiha ildizidan ishga tushiring:
    .\scripts\push-to-github.ps1

  Agar DNS/HTTPS ishlamasa — skript oxirida alternativlar chiqadi.
#>
$ErrorActionPreference = 'Continue'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$remote = 'origin'
$branch = 'main'

Write-Host '=== SaxarERP -> GitHub push ===' -ForegroundColor Cyan
git status -sb

$null = git fetch $remote $branch 2>&1
$ahead = git rev-list --count "${remote}/${branch}..HEAD" 2>$null
if ([string]::IsNullOrWhiteSpace($ahead)) { $ahead = '0' }
if ($ahead -eq '0') {
  Write-Host "Hech narsa push qilinmaydi: HEAD = ${remote}/${branch}." -ForegroundColor Green
  exit 0
}

Write-Host "Push qilinadigan commitlar soni: $ahead" -ForegroundColor Yellow
git log "${remote}/${branch}..HEAD" --oneline

$maxAttempts = 5
for ($i = 1; $i -le $maxAttempts; $i++) {
  Write-Host "`nUrinish $i / $maxAttempts ..." -ForegroundColor Cyan
  git -c http.version=HTTP/1.1 push $remote $branch
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'Push muvaffaqiyatli.' -ForegroundColor Green
    exit 0
  }
  if ($i -lt $maxAttempts) {
    $delay = [Math]::Min(16, 2 * $i)
    Write-Host "Kutish ${delay}s..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $delay
  }
}

Write-Host @'

--- Push ishlamadi: tekshirish tartibi ---

1) DNS (Could not resolve host):
   ipconfig /flushdns
   Tarmoq -> DNS server: 8.8.8.8 va 8.8.4.4 (yoki 1.1.1.1)

2) HTTPS token / login:
   git credential-manager clear
   Keyingi pushda GitHub PAT yoki brauzer orqali kirish

3) SSH (HTTPS blok bo'lsa):
   git remote set-url origin git@github.com:aiziyrak-coder/saxar.git
   ssh -T git@github.com

4) SSH faqat 443 orqali (22-port blok):
   %USERPROFILE%\.ssh\config faylida:
   Host github.com
     HostName ssh.github.com
     User git
     Port 443

5) VPN yoki mobil internet

6) Boshqa mashinadan: bundle (USB / email):
   git bundle create saxar-ahead.bundle origin/main..HEAD
   (qabul qiluvchida: git pull saxar-ahead.bundle main)
'@ -ForegroundColor Yellow

exit 1
