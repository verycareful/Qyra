pub mod config;
pub mod dedup;
pub mod rewriter;
pub mod transforms;

#[allow(unused_imports)]
pub use config::CompressConfig;
pub use rewriter::Rewriter;
