use crate::scanners::packages;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_packages(state: State<'_, AppState>) -> packages::PackageList {
    let mut cache = state.package_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let pkgs = packages::scan();
    cache.set(pkgs.clone());
    pkgs
}

#[tauri::command]
pub fn refresh_packages(state: State<'_, AppState>) -> packages::PackageList {
    let mut cache = state.package_cache.lock().unwrap();
    cache.invalidate();
    let pkgs = packages::scan();
    cache.set(pkgs.clone());
    pkgs
}
