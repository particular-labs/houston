use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageInfo {
    pub name: String,
    pub version: String,
    pub binary_path: String,
    pub manager: String,
    pub installed: bool,
    pub icon: String,
}

struct LanguageSpec {
    name: &'static str,
    binary: &'static str,
    version_args: &'static [&'static str],
    version_parser: fn(&str) -> String,
    manager_detector: fn(&str) -> String,
    icon: &'static str,
}

fn parse_version_generic(output: &str) -> String {
    // Try to extract a semver-like pattern
    output
        .split_whitespace()
        .find(|word| {
            word.chars()
                .next()
                .map(|c| c.is_ascii_digit())
                .unwrap_or(false)
                && word.contains('.')
        })
        .unwrap_or_else(|| output.lines().next().unwrap_or(output))
        .trim_start_matches('v')
        .to_string()
}

fn parse_java_version(output: &str) -> String {
    // java -version outputs to stderr, format: openjdk version "21.0.1" or java version "1.8.0_xxx"
    output
        .lines()
        .next()
        .and_then(|line| line.split('"').nth(1).map(|v| v.to_string()))
        .unwrap_or_else(|| parse_version_generic(output))
}

fn detect_node_manager(path: &str) -> String {
    if path.contains("nvm") {
        "nvm".to_string()
    } else if path.contains("fnm") {
        "fnm".to_string()
    } else if path.contains("volta") {
        "volta".to_string()
    } else if path.contains("homebrew") || path.contains("brew") {
        "homebrew".to_string()
    } else {
        "system".to_string()
    }
}

fn detect_python_manager(path: &str) -> String {
    if path.contains("pyenv") {
        "pyenv".to_string()
    } else if path.contains("conda") || path.contains("miniconda") || path.contains("anaconda") {
        "conda".to_string()
    } else if path.contains("homebrew") || path.contains("brew") {
        "homebrew".to_string()
    } else {
        "system".to_string()
    }
}

fn detect_ruby_manager(path: &str) -> String {
    if path.contains("rbenv") {
        "rbenv".to_string()
    } else if path.contains("rvm") {
        "rvm".to_string()
    } else if path.contains("homebrew") || path.contains("brew") {
        "homebrew".to_string()
    } else {
        "system".to_string()
    }
}

fn detect_generic_manager(path: &str) -> String {
    if path.contains("homebrew") || path.contains("brew") {
        "homebrew".to_string()
    } else if path.contains("mise") || path.contains("asdf") {
        "mise/asdf".to_string()
    } else {
        "system".to_string()
    }
}

fn detect_rust_manager(_path: &str) -> String {
    "rustup".to_string()
}

fn detect_go_manager(path: &str) -> String {
    if path.contains("goenv") {
        "goenv".to_string()
    } else if path.contains("homebrew") || path.contains("brew") {
        "homebrew".to_string()
    } else {
        "system".to_string()
    }
}

const LANGUAGES: &[LanguageSpec] = &[
    LanguageSpec {
        name: "Node.js",
        binary: "node",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_node_manager,
        icon: "node",
    },
    LanguageSpec {
        name: "Python",
        binary: "python3",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_python_manager,
        icon: "python",
    },
    LanguageSpec {
        name: "Ruby",
        binary: "ruby",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_ruby_manager,
        icon: "ruby",
    },
    LanguageSpec {
        name: "Go",
        binary: "go",
        version_args: &["version"],
        version_parser: parse_version_generic,
        manager_detector: detect_go_manager,
        icon: "go",
    },
    LanguageSpec {
        name: "Rust",
        binary: "rustc",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_rust_manager,
        icon: "rust",
    },
    LanguageSpec {
        name: "Java",
        binary: "java",
        version_args: &["-version"],
        version_parser: parse_java_version,
        manager_detector: detect_generic_manager,
        icon: "java",
    },
    LanguageSpec {
        name: "PHP",
        binary: "php",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_generic_manager,
        icon: "php",
    },
    LanguageSpec {
        name: "Deno",
        binary: "deno",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_generic_manager,
        icon: "deno",
    },
    LanguageSpec {
        name: "Bun",
        binary: "bun",
        version_args: &["--version"],
        version_parser: parse_version_generic,
        manager_detector: detect_generic_manager,
        icon: "bun",
    },
];

fn which(binary: &str) -> Option<String> {
    Command::new("which")
        .arg(binary)
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
            } else {
                None
            }
        })
}

pub fn scan() -> Vec<LanguageInfo> {
    let handles: Vec<_> = LANGUAGES
        .iter()
        .map(|spec| {
            let name = spec.name;
            let binary = spec.binary;
            let version_args = spec.version_args;
            let version_parser = spec.version_parser;
            let manager_detector = spec.manager_detector;
            let icon = spec.icon;
            std::thread::spawn(move || {
                if let Some(binary_path) = which(binary) {
                    let output = Command::new(binary).args(version_args).output();

                    let (installed, version) = match output {
                        Ok(o) if o.status.success() => {
                            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
                            let stderr = String::from_utf8_lossy(&o.stderr).to_string();
                            let raw = if stdout.trim().is_empty() {
                                &stderr
                            } else {
                                &stdout
                            };
                            let ver = version_parser(raw.trim());
                            (true, ver)
                        }
                        _ => (false, String::new()),
                    };

                    if !installed {
                        return LanguageInfo {
                            name: name.to_string(),
                            version: String::new(),
                            binary_path: String::new(),
                            manager: String::new(),
                            installed: false,
                            icon: icon.to_string(),
                        };
                    }

                    let manager = manager_detector(&binary_path);

                    LanguageInfo {
                        name: name.to_string(),
                        version,
                        binary_path,
                        manager,
                        installed: true,
                        icon: icon.to_string(),
                    }
                } else {
                    LanguageInfo {
                        name: name.to_string(),
                        version: String::new(),
                        binary_path: String::new(),
                        manager: String::new(),
                        installed: false,
                        icon: icon.to_string(),
                    }
                }
            })
        })
        .collect();

    handles.into_iter().map(|h| h.join().unwrap()).collect()
}
