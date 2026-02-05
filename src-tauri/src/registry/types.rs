//! Core type definitions for the project detection registry.
//!
//! This module defines all the types used for project type, language,
//! framework, and app category detection. Designed to be extracted as
//! a standalone `repo-probe` crate in the future.

use serde::{Deserialize, Serialize};

/// App category for classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AppCategory {
    DesktopApp,
    MobileApp,
    WebApp,
    Backend,
    Library,
    Cli,
    Unknown,
}

impl AppCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            AppCategory::DesktopApp => "Desktop App",
            AppCategory::MobileApp => "Mobile App",
            AppCategory::WebApp => "Web App",
            AppCategory::Backend => "Backend",
            AppCategory::Library => "Library",
            AppCategory::Cli => "CLI",
            AppCategory::Unknown => "Unknown",
        }
    }
}

impl Default for AppCategory {
    fn default() -> Self {
        AppCategory::Unknown
    }
}

/// Primary language/ecosystem
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Language {
    JavaScript,
    TypeScript,
    Python,
    Rust,
    Go,
    Java,
    Kotlin,
    Swift,
    Ruby,
    Php,
    CSharp,
    Cpp,
    Dart,
    Elixir,
    Unknown,
}

impl Language {
    #[allow(dead_code)]
    pub fn as_str(&self) -> &'static str {
        match self {
            Language::JavaScript | Language::TypeScript => "JavaScript/TypeScript",
            Language::Python => "Python",
            Language::Rust => "Rust",
            Language::Go => "Go",
            Language::Java => "Java",
            Language::Kotlin => "Kotlin",
            Language::Swift => "Swift",
            Language::Ruby => "Ruby",
            Language::Php => "PHP",
            Language::CSharp => "C#",
            Language::Cpp => "C++",
            Language::Dart => "Dart",
            Language::Elixir => "Elixir",
            Language::Unknown => "Unknown",
        }
    }

    /// Get display name for project type (may differ from as_str for some languages)
    #[allow(dead_code)]
    pub fn display_name(&self) -> &'static str {
        match self {
            Language::JavaScript | Language::TypeScript => "JavaScript/TypeScript",
            Language::Java | Language::Kotlin => "Java/Kotlin",
            _ => self.as_str(),
        }
    }
}

impl Default for Language {
    fn default() -> Self {
        Language::Unknown
    }
}

/// Package manager identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PackageManager {
    Npm,
    Pnpm,
    Yarn,
    Bun,
    Cargo,
    GoMod,
    Pip,
    Uv,
    Poetry,
    Pipenv,
    Bundler,
    Composer,
    Maven,
    Gradle,
    Pub,
    Swift,
    Nuget,
    Dotnet,
    Mix,
    Unknown,
}

impl PackageManager {
    pub fn as_str(&self) -> &'static str {
        match self {
            PackageManager::Npm => "npm",
            PackageManager::Pnpm => "pnpm",
            PackageManager::Yarn => "yarn",
            PackageManager::Bun => "bun",
            PackageManager::Cargo => "cargo",
            PackageManager::GoMod => "go mod",
            PackageManager::Pip => "pip",
            PackageManager::Uv => "uv",
            PackageManager::Poetry => "poetry",
            PackageManager::Pipenv => "pipenv",
            PackageManager::Bundler => "bundler",
            PackageManager::Composer => "composer",
            PackageManager::Maven => "maven",
            PackageManager::Gradle => "gradle",
            PackageManager::Pub => "pub",
            PackageManager::Swift => "swift",
            PackageManager::Nuget => "nuget",
            PackageManager::Dotnet => "dotnet",
            PackageManager::Mix => "mix",
            PackageManager::Unknown => "unknown",
        }
    }
}

impl Default for PackageManager {
    fn default() -> Self {
        PackageManager::Unknown
    }
}

/// Where to look for detection patterns
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum DetectionSource {
    /// Check if a file exists (e.g., "package.json")
    FileExists,
    /// Check if a directory exists (e.g., "src-tauri")
    DirectoryExists,
    /// Search within manifest file content
    ManifestContent,
}

/// Framework detection rule
#[derive(Debug, Clone)]
pub struct FrameworkRule {
    /// Framework name for display
    pub name: &'static str,
    /// Patterns to search for (dependency names, import statements, etc.)
    pub patterns: &'static [&'static str],
    /// Where to look for the patterns
    pub source: DetectionSource,
    /// App category when this framework is detected
    pub category: AppCategory,
    /// Priority for detection (higher = checked first)
    pub priority: u8,
}

/// Storage directory for size scanning
#[derive(Debug, Clone, Copy)]
pub struct StorageDir {
    /// Directory name (e.g., "node_modules", "target")
    pub name: &'static str,
    /// Category for grouping (e.g., "dependencies", "build", "cache", "vcs")
    pub category: &'static str,
}

/// Lockfile mapping to package manager
#[derive(Debug, Clone, Copy)]
pub struct LockfileEntry {
    /// Lockfile name (e.g., "pnpm-lock.yaml")
    pub file: &'static str,
    /// Associated package manager
    pub manager: PackageManager,
}

/// Language entry in the registry
#[derive(Debug, Clone)]
pub struct LanguageEntry {
    /// Primary language identifier
    pub language: Language,
    /// Display name for the language
    pub display_name: &'static str,
    /// Primary manifest file (e.g., "package.json", "Cargo.toml")
    pub manifest: &'static str,
    /// Alternative manifest files
    pub alt_manifests: &'static [&'static str],
    /// Framework detection rules, sorted by priority
    pub frameworks: &'static [FrameworkRule],
    /// Storage directories for this language
    pub storage_dirs: &'static [StorageDir],
    /// Lockfile to package manager mappings
    pub lockfiles: &'static [LockfileEntry],
    /// Default package manager when no lockfile is found
    pub default_manager: PackageManager,
    /// Default app category when no framework is detected
    pub default_category: AppCategory,
    /// Default framework name when no specific framework is detected
    pub default_framework: &'static str,
}

/// Result of project detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionResult {
    /// Detected language
    pub language: Language,
    /// Display name for the language/ecosystem
    pub language_display: String,
    /// Detected framework name
    pub framework: String,
    /// App category
    pub category: AppCategory,
    /// Category display name
    pub category_display: String,
    /// Detected package manager
    pub package_manager: PackageManager,
    /// Package manager display name
    pub package_manager_display: String,
}

impl Default for DetectionResult {
    fn default() -> Self {
        DetectionResult {
            language: Language::Unknown,
            language_display: "Unknown".to_string(),
            framework: String::new(),
            category: AppCategory::Unknown,
            category_display: "Unknown".to_string(),
            package_manager: PackageManager::Unknown,
            package_manager_display: "unknown".to_string(),
        }
    }
}
