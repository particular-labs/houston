use crate::scanners::packages;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_packages(state: State<'_, AppState>) -> packages::PackageList {
    let mut cache = state.package_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.package_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let pkgs = packages::scan();
    state
        .package_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(pkgs.clone());
    pkgs
}

#[tauri::command]
pub fn refresh_packages(state: State<'_, AppState>) -> packages::PackageList {
    let mut cache = state.package_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let pkgs = packages::scan();
    state
        .package_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(pkgs.clone());
    pkgs
}
