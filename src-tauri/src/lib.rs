mod commands;
mod utils;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            merge::merge_pdfs,
            split::split_pdf,
            split::split_pdf_per_page,
            compress::compress_pdf,
            rotate::rotate_pages,
            remove::remove_pages,
            reorder::reorder_pages,
            render::read_pdf_bytes,
            render::render_thumbnail,
            render::pdf_to_images,
            create::images_to_pdf,
            page_numbers::add_page_numbers,
            page_numbers::remove_page_numbers,
            protect::protect_pdf,
            unlock::unlock_pdf,
            metadata::get_metadata,
            metadata::set_metadata,
            metadata::get_pdf_info,
            files::copy_file,
            files::open_file,
            files::show_in_folder,
            files::write_bytes,
            files::get_content_uri_display_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
