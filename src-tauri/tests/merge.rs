//! Merge: exercised through the pure `merge_documents` core (the command
//! wrapper only adds progress events on top of this).

mod common;

use common::fixture;
use qyra_lib::commands::merge::merge_documents;

#[test]
fn merges_page_trees_into_one_document() {
    let a = lopdf::Document::load(fixture("simple.pdf")).expect("load simple"); // 1 page
    let b = lopdf::Document::load(fixture("multipage.pdf")).expect("load multipage"); // 5 pages

    let merged = merge_documents(vec![a, b]).expect("merge");

    assert_eq!(merged.get_pages().len(), 6, "1 + 5 pages");
}

#[test]
fn merging_three_documents_sums_all_pages() {
    let docs = ["simple.pdf", "text.pdf", "multipage.pdf"]
        .iter()
        .map(|f| lopdf::Document::load(fixture(f)).expect("load"))
        .collect();

    let merged = merge_documents(docs).expect("merge");

    assert_eq!(merged.get_pages().len(), 1 + 1 + 5);
}
