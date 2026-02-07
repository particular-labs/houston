//! Docker container scanner.
//!
//! Scans for running Docker containers and collects their status,
//! port mappings, resource usage, and Compose project information.

use crate::registry::containers::{detect_container, ContainerCategory};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;

/// Port binding information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortBinding {
    pub host_port: Option<u16>,
    pub container_port: u16,
    pub protocol: String,
}

/// Individual container information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: String,       // "running", "paused", "exited", "created"
    pub state_detail: String, // "Up 2 hours", "Exited (0) 5 mins ago"
    pub created: String,
    pub ports: Vec<PortBinding>,
    pub cpu_percent: f64,
    pub memory_bytes: u64,
    pub memory_limit: u64,
    pub service_name: String, // Detected service name (e.g., "PostgreSQL")
    pub category: String,     // webapp, database, cache, queue, proxy, service, unknown
    pub icon: String,         // Lucide icon name
    pub compose_project: Option<String>,
    pub compose_service: Option<String>,
}

/// Compose project grouping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposeProject {
    pub name: String,
    pub container_count: usize,
    pub running_count: usize,
    pub containers: Vec<String>, // Container IDs
}

/// Overall Docker status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerStatus {
    pub available: bool,
    pub version: Option<String>,
    pub containers: Vec<ContainerInfo>,
    pub compose_projects: Vec<ComposeProject>,
    pub total_running: usize,
    pub total_stopped: usize,
    pub scanned_at: String,
}

/// Docker stats response (parsed from docker stats --no-stream)
#[derive(Debug, Clone)]
struct ContainerStats {
    cpu_percent: f64,
    mem_usage: u64,
    mem_limit: u64,
}

/// Check if Docker is available and get version
fn get_docker_version() -> Option<String> {
    let output = Command::new("docker")
        .args(["version", "--format", "{{.Server.Version}}"])
        .output()
        .ok()?;

    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !version.is_empty() {
            return Some(version);
        }
    }
    None
}

/// Get container stats (CPU/memory) for all containers
fn get_container_stats() -> HashMap<String, ContainerStats> {
    let mut stats = HashMap::new();

    let output = Command::new("docker")
        .args([
            "stats",
            "--no-stream",
            "--format",
            "{{.ID}}\t{{.CPUPerc}}\t{{.MemUsage}}",
        ])
        .output()
        .ok();

    if let Some(out) = output {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 3 {
                    let id = parts[0].to_string();

                    // Parse CPU percentage (e.g., "0.50%")
                    let cpu = parts[1]
                        .trim_end_matches('%')
                        .parse::<f64>()
                        .unwrap_or(0.0);

                    // Parse memory usage (e.g., "45.6MiB / 7.7GiB")
                    let (mem_usage, mem_limit) = parse_memory_usage(parts[2]);

                    stats.insert(
                        id,
                        ContainerStats {
                            cpu_percent: cpu,
                            mem_usage,
                            mem_limit,
                        },
                    );
                }
            }
        }
    }

    stats
}

/// Parse memory usage string like "45.6MiB / 7.7GiB"
fn parse_memory_usage(s: &str) -> (u64, u64) {
    let parts: Vec<&str> = s.split(" / ").collect();
    if parts.len() != 2 {
        return (0, 0);
    }

    let usage = parse_memory_value(parts[0]);
    let limit = parse_memory_value(parts[1]);
    (usage, limit)
}

/// Parse memory value like "45.6MiB" or "7.7GiB"
fn parse_memory_value(s: &str) -> u64 {
    let s = s.trim();
    if s.ends_with("GiB") {
        let val: f64 = s.trim_end_matches("GiB").parse().unwrap_or(0.0);
        (val * 1024.0 * 1024.0 * 1024.0) as u64
    } else if s.ends_with("MiB") {
        let val: f64 = s.trim_end_matches("MiB").parse().unwrap_or(0.0);
        (val * 1024.0 * 1024.0) as u64
    } else if s.ends_with("KiB") {
        let val: f64 = s.trim_end_matches("KiB").parse().unwrap_or(0.0);
        (val * 1024.0) as u64
    } else if s.ends_with("B") {
        let val: f64 = s.trim_end_matches("B").parse().unwrap_or(0.0);
        val as u64
    } else {
        0
    }
}

/// Parse port mappings from docker ps output like "0.0.0.0:5432->5432/tcp, 33060/tcp"
fn parse_ports(ports_str: &str) -> Vec<PortBinding> {
    let mut bindings = Vec::new();

    for part in ports_str.split(", ") {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        if let Some(arrow_pos) = part.find("->") {
            // Host-mapped port: "0.0.0.0:5432->5432/tcp"
            let host_part = &part[..arrow_pos];
            let container_part = &part[arrow_pos + 2..];

            // Parse host port (after last colon)
            let host_port = host_part
                .rfind(':')
                .and_then(|pos| host_part[pos + 1..].parse::<u16>().ok());

            // Parse container port and protocol
            let (container_port, protocol) = parse_port_protocol(container_part);

            if let Some(port) = container_port {
                bindings.push(PortBinding {
                    host_port,
                    container_port: port,
                    protocol,
                });
            }
        } else {
            // Exposed but not mapped: "33060/tcp"
            let (container_port, protocol) = parse_port_protocol(part);
            if let Some(port) = container_port {
                bindings.push(PortBinding {
                    host_port: None,
                    container_port: port,
                    protocol,
                });
            }
        }
    }

    bindings
}

