use std::fs;
use tauri_plugin_opener::OpenerExt;

/// Query Android ContentResolver for the display name of a content:// URI.
/// Returns the filename (e.g. "report.pdf") or falls back to extracting it from the URI.
#[tauri::command]
pub fn get_content_uri_display_name(uri: String) -> String {
    #[cfg(target_os = "android")]
    {
        if uri.starts_with("content://") {
            if let Some(name) = android_query_display_name(&uri) {
                return name;
            }
        }
    }
    // Non-Android or fallback: last path segment
    uri.split(['/', '\\']).last().unwrap_or(&uri).to_string()
}

#[cfg(target_os = "android")]
fn android_query_display_name(uri: &str) -> Option<String> {
    use jni::objects::{JObject, JString, JValue};

    let ctx = ndk_context::android_context();
    let vm = unsafe { jni::JavaVM::from_raw(ctx.vm().cast()) }.ok()?;
    let mut env = vm.attach_current_thread().ok()?;

    // Uri.parse(uri)
    let j_uri_str = env.new_string(uri).ok()?;
    let j_uri = env
        .call_static_method(
            "android/net/Uri",
            "parse",
            "(Ljava/lang/String;)Landroid/net/Uri;",
            &[JValue::Object(&j_uri_str)],
        )
        .ok()?
        .l()
        .ok()?;
    if j_uri.is_null() {
        return None;
    }

    // context.getContentResolver()
    let context = unsafe { JObject::from_raw(ctx.context().cast()) };
    let resolver = env
        .call_method(
            &context,
            "getContentResolver",
            "()Landroid/content/ContentResolver;",
            &[],
        )
        .ok()?
        .l()
        .ok()?;
    if resolver.is_null() {
        return None;
    }

    // String[] projection = { OpenableColumns.DISPLAY_NAME }
    let display_name_field = env
        .get_static_field(
            "android/provider/OpenableColumns",
            "DISPLAY_NAME",
            "Ljava/lang/String;",
        )
        .ok()?
        .l()
        .ok()?;
    let string_class = env.find_class("java/lang/String").ok()?;
    let projection = env
        .new_object_array(1, string_class, &display_name_field)
        .ok()?;

    // cursor = resolver.query(uri, projection, null, null, null)
    let null = JObject::null();
    let cursor = env
        .call_method(
            &resolver,
            "query",
            "(Landroid/net/Uri;[Ljava/lang/String;Ljava/lang/String;[Ljava/lang/String;Ljava/lang/String;)Landroid/database/Cursor;",
            &[
                JValue::Object(&j_uri),
                JValue::Object(&projection),
                JValue::Object(&null),
                JValue::Object(&null),
                JValue::Object(&null),
            ],
        )
        .ok()?
        .l()
        .ok()?;
    if cursor.is_null() {
        return None;
    }

    let moved = env
        .call_method(&cursor, "moveToFirst", "()Z", &[])
        .ok()?
        .z()
        .ok()?;
    if !moved {
        let _ = env.call_method(&cursor, "close", "()V", &[]);
        return None;
    }

    let col_idx = env
        .call_method(
            &cursor,
            "getColumnIndex",
            "(Ljava/lang/String;)I",
            &[JValue::Object(&display_name_field)],
        )
        .ok()?
        .i()
        .ok()?;
    if col_idx < 0 {
        let _ = env.call_method(&cursor, "close", "()V", &[]);
        return None;
    }

    let name_obj = env
        .call_method(
            &cursor,
            "getString",
            "(I)Ljava/lang/String;",
            &[JValue::Int(col_idx)],
        )
        .ok()?
        .l()
        .ok()?;
    let _ = env.call_method(&cursor, "close", "()V", &[]);

    if name_obj.is_null() {
        return None;
    }
    let name: String = env.get_string(&JString::from(name_obj)).ok()?.into();
    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}

#[tauri::command]
pub fn copy_file(src: String, dst: String) -> Result<(), String> {
    fs::copy(&src, &dst)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Open a file with the default OS application. Runs from Rust to bypass
/// frontend path-scope restrictions imposed by the opener plugin.
#[tauri::command]
pub fn open_file(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle
        .opener()
        .open_path(&path, None::<String>)
        .map_err(|e| e.to_string())
}

/// Reveal a file in the system file manager (Explorer / Finder / Nautilus).
#[tauri::command]
pub fn show_in_folder(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle
        .opener()
        .reveal_item_in_dir(&path)
        .map_err(|e| e.to_string())
}

/// Write raw bytes to a file path. Used by the frontend to save rendered images.
#[tauri::command]
pub fn write_bytes(path: String, data: Vec<u8>) -> Result<(), String> {
    fs::write(&path, &data).map_err(|e| e.to_string())
}
