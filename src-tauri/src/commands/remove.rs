use lopdf::Document;
use crate::utils::paths::temp_output_path;

/// Remove pages from a PDF. Pages are 1-indexed.
#[tauri::command]
pub fn remove_pages(
    path: String,
    pages: Vec<u32>,
    output: Option<String>,
) -> Result<String, String> {
    if pages.is_empty() {
        return Err("No pages specified".into());
    }

    let mut doc = Document::load(&path).map_err(|e| e.to_string())?;
    doc.delete_pages(&pages);

    let out = output.unwrap_or_else(|| temp_output_path(&path, "removed"));
    doc.save(&out).map_err(|e| e.to_string())?;
    Ok(out)
}
