use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageInfo {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageList {
    pub npm_global: Vec<PackageInfo>,
    pub brew: Vec<PackageInfo>,
    pub pip: Vec<PackageInfo>,
    pub cargo: Vec<PackageInfo>,
}

fn scan_npm_global() -> Vec<PackageInfo> {
    let output = Command::new("npm")
        .args(["list", "-g", "--depth=0", "--json"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                if let Some(deps) = json.get("dependencies").and_then(|d| d.as_object()) {
                    return deps
                        .iter()
                        .map(|(name, info)| PackageInfo {
                            name: name.clone(),
                            version: info
                                .get("version")
                                .and_then(|v| v.as_str())
                                .unwrap_or("unknown")
                                .to_string(),
                        })
                        .collect();
                }
            }
            Vec::new()
        }
        _ => Vec::new(),
    }
}

fn scan_brew() -> Vec<PackageInfo> {
    let output = Command::new("brew")
        .args(["list", "--versions"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout
                .lines()
                .filter_map(|line| {
                    let parts: Vec<&str> = line.splitn(2, ' ').collect();
                    if parts.len() == 2 {
                        Some(PackageInfo {
                            name: parts[0].to_string(),
                            version: parts[1].trim().to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

fn scan_pip() -> Vec<PackageInfo> {
    let output = Command::new("pip3")
        .args(["list", "--format=json"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            if let Ok(packages) = serde_json::from_str::<Vec<serde_json::Value>>(&stdout) {
                return packages
                    .iter()
                    .filter_map(|pkg| {
                        let name = pkg.get("name")?.as_str()?.to_string();
                        let version = pkg.get("version")?.as_str()?.to_string();
                        Some(PackageInfo { name, version })
                    })
                    .collect();
            }
            Vec::new()
        }
        _ => Vec::new(),
    }
}

fn scan_cargo() -> Vec<PackageInfo> {
    let output = Command::new("cargo")
        .args(["install", "--list"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout
                .lines()
                .filter(|line| !line.starts_with(' '))
                .filter_map(|line| {
                    // Format: "package_name v0.1.0:"
                    let parts: Vec<&str> = line.splitn(2, ' ').collect();
                    if parts.len() == 2 {
                        Some(PackageInfo {
                            name: parts[0].to_string(),
                            version: parts[1].trim_end_matches(':').trim_start_matches('v').to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

pub fn scan() -> PackageList {
    PackageList {
        npm_global: scan_npm_global(),
        brew: scan_brew(),
        pip: scan_pip(),
        cargo: scan_cargo(),
    }
}
