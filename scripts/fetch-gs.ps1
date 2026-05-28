# scripts/fetch-gs.ps1
# Downloads Ghostscript 10.07.1 portable for Windows x64 and places the
# console binary + DLL at src-tauri/binaries/ under Tauri's expected
# sidecar name (gs-<target-triple>.exe).
#
# Tauri externalBin picks the file matching the host target triple at
# bundle time.
#
# Usage:  pwsh ./scripts/fetch-gs.ps1

$ErrorActionPreference = "Stop"

$GS_VERSION = "10.07.1"
$GS_TAG     = "gs10071"
# Official Artifex release: gs<ver>w64.exe is the installer; portable zip lives
# on the Ghostscript download page. We use the GitHub releases mirror which
# ships the same files.
$URL = "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/$GS_TAG/$GS_TAG`w64.exe"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BinDir   = Join-Path $RepoRoot "src-tauri/binaries"
$Triple   = "x86_64-pc-windows-msvc"
$OutExe   = Join-Path $BinDir "gs-$Triple.exe"
$OutDll   = Join-Path $BinDir "gsdll64.dll"

if (Test-Path $OutExe) {
    Write-Host "[fetch-gs] $OutExe already exists, skipping."
    exit 0
}

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$Tmp = New-Item -ItemType Directory -Force -Path (Join-Path $env:TEMP "qyra-gs-$([guid]::NewGuid())")
try {
    $Installer = Join-Path $Tmp "gs.exe"
    Write-Host "[fetch-gs] Downloading Ghostscript $GS_VERSION ..."
    Invoke-WebRequest -Uri $URL -OutFile $Installer -UseBasicParsing

    # The Ghostscript installer is built with Inno-style 7-Zip SFX; pass /S to
    # extract silently to a temp dir without running setup, then copy the
    # console binary out.
    $Extract = Join-Path $Tmp "extract"
    New-Item -ItemType Directory -Force -Path $Extract | Out-Null
    Write-Host "[fetch-gs] Extracting (silent install to $Extract) ..."
    & $Installer /S /D=$Extract | Out-Null

    $SrcExe = Join-Path $Extract "bin\gswin64c.exe"
    $SrcDll = Join-Path $Extract "bin\gsdll64.dll"
    if (-not (Test-Path $SrcExe)) { throw "gswin64c.exe not found after extract at $SrcExe" }
    if (-not (Test-Path $SrcDll)) { throw "gsdll64.dll not found after extract at $SrcDll" }

    Copy-Item -Force $SrcExe $OutExe
    Copy-Item -Force $SrcDll $OutDll
    Write-Host "[fetch-gs] OK -> $OutExe"
    Write-Host "[fetch-gs] OK -> $OutDll"
} finally {
    Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
}
