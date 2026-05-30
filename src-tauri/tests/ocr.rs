//! OCR text-layer baking via the pure `make_searchable_core`. The recognition
//! itself is the frontend's job (tesseract.js); the Rust side embeds an
//! invisible, searchable text layer from the supplied word boxes.

mod common;

use common::{fixture_str, page_count, page_text, temp_output};
use qyra_lib::commands::ocr::{make_searchable_core, OcrPage, OcrWord};

#[test]
fn bakes_an_invisible_searchable_text_layer() {
    let src = fixture_str("scanned.pdf"); // image-only page, no text
    let (_d, out) = temp_output("searchable.pdf");

    let pages = vec![OcrPage {
        words: vec![OcrWord { text: "invoice".into(), x: 0.1, y: 0.1, w: 0.2, h: 0.05 }],
    }];

    make_searchable_core(src, pages, Some(out.clone()), |_| {}).expect("ocr");

    assert_eq!(page_count(&out), 1);
    assert!(
        page_text(&out, 0).to_lowercase().contains("invoice"),
        "baked OCR word should be extractable",
    );
}
