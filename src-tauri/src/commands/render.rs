use std::path::Path;
use base64::Engine;

/// Reads a PDF file and returns it as a base64 string for frontend rendering via PDF.js.
/// Runs in a blocking thread pool so the Tauri host process (and native window) stays responsive.
#[tauri::command]
pub async fn read_pdf_bytes(path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
        Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Legacy placeholder — kept for API compatibility but frontend now uses PDF.js via read_pdf_bytes.
#[tauri::command]
pub fn render_thumbnail(path: String, _page: u32, _dpi: Option<u32>) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("File not found: {}", path));
    }
    Err("Use read_pdf_bytes + PDF.js for rendering".to_string())
}

/// Export all pages of a PDF as image file paths.
/// Returns the expected output paths (actual rendering requires mupdf-rs).
#[tauri::command]
pub fn pdf_to_images(
    path: String,
    format: Option<String>,
    _dpi: Option<u32>,
    output_dir: Option<String>,
) -> Result<Vec<String>, String> {
    if !Path::new(&path).exists() {
        return Err(format!("File not found: {}", path));
    }

    let fmt = format.unwrap_or_else(|| "png".to_string()).to_lowercase();
    let stem = Path::new(&path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("page");
    let dir = output_dir.unwrap_or_else(|| std::env::temp_dir().to_string_lossy().to_string());

    let doc = lopdf::Document::load(&path).map_err(|e| e.to_string())?;
    let total = doc.get_pages().len();

    let paths: Vec<String> = (1..=total)
        .map(|i| format!("{}/{}_page{:04}.{}", dir, stem, i, fmt))
        .collect();

    // TODO: Integrate mupdf-rs / pdfium-rs for actual rendering
    Err(format!(
        "PDF→Images rendering not yet implemented (would output {} files to {})",
        total, dir
    ))
}
