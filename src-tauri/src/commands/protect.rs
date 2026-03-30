use lopdf::{Document, EncryptionVersion, EncryptionState, Permissions};
use crate::utils::paths::temp_output_path;

/// Password-protect a PDF using AES-128 (RC4/V2 with 128-bit key).
#[tauri::command]
pub fn protect_pdf(
    path: String,
    user_password: String,
    owner_password: Option<String>,
    output: Option<String>,
) -> Result<String, String> {
    let mut doc = Document::load(&path).map_err(|e| e.to_string())?;
    let owner_pw = owner_password.unwrap_or_else(|| user_password.clone());

    let version = EncryptionVersion::V2 {
        document: &doc,
        owner_password: &owner_pw,
        user_password: &user_password,
        key_length: 128,
        permissions: Permissions::all(),
    };

    let state = EncryptionState::try_from(version)
        .map_err(|e| format!("Failed to create encryption state: {}", e))?;

    doc.encrypt(&state)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    let out = output.unwrap_or_else(|| temp_output_path(&path, "protected"));
    doc.save(&out).map_err(|e| e.to_string())?;
    Ok(out)
}
