//! Docker-related Tauri commands.

use crate::demo;
use crate::scanners::docker::{self, DockerStatus};
use crate::state::AppState;
use tauri::State;

/// Only write to SQLite when container state actually changes
fn maybe_record_docker_scan(state: &State<'_, AppState>, status: &DockerStatus) {
    let new_fingerprint = (status.total_running, status.total_stopped);
    let mut fp = state.docker_fingerprint.lock().unwrap();
    let changed = match *fp {
        Some(old) => old != new_fingerprint,
        None => true,
    };
    if changed {
        *fp = Some(new_fingerprint);
        drop(fp);
        let db = state.db.lock().unwrap();
        let _ = db.record_scan("docker", status);
    }
}

#[tauri::command]
pub fn get_docker_status(state: State<'_, AppState>) -> DockerStatus {
    if demo::is_enabled() {
        return demo::mock_docker_status();
    }

    let mut cache = state.docker_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.docker_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let status = docker::scan();
    state
        .docker_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(status.clone());
    drop(cache);
    maybe_record_docker_scan(&state, &status);
    status
}

#[tauri::command]
pub fn refresh_docker_status(state: State<'_, AppState>) -> DockerStatus {
    if demo::is_enabled() {
        return demo::mock_docker_status();
    }

    let mut cache = state.docker_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let status = docker::scan();
    state
        .docker_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(status.clone());
    drop(cache);
    maybe_record_docker_scan(&state, &status);
    status
}

#[tauri::command]
pub fn start_docker_container(
    container_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    docker::start_container(&container_id)?;
    // Invalidate cache so next fetch shows updated status
    let mut cache = state.docker_cache.lock().unwrap();
    cache.invalidate();
    Ok(())
}

#[tauri::command]
pub fn stop_docker_container(
    container_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    docker::stop_container(&container_id)?;
    // Invalidate cache so next fetch shows updated status
    let mut cache = state.docker_cache.lock().unwrap();
    cache.invalidate();
    Ok(())
}

#[tauri::command]
pub fn restart_docker_container(
    container_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    docker::restart_container(&container_id)?;
    // Invalidate cache so next fetch shows updated status
    let mut cache = state.docker_cache.lock().unwrap();
    cache.invalidate();
    Ok(())
}

#[tauri::command]
pub fn get_docker_container_logs(container_id: String, tail: Option<usize>) -> Result<Vec<String>, String> {
    let tail = tail.unwrap_or(100);
    docker::get_logs(&container_id, tail)
}
