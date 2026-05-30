//! Object deduplication: a PDF with many byte-identical objects compresses and
//! still re-opens with the same page count.

mod common;

use common::{fixture_str, page_count, temp_output};
use qyra_lib::commands::compress::compress_core;

#[test]
fn repeated_objects_dedup_and_reopen() {
    let src = fixture_str("repeated-objects.pdf");
    let input_size = std::fs::metadata(&src).unwrap().len();

    let (_d, out) = temp_output("out.pdf");
    let report = compress_core(src, Some(out.clone()), Some(0), |_| {}).expect("compress");

    assert_eq!(page_count(&out), 1, "deduped doc still has its single page");
    assert!(
        report.compressed_bytes < input_size,
        "expected shrink from dedup + object streams: {} >= {}",
        report.compressed_bytes,
        input_size,
    );
}
