use crate::error::{AppError, AppResult};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};

/// Cached crash log directory — set once at startup via `install_panic_hook`
/// so the panic closure does not need access to the AppHandle.
pub struct CrashLogDir(pub Mutex<Option<PathBuf>>);

impl CrashLogDir {
    pub fn new() -> Self { Self(Mutex::new(None)) }
}

fn timestamped_filename() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("crash-{}.log", secs)
}

/// Install a panic hook that writes panic info + a backtrace into a per-crash
/// log file in `<app_data_dir>/crashes/`. Returns the resolved directory so the
/// startup wiring can stash it for later inspection.
pub fn install_panic_hook(app: &AppHandle) -> Option<PathBuf> {
    let data_dir = app.path().app_data_dir().ok()?;
    let crashes_dir = data_dir.join("crashes");
    let _ = fs::create_dir_all(&crashes_dir);

    let dir_for_hook = crashes_dir.clone();
    let previous_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let path = dir_for_hook.join(timestamped_filename());
        let payload_str = info.payload()
            .downcast_ref::<&'static str>()
            .map(|s| (*s).to_string())
            .or_else(|| info.payload().downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "(non-string payload)".to_string());
        let payload = format!(
            "Qyra panic at {:?}\n\nlocation: {}\npayload: {}\n\nbacktrace:\n{}\n",
            SystemTime::now(),
            info.location().map(|l| l.to_string()).unwrap_or_else(|| "unknown".into()),
            payload_str,
            std::backtrace::Backtrace::force_capture(),
        );
        let _ = fs::write(&path, payload);
        // Chain to the default handler so the panic still prints to stderr.
        previous_hook(info);
    }));

    Some(crashes_dir)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CrashLogEntry {
    pub path: String,
    pub filename: String,
    pub bytes: u64,
    pub modified_secs: u64,
    pub preview: String,
}

fn read_preview(path: &PathBuf, max_bytes: usize) -> String {
    match fs::read_to_string(path) {
        Ok(s) => {
            if s.len() <= max_bytes { s } else {
                let mut end = max_bytes;
                while !s.is_char_boundary(end) && end > 0 { end -= 1; }
                format!("{}…", &s[..end])
            }
        }
        Err(_) => String::new(),
    }
}

#[tauri::command]
pub fn list_crash_logs(dir: State<CrashLogDir>) -> AppResult<Vec<CrashLogEntry>> {
    let dir = dir.0.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    let Some(d) = dir.as_ref() else { return Ok(vec![]) };
    let mut out = Vec::new();
    let entries = match fs::read_dir(d) {
        Ok(e) => e,
        Err(_) => return Ok(vec![]),
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("log") { continue; }
        let meta = match entry.metadata() { Ok(m) => m, Err(_) => continue };
        let modified_secs = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let filename = path.file_name().and_then(|s| s.to_str()).unwrap_or("crash.log").to_string();
        out.push(CrashLogEntry {
            path: path.to_string_lossy().to_string(),
            filename,
            bytes: meta.len(),
            modified_secs,
            preview: read_preview(&path, 4096),
        });
    }
    out.sort_by(|a, b| b.modified_secs.cmp(&a.modified_secs));
    Ok(out)
}

#[tauri::command]
pub fn dismiss_crash_log(path: String) -> AppResult<()> {
    fs::remove_file(&path).map_err(|e| AppError::Other(format!("remove {}: {}", path, e)))?;
    Ok(())
}

#[tauri::command]
pub fn dismiss_all_crash_logs(dir: State<CrashLogDir>) -> AppResult<u32> {
    let dir = dir.0.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    let Some(d) = dir.as_ref() else { return Ok(0) };
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(d) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("log") {
                if fs::remove_file(&path).is_ok() { count += 1; }
            }
        }
    }
    Ok(count)
}