/// Parse "5432/tcp" into (port, protocol)
fn parse_port_protocol(s: &str) -> (Option<u16>, String) {
    let parts: Vec<&str> = s.split('/').collect();
    let port = parts.first().and_then(|p| p.parse::<u16>().ok());
    let protocol = parts.get(1).unwrap_or(&"tcp").to_string();
    (port, protocol)
}

/// Scan for Docker containers
pub fn scan() -> DockerStatus {
    let scanned_at = chrono::Utc::now().to_rfc3339();

    // Check if Docker is available
    let version = get_docker_version();
    if version.is_none() {
        return DockerStatus {
            available: false,
            version: None,
            containers: vec![],
            compose_projects: vec![],
            total_running: 0,
            total_stopped: 0,
            scanned_at,
        };
    }

    // List all containers first (cheap: ~50ms)
    let output = Command::new("docker")
        .args([
            "ps",
            "-a",
            "--format",
            "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.CreatedAt}}\t{{.Ports}}\t{{.Label \"com.docker.compose.project\"}}\t{{.Label \"com.docker.compose.service\"}}",
        ])
        .output();

    let mut containers = Vec::new();
    let mut compose_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut running_count = 0;
    let mut stopped_count = 0;

    if let Ok(out) = output {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() < 6 {
                    continue;
                }

                let id = parts[0].to_string();
                let name = parts[1].to_string();
                let image = parts[2].to_string();
                let status_detail = parts[3].to_string();
                let created = parts[4].to_string();
                let ports_str = parts[5];
                let compose_project = parts.get(6).map(|s| s.to_string()).filter(|s| !s.is_empty());
                let compose_service = parts.get(7).map(|s| s.to_string()).filter(|s| !s.is_empty());

                // Determine container status
                let status = if status_detail.starts_with("Up") {
                    running_count += 1;
                    "running"
                } else if status_detail.starts_with("Paused") {
                    "paused"
                } else if status_detail.starts_with("Exited") {
                    stopped_count += 1;
                    "exited"
                } else {
                    stopped_count += 1;
                    "created"
                }
                .to_string();

                // Detect container type from image
                let detection = detect_container(&image);
                let category_str = match detection.category {
                    ContainerCategory::Database => "database",
                    ContainerCategory::Cache => "cache",
                    ContainerCategory::Queue => "queue",
                    ContainerCategory::Proxy => "proxy",
                    ContainerCategory::WebApp => "webapp",
                    ContainerCategory::Monitoring => "monitoring",
                    ContainerCategory::Service => "service",
                    ContainerCategory::Unknown => "unknown",
                }
                .to_string();

                // Parse ports
                let ports = parse_ports(ports_str);

                // Track compose projects
                if let Some(ref project) = compose_project {
                    compose_map
                        .entry(project.clone())
                        .or_default()
                        .push(id.clone());
                }

                containers.push(ContainerInfo {
                    id,
                    name,
                    image,
                    status,
                    state_detail: status_detail,
                    created,
                    ports,
                    cpu_percent: 0.0,
                    memory_bytes: 0,
                    memory_limit: 0,
                    service_name: detection.name,
                    category: category_str,
                    icon: detection.icon.to_string(),
                    compose_project,
                    compose_service,
                });
            }
        }
    }

    // Only fetch expensive stats if there are running containers
    if running_count > 0 {
        let stats = get_container_stats();
        for container in &mut containers {
            if let Some(s) = stats.get(&container.id) {
                container.cpu_percent = s.cpu_percent;
                container.memory_bytes = s.mem_usage;
                container.memory_limit = s.mem_limit;
            }
        }
    }

    // Build compose projects list
    let compose_projects: Vec<ComposeProject> = compose_map
        .into_iter()
        .map(|(name, container_ids)| {
            let running = container_ids
                .iter()
                .filter(|id| {
                    containers
                        .iter()
                        .find(|c| &c.id == *id)
                        .map(|c| c.status == "running")
                        .unwrap_or(false)
                })
                .count();

            ComposeProject {
                name,
                container_count: container_ids.len(),
                running_count: running,
                containers: container_ids,
            }
        })
        .collect();

    DockerStatus {
        available: true,
        version,
        containers,
        compose_projects,
        total_running: running_count,
        total_stopped: stopped_count,
        scanned_at,
    }
}

/// Start a container by ID
pub fn start_container(container_id: &str) -> Result<(), String> {
    let output = Command::new("docker")
        .args(["start", container_id])
        .output()
        .map_err(|e| format!("Failed to execute docker start: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Stop a container by ID
pub fn stop_container(container_id: &str) -> Result<(), String> {
    let output = Command::new("docker")
        .args(["stop", container_id])
        .output()
        .map_err(|e| format!("Failed to execute docker stop: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Restart a container by ID
pub fn restart_container(container_id: &str) -> Result<(), String> {
    let output = Command::new("docker")
        .args(["restart", container_id])
        .output()
        .map_err(|e| format!("Failed to execute docker restart: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Get container logs
pub fn get_logs(container_id: &str, tail: usize) -> Result<Vec<String>, String> {
    let output = Command::new("docker")
        .args(["logs", "--tail", &tail.to_string(), container_id])
        .output()
        .map_err(|e| format!("Failed to execute docker logs: {}", e))?;

    // Docker logs can output to both stdout and stderr
    let mut logs = Vec::new();

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    for line in stdout.lines() {
        if !line.is_empty() {
            logs.push(line.to_string());
        }
    }

    // stderr often contains actual log output for containers
    for line in stderr.lines() {
        if !line.is_empty() {
            logs.push(line.to_string());
        }
    }

    Ok(logs)
}
