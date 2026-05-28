#!/usr/bin/env bash
# scripts/fetch-gs.sh
# Downloads / locates Ghostscript binary for the current host and places it
# at src-tauri/binaries/gs-<target-triple>(.exe) for Tauri externalBin.
#
# macOS:  uses `brew install ghostscript` then copies /opt/homebrew/bin/gs
# Linux:  downloads official Artifex Linux x64 release tarball
#
# Run from repo root or scripts/ — auto-resolves repo root.

set -euo pipefail

GS_VERSION="10.07.1"
GS_TAG="gs10071"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$REPO_ROOT/src-tauri/binaries"
mkdir -p "$BIN_DIR"

uname_s="$(uname -s)"
uname_m="$(uname -m)"

case "$uname_s" in
    Darwin)
        case "$uname_m" in
            arm64)  TRIPLE="aarch64-apple-darwin" ;;
            x86_64) TRIPLE="x86_64-apple-darwin"  ;;
            *) echo "[fetch-gs] unsupported macOS arch: $uname_m" >&2; exit 1 ;;
        esac
        OUT="$BIN_DIR/gs-$TRIPLE"
        if [ -f "$OUT" ]; then echo "[fetch-gs] $OUT exists, skipping."; exit 0; fi
        if ! command -v brew >/dev/null 2>&1; then
            echo "[fetch-gs] Homebrew required on macOS. Install: https://brew.sh" >&2
            exit 1
        fi
        if ! command -v gs >/dev/null 2>&1; then
            echo "[fetch-gs] Installing ghostscript via brew ..."
            brew install ghostscript
        fi
        GS_BIN="$(command -v gs)"
        cp "$GS_BIN" "$OUT"
        chmod +x "$OUT"
        echo "[fetch-gs] OK -> $OUT"
        ;;
    Linux)
        case "$uname_m" in
            x86_64) TRIPLE="x86_64-unknown-linux-gnu" ;;
            aarch64) TRIPLE="aarch64-unknown-linux-gnu" ;;
            *) echo "[fetch-gs] unsupported linux arch: $uname_m" >&2; exit 1 ;;
        esac
        OUT="$BIN_DIR/gs-$TRIPLE"
        if [ -f "$OUT" ]; then echo "[fetch-gs] $OUT exists, skipping."; exit 0; fi
        URL="https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/$GS_TAG/ghostscript-$GS_VERSION-linux-x86_64.tgz"
        TMP="$(mktemp -d)"
        trap 'rm -rf "$TMP"' EXIT
        echo "[fetch-gs] Downloading Ghostscript $GS_VERSION linux x86_64 ..."
        curl -fsSL "$URL" -o "$TMP/gs.tgz"
        tar -xzf "$TMP/gs.tgz" -C "$TMP"
        SRC="$(find "$TMP" -type f -name 'gs-*-linux-x86_64' | head -n1)"
        if [ -z "$SRC" ]; then
            echo "[fetch-gs] failed to find gs binary in extracted tarball" >&2
            exit 1
        fi
        cp "$SRC" "$OUT"
        chmod +x "$OUT"
        echo "[fetch-gs] OK -> $OUT"
        ;;
    *)
        echo "[fetch-gs] unsupported host: $uname_s. Use scripts/fetch-gs.ps1 on Windows." >&2
        exit 1
        ;;
esac
