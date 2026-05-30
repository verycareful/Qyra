//! Object-stream compression: output uses /ObjStm + /XRef, re-opens with the
//! same page count, and is smaller than the input on an object-heavy PDF.

mod common;

use common::{fixture_str, page_count, temp_output};
use qyra_lib::commands::compress::compress_core;

#[test]
fn object_heavy_pdf_shrinks_and_reopens() {
    let src = fixture_str("many-objects.pdf");
    let input_size = std::fs::metadata(&src).unwrap().len();

    let (_d, out) = temp_output("out.pdf");
    let report = compress_core(src, Some(out.clone()), Some(0), |_| {}).expect("compress");

    // Re-opens with the same page count.
    assert_eq!(page_count(&out), 1);

    // Output uses PDF 1.5 structures (dict keys are plaintext in the file).
    let bytes = std::fs::read(&out).unwrap();
    let s = String::from_utf8_lossy(&bytes);
    assert!(
        s.contains("/ObjStm") && s.contains("/XRef"),
        "output should use object + xref streams",
    );

    // Smaller than the input.
    assert!(
        report.compressed_bytes < input_size,
        "expected shrink: {} >= {}",
        report.compressed_bytes,
        input_size,
    );
}
