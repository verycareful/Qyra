//! Read-only inspection commands: info, metadata, outline, form fields, text.

mod common;

use common::{fixture_str, temp_output};
use qyra_lib::commands::export_text::export_pdf_to_text;
use qyra_lib::commands::forms::get_form_fields;
use qyra_lib::commands::metadata::{get_metadata, get_pdf_info};
use qyra_lib::commands::outline::get_outline;

#[tokio::test]
async fn pdf_info_reports_pages_and_size() {
    let info = get_pdf_info(fixture_str("multipage.pdf")).await.expect("info");
    assert_eq!(info.page_count, 5);
    assert!(info.file_size > 0);
    assert!(info.metadata.title.is_none(), "fixture has no Title");
}

#[tokio::test]
async fn metadata_is_empty_for_bare_fixture() {
    let meta = get_metadata(fixture_str("simple.pdf")).expect("metadata");
    assert!(meta.title.is_none());
    assert!(meta.author.is_none());
}

#[tokio::test]
async fn outline_lists_bookmark_titles() {
    let nodes = get_outline(fixture_str("outline.pdf")).await.expect("outline");
    let titles: Vec<String> = nodes.iter().map(|n| n.title.clone()).collect();
    assert!(
        titles.iter().any(|t| t.contains("Chapter 1")),
        "expected a Chapter 1 bookmark, got {titles:?}",
    );
}

#[tokio::test]
async fn form_fields_expose_the_text_field() {
    let fields = get_form_fields(fixture_str("acroform.pdf")).await.expect("fields");
    assert!(
        fields.iter().any(|f| f.name == "full_name"),
        "expected a full_name field, got {:?}",
        fields.iter().map(|f| &f.name).collect::<Vec<_>>(),
    );
}

#[tokio::test]
async fn export_text_dumps_every_page() {
    let (_d, out) = temp_output("dump.txt");
    export_pdf_to_text(fixture_str("multipage.pdf"), Some(out.clone()))
        .await
        .expect("export text");

    let text = std::fs::read_to_string(&out).expect("read dump");
    assert!(text.contains("Page 1"));
    assert!(text.contains("Page 5"));
}
