use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVarInfo {
    pub key: String,
    pub value: String,
    pub category: String,
}

fn categorize_var(key: &str) -> String {
    let key_upper = key.to_uppercase();

    if key_upper == "PATH"
        || key_upper.ends_with("_PATH")
        || key_upper.ends_with("_HOME")
        || key_upper.ends_with("_ROOT")
        || key_upper.ends_with("_DIR")
        || key_upper.ends_with("_PREFIX")
    {
        "Path".to_string()
    } else if key_upper.starts_with("NODE")
        || key_upper.starts_with("NPM")
        || key_upper.starts_with("NVM")
        || key_upper.starts_with("PYTHON")
        || key_upper.starts_with("PYENV")
        || key_upper.starts_with("RUBY")
        || key_upper.starts_with("RBENV")
        || key_upper.starts_with("GOPATH")
        || key_upper.starts_with("GOROOT")
        || key_upper.starts_with("CARGO")
        || key_upper.starts_with("RUSTUP")
        || key_upper.starts_with("JAVA")
        || key_upper.starts_with("JDK")
    {
        "Language".to_string()
    } else if key_upper.starts_with("EDITOR")
        || key_upper.starts_with("VISUAL")
        || key_upper.starts_with("TERM")
        || key_upper.starts_with("SHELL")
        || key_upper.starts_with("PAGER")
        || key_upper == "LANG"
        || key_upper == "LC_ALL"
        || key_upper.starts_with("LC_")
    {
        "Shell".to_string()
    } else if key_upper.starts_with("AWS")
        || key_upper.starts_with("AZURE")
        || key_upper.starts_with("GCP")
        || key_upper.starts_with("GOOGLE")
        || key_upper.starts_with("CLOUD")
        || key_upper.starts_with("DOCKER")
        || key_upper.starts_with("KUBERNETES")
        || key_upper.starts_with("KUBECONFIG")
    {
        "Cloud".to_string()
    } else if key_upper.starts_with("GIT") || key_upper.starts_with("SSH") {
        "Git/SSH".to_string()
    } else if key_upper.starts_with("HOMEBREW") || key_upper.starts_with("BREW") {
        "Homebrew".to_string()
    } else if key_upper.contains("KEY")
        || key_upper.contains("TOKEN")
        || key_upper.contains("SECRET")
        || key_upper.contains("PASSWORD")
        || key_upper.contains("CREDENTIAL")
    {
        "Sensitive".to_string()
    } else if key_upper.starts_with("XDG")
        || key_upper == "HOME"
        || key_upper == "USER"
        || key_upper == "LOGNAME"
    {
        "System".to_string()
    } else {
        "Other".to_string()
    }
}

pub fn scan() -> Vec<EnvVarInfo> {
    let mut vars: Vec<EnvVarInfo> = std::env::vars()
        .map(|(key, value)| {
            let category = categorize_var(&key);
            // Mask sensitive values
            let display_value = if category == "Sensitive" {
                if value.len() > 8 {
                    format!("{}...{}", &value[..4], &value[value.len() - 4..])
                } else {
                    "••••••••".to_string()
                }
            } else {
                value
            };
            EnvVarInfo {
                key,
                value: display_value,
                category,
            }
        })
        .collect();

    vars.sort_by(|a, b| a.key.cmp(&b.key));
    vars
}
