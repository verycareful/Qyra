//! Compression via the pure `compress_core`.

mod common;

use common::{fixture_str, page_count, temp_output};
use qyra_lib::commands::compress::compress_core;

#[test]
fn compress_keeps_pages_and_reports_sizes() {
    let src = fixture_str("multipage.pdf");
    let (_d, out) = temp_output("compressed.pdf");

    let result = compress_core(src, Some(out.clone()), Some(0), |_| {}).expect("compress");

    assert_eq!(result.path, out);
    assert!(result.original_bytes > 0);
    assert!(result.compressed_bytes > 0);
    assert_eq!(page_count(&out), 5);
}
