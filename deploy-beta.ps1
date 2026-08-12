# Rad Balek — one-command beta release to Firebase App Distribution.
# Usage: .\deploy-beta.ps1 "release notes here"
param([string]$Notes = "Rad Balek beta update")

$env:PATH = "C:\AISX\_toolchain\flutter\bin;" + $env:PATH
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\AISX\algeria-ews\firebase-sa.json"
Set-Location C:\AISX\algeria-ews\app

flutter build apk --release --split-per-abi
# $LASTEXITCODE, NOT $?: flutter writes warnings to stderr, and when this script
# is piped (2>&1 | Tee-Object) PowerShell wraps those in ErrorRecords and sets
# $? to false even on a successful build — which silently skipped distribution.
if ($LASTEXITCODE -ne 0) { Write-Error "build failed (exit $LASTEXITCODE)"; exit 1 }

# Notes go through a UTF-8 file, NOT --release-notes: a multi-line string passed
# as a CLI arg gets mangled by the npx.ps1 shim, which silently drops --groups
# (release uploads but "no groups specified, skipping" — testers never notified).
$notesFile = Join-Path $env:TEMP "radbalek-notes.txt"
Set-Content -Path $notesFile -Value $Notes -Encoding utf8

npx -y firebase-tools appdistribution:distribute `
  build\app\outputs\flutter-apk\app-arm64-v8a-release.apk `
  --app "1:417978910896:android:6876c3f373ca05e3a31375" `
  --release-notes-file "$notesFile" `
  --groups "famille"

Write-Output "Done. Testers in group 'famille' get an update notification."
