use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct Progress {
    pub current: usize,
    pub total: usize,
    pub message: String,
}

impl Progress {
    pub fn new(current: usize, total: usize, message: impl Into<String>) -> Self {
        Self { current, total, message: message.into() }
    }
}
