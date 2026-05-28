// commands/compress_gs.rs
//
// Ghostscript-based compression. Spawns the vendored `gs` sidecar with
// `-dPDFSETTINGS=/<preset>` to do real image downsampling (JPEG2000/JBIG2 +
// DCT recompression), which the pure-Rust zlib path in compress.rs cannot do.
// Typical savings on scanned PDFs: 60-80% vs ~10% from zlib alone.
//
// Sidecar lookup order:
//   1. Bundled: next to the main executable, named `gs(.exe)`.
//      Tauri's `externalBin` config places binaries with the target-triple
//      suffix stripped at bundle time.
//   2. Dev:     CARGO_MANIFEST_DIR/binaries/gs-<target-triple>(.exe).
//      Populated by scripts/fetch-gs.{ps1,sh}.

use std::fs;
use std::path::PathBuf;
use std::process::Command;

use serde::Serialize;
use tauri::Emitter;

/// Apply OS-specific low-priority scheduling to a Command before spawn so the
/// Ghostscript process does not starve the UI thread or other apps on the box.
/// Total CPU work is unchanged — only the kernel scheduling priority drops.
#[cfg(windows)]
fn lower_priority(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    // BELOW_NORMAL_PRIORITY_CLASS = 0x00004000
    // CREATE_NO_WINDOW            = 0x08000000  (suppress console flash)
    cmd.creation_flags(0x00004000 | 0x08000000);
}

#[cfg(unix)]
fn lower_priority(cmd: &mut Command) {
    use std::os::unix::process::CommandExt;
    unsafe {
        cmd.pre_exec(|| {
            // nice +10 — same as `nice -n 10 gs ...`
            libc::nice(10);
            Ok(())
        });
    }
}

use crate::error::{AppError, AppResult};
use crate::utils::paths::temp_output_path;
use crate::utils::progress::Progress;

#[derive(Serialize)]
pub struct GsCompressResult {
    pub path: String,
    pub original_bytes: u64,
    pub compressed_bytes: u64,
    pub preset: String,
}

const VALID_PRESETS: &[&str] = &["screen", "ebook", "printer", "prepress"];

fn current_target_triple() -> &'static str {
    // Matches the triples produced by rustup for Tauri build targets.
    if cfg!(all(target_os = "windows", target_arch = "x86_64")) {
        "x86_64-pc-windows-msvc"
    } else if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        "aarch64-apple-darwin"
    } else if cfg!(all(target_os = "macos", target_arch = "x86_64")) {
        "x86_64-apple-darwin"
    } else if cfg!(all(target_os = "linux", target_arch = "x86_64")) {
        "x86_64-unknown-linux-gnu"
    } else if cfg!(all(target_os = "linux", target_arch = "aarch64")) {
        "aarch64-unknown-linux-gnu"
    } else {
        ""
    }
}

fn find_gs_binary() -> Option<PathBuf> {
    let ext = if cfg!(windows) { ".exe" } else { "" };

    // 1. Bundled — next to main exe.
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let bundled = dir.join(format!("gs{ext}"));
            if bundled.exists() {
                return Some(bundled);
            }
        }
    }

    // 2. Dev — src-tauri/binaries/gs-<triple>(.exe).
    let triple = current_target_triple();
    if !triple.is_empty() {
        let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("binaries")
            .join(format!("gs-{triple}{ext}"));
        if dev.exists() {
            return Some(dev);
        }
    }

    None
}

#[tauri::command]
pub async fn compress_pdf_gs(
    path: String,
    output: Option<String>,
    preset: Option<String>,
    app_handle: tauri::AppHandle,
) -> AppResult<GsCompressResult> {
    let preset = preset.unwrap_or_else(|| "ebook".to_string());
    if !VALID_PRESETS.contains(&preset.as_str()) {
        return Err(AppError::Invalid(format!(
            "Invalid Ghostscript preset '{preset}'. Allowed: {}",
            VALID_PRESETS.join(", ")
        )));
    }

    tokio::task::spawn_blocking(move || -> AppResult<GsCompressResult> {
        let gs = find_gs_binary().ok_or_else(|| {
            AppError::Other(
                "Ghostscript binary not found. Run scripts/fetch-gs.ps1 (Windows) \
                 or scripts/fetch-gs.sh (mac/linux) to vendor it."
                    .to_string(),
            )
        })?;

        let original_bytes = fs::metadata(&path)?.len();
        let out = output.unwrap_or_else(|| temp_output_path(&path, "gs-compressed"));

        let _ = app_handle.emit(
            "operation-progress",
            Progress::new(0, 1, format!("Ghostscript /{preset} ...")),
        );

        let mut cmd = Command::new(&gs);
        cmd.arg("-sDEVICE=pdfwrite")
            .arg("-dCompatibilityLevel=1.7")
            .arg(format!("-dPDFSETTINGS=/{preset}"))
            .arg("-dNOPAUSE")
            .arg("-dQUIET")
            .arg("-dBATCH")
            .arg("-dSAFER")
            .arg(format!("-sOutputFile={out}"))
            .arg(&path);
        lower_priority(&mut cmd);
        let status = cmd
            .status()
            .map_err(|e| AppError::Other(format!("failed to spawn ghostscript: {e}")))?;

        if !status.success() {
            return Err(AppError::Other(format!(
                "ghostscript exited with status {status}"
            )));
        }

        let compressed_bytes = fs::metadata(&out)?.len();

        // If GS made it bigger (rare on small native-text PDFs), copy original.
        let compressed_bytes = if compressed_bytes >= original_bytes {
            fs::copy(&path, &out)?;
            original_bytes
        } else {
            compressed_bytes
        };

        let _ = app_handle.emit(
            "operation-progress",
            Progress::new(1, 1, format!("Ghostscript /{preset} done")),
        );

        Ok(GsCompressResult {
            path: out,
            original_bytes,
            compressed_bytes,
            preset,
        })
    })
    .await
    .map_err(|e| AppError::Other(e.to_string()))?
}
