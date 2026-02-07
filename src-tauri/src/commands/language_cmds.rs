use crate::demo;
use crate::scanners::languages;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_languages(state: State<'_, AppState>) -> Vec<languages::LanguageInfo> {
    if demo::is_enabled() {
        return demo::mock_languages();
    }

    let mut cache = state.language_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.language_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let langs = languages::scan();
    state
        .language_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(langs.clone());
    drop(cache);
    state.throttled_record_scan("languages", &langs);
    langs
}

#[tauri::command]
pub fn refresh_languages(state: State<'_, AppState>) -> Vec<languages::LanguageInfo> {
    if demo::is_enabled() {
        return demo::mock_languages();
    }

    let mut cache = state.language_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let langs = languages::scan();
    state
        .language_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(langs.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("languages", &langs);
    langs
}
