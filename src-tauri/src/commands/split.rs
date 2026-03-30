use lopdf::{Document, Object};
use std::path::Path;
use crate::utils::paths::temp_dir_str;

#[derive(serde::Deserialize)]
pub struct PageRange {
    pub start: u32,
    pub end: u32,
}

/// Split a PDF by explicit page ranges. Each range produces one output file.
/// Pages are 1-indexed.
#[tauri::command]
pub fn split_pdf(
    path: String,
    ranges: Vec<PageRange>,
    output_dir: Option<String>,
) -> Result<Vec<String>, String> {
    let doc = Document::load(&path).map_err(|e| e.to_string())?;
    let total = doc.get_pages().len() as u32;

    let stem = Path::new(&path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("split");
    let dir = output_dir.unwrap_or_else(temp_dir_str);

    let mut output_paths = Vec::new();

    for (i, range) in ranges.iter().enumerate() {
        let start = range.start.max(1);
        let end = range.end.min(total);
        if start > end {
            return Err(format!("Invalid range {}-{}", start, end));
        }

        let pages_to_delete: Vec<u32> = (1..=total)
            .filter(|&p| p < start || p > end)
            .collect();

        let mut part = doc.clone();
        part.delete_pages(&pages_to_delete);

        let out = format!("{}/{}_part{}.pdf", dir, stem, i + 1);
        part.save(&out).map_err(|e| e.to_string())?;
        output_paths.push(out);
    }

    Ok(output_paths)
}

/// Split into individual pages.
/// Uses direct page-tree manipulation instead of clone+delete_pages for each page,
/// avoiding O(N²) deletions. Each output file contains only the target page in its
/// page tree (other page objects are technically unreferenced but PDF viewers ignore them).
#[tauri::command]
pub fn split_pdf_per_page(path: String, output_dir: Option<String>) -> Result<Vec<String>, String> {
    let mut doc = Document::load(&path).map_err(|e| e.to_string())?;
    let total = doc.get_pages().len() as u32;

    let stem = Path::new(&path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("page");
    let dir = output_dir.unwrap_or_else(temp_dir_str);

    // Collect page ObjectIds once.
    let pages_map = doc.get_pages();

    // Locate the Pages root from the catalog.
    let pages_root_id = {
        let catalog = doc.catalog().map_err(|e| e.to_string())?;
        catalog
            .get(b"Pages")
            .and_then(|obj| obj.as_reference())
            .map_err(|e| e.to_string())?
    };

    // Ensure every page's Parent already points to the root (flatten any nested tree).
    for (_, &page_obj_id) in &pages_map {
        if let Some(Object::Dictionary(page_dict)) = doc.objects.get_mut(&page_obj_id) {
            page_dict.set("Parent", Object::Reference(pages_root_id));
        }
    }

    let mut output_paths = Vec::new();
    for page_num in 1..=total {
        let page_obj_id = pages_map[&page_num];

        // Swap the Kids array to contain only this page, then save, then restore.
        // This avoids N full document clones while producing correct output.
        let single_kids = Object::Array(vec![Object::Reference(page_obj_id)]);

        let old_kids = if let Some(Object::Dictionary(dict)) = doc.objects.get_mut(&pages_root_id) {
            let old = dict.get(b"Kids").ok().cloned();
            dict.set("Kids", single_kids);
            dict.set("Count", Object::Integer(1));
            old
        } else {
            return Err("Could not find Pages root dictionary".into());
        };

        let out = format!("{}/{}_page{:04}.pdf", dir, stem, page_num);
        doc.save(&out).map_err(|e| e.to_string())?;
        output_paths.push(out);

        // Restore the original Kids and Count for the next iteration.
        if let Some(Object::Dictionary(dict)) = doc.objects.get_mut(&pages_root_id) {
            if let Some(kids) = old_kids {
                dict.set("Kids", kids);
            }
            dict.set("Count", Object::Integer(total as i64));
        }
    }

    Ok(output_paths)
}
