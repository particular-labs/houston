use crate::scanners::environment;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_env_vars(state: State<'_, AppState>) -> Vec<environment::EnvVarInfo> {
    let mut cache = state.env_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let vars = environment::scan();
    cache.set(vars.clone());
    vars
}

#[tauri::command]
pub fn refresh_env_vars(state: State<'_, AppState>) -> Vec<environment::EnvVarInfo> {
    let mut cache = state.env_cache.lock().unwrap();
    cache.invalidate();
    let vars = environment::scan();
    cache.set(vars.clone());
    vars
}
