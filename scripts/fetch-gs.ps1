# scripts/fetch-gs.ps1
# Downloads Ghostscript 10.07.1 for Windows x64 and places the console
# binary + DLL at src-tauri/binaries/ under Tauri's expected sidecar name
# (gs-<target-triple>.exe).
#
# Runs the official Inno Setup installer silently into a temp dir. The
# installer manifest requests admin elevation, so this script MUST be run
# from an elevated PowerShell (Run as Administrator) — you will get a
# 'The requested operation requires elevation' error otherwise.
#
# Usage (elevated PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\scripts\fetch-gs.ps1

$ErrorActionPreference = "Stop"

$GS_VERSION = "10.07.1"
$GS_TAG     = "gs10071"
$GS_URL     = "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/$GS_TAG/$GS_TAG`w64.exe"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BinDir   = Join-Path $RepoRoot "src-tauri/binaries"
$Triple   = "x86_64-pc-windows-msvc"
$OutExe   = Join-Path $BinDir "gs-$Triple.exe"
$OutDll   = Join-Path $BinDir "gsdll64.dll"

if ((Test-Path $OutExe) -and (Test-Path $OutDll)) {
    Write-Host "[fetch-gs] $OutExe + DLL already exist, skipping."
    exit 0
}

# Confirm elevation up-front to fail fast with a clear message.
$IsAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Write-Error "[fetch-gs] Must be run from an elevated PowerShell (Run as Administrator)."
    exit 1
}

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$Tmp = New-Item -ItemType Directory -Force -Path (Join-Path $env:TEMP "qyra-gs-$([guid]::NewGuid())")

try {
    $Installer = Join-Path $Tmp "gs.exe"
    Write-Host "[fetch-gs] Downloading Ghostscript $GS_VERSION ..."
    Invoke-WebRequest -Uri $GS_URL -OutFile $Installer -UseBasicParsing

    $Extract = Join-Path $Tmp "extract"
    New-Item -ItemType Directory -Force -Path $Extract | Out-Null
    Write-Host "[fetch-gs] Running silent installer into $Extract ..."
    $proc = Start-Process -FilePath $Installer `
        -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/SP-", "/DIR=`"$Extract`"" `
        -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0) {
        throw "Ghostscript installer exited with code $($proc.ExitCode)"
    }

    $SrcExe = Join-Path $Extract "bin\gswin64c.exe"
    $SrcDll = Join-Path $Extract "bin\gsdll64.dll"
    if (-not (Test-Path $SrcExe)) { throw "gswin64c.exe not found at $SrcExe" }
    if (-not (Test-Path $SrcDll)) { throw "gsdll64.dll not found at $SrcDll" }

    Copy-Item -Force $SrcExe $OutExe
    Copy-Item -Force $SrcDll $OutDll
    Write-Host "[fetch-gs] OK -> $OutExe"
    Write-Host "[fetch-gs] OK -> $OutDll"
} finally {
    Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
