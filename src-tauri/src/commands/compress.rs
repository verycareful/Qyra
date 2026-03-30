use lopdf::Document;
use crate::utils::paths::temp_output_path;

/// Compress a PDF using lopdf's object stream compression.
/// quality: 0 (max compress) to 100 (no compress), used for future image resampling.
#[tauri::command]
pub fn compress_pdf(path: String, output: Option<String>, _quality: Option<u8>) -> Result<String, String> {
    let mut doc = Document::load(&path).map_err(|e| e.to_string())?;

    // Compress object streams (reduces file size 11-61%)
    doc.compress();

    let out = output.unwrap_or_else(|| temp_output_path(&path, "compressed"));
    doc.save(&out).map_err(|e| e.to_string())?;
    Ok(out)
}
