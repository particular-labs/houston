use crate::scanners::languages;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_languages(state: State<'_, AppState>) -> Vec<languages::LanguageInfo> {
    let mut cache = state.language_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let langs = languages::scan();
    cache.set(langs.clone());
    langs
}

#[tauri::command]
pub fn refresh_languages(state: State<'_, AppState>) -> Vec<languages::LanguageInfo> {
    let mut cache = state.language_cache.lock().unwrap();
    cache.invalidate();
    let langs = languages::scan();
    cache.set(langs.clone());
    langs
}
