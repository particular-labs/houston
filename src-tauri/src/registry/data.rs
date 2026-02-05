//! Registry data containing all supported languages, frameworks, and detection rules.
//!
//! This is the single source of truth for project detection. All frameworks
//! are defined here with their detection patterns, categories, and priorities.

use super::types::{
    AppCategory, DetectionSource, FrameworkRule, Language, LanguageEntry, LockfileEntry,
    PackageManager, StorageDir,
};

// ============================================================================
// JavaScript/TypeScript Frameworks
// ============================================================================

const JS_FRAMEWORKS: &[FrameworkRule] = &[
    // Desktop Apps (highest priority)
    FrameworkRule {
        name: "Tauri",
        patterns: &["\"tauri\"", "\"@tauri-apps"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 100,
    },
    FrameworkRule {
        name: "Electron",
        patterns: &["\"electron\"", "\"electron-builder\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 99,
    },
    // Mobile Apps
    FrameworkRule {
        name: "Expo",
        patterns: &["\"expo\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 95,
    },
    FrameworkRule {
        name: "React Native",
        patterns: &["\"react-native\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 94,
    },
    FrameworkRule {
        name: "Capacitor",
        patterns: &["\"@capacitor/core\"", "\"@capacitor/cli\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 93,
    },
    FrameworkRule {
        name: "Cordova",
        patterns: &["\"cordova\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 92,
    },
    FrameworkRule {
        name: "NativeScript",
        patterns: &["\"nativescript\"", "\"@nativescript"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 91,
    },
    // Full-stack Web Frameworks (SSR)
    FrameworkRule {
        name: "Next.js",
        patterns: &["\"next\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 85,
    },
    FrameworkRule {
        name: "Nuxt",
        patterns: &["\"nuxt\"", "\"@nuxt"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 84,
    },
    FrameworkRule {
        name: "SvelteKit",
        patterns: &["\"@sveltejs/kit\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 83,
    },
    FrameworkRule {
        name: "Remix",
        patterns: &["\"remix\"", "\"@remix-run"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 82,
    },
    FrameworkRule {
        name: "Astro",
        patterns: &["\"astro\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 81,
    },
    FrameworkRule {
        name: "Gatsby",
        patterns: &["\"gatsby\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 80,
    },
    // Frontend Frameworks (SPA)
    FrameworkRule {
        name: "React + Vite",
        patterns: &["\"react\"", "\"vite\""], // Both must be present
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 75,
    },
    FrameworkRule {
        name: "React",
        patterns: &["\"react\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 70,
    },
    FrameworkRule {
        name: "Vue",
        patterns: &["\"vue\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 69,
    },
    FrameworkRule {
        name: "Svelte",
        patterns: &["\"svelte\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 68,
    },
    FrameworkRule {
        name: "Angular",
        patterns: &["\"angular\"", "\"@angular"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 67,
    },
    FrameworkRule {
        name: "SolidJS",
        patterns: &["\"solid-js\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 66,
    },
    FrameworkRule {
        name: "Qwik",
        patterns: &["\"qwik\"", "\"@builder.io/qwik\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 65,
    },
    FrameworkRule {
        name: "Preact",
        patterns: &["\"preact\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 64,
    },
    // Backend Frameworks
    FrameworkRule {
        name: "NestJS",
        patterns: &["\"@nestjs/core\"", "\"@nestjs"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 60,
    },
    FrameworkRule {
        name: "Express",
        patterns: &["\"express\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 55,
    },
    FrameworkRule {
        name: "Fastify",
        patterns: &["\"fastify\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 54,
    },
    FrameworkRule {
        name: "Hono",
        patterns: &["\"hono\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 53,
    },
    FrameworkRule {
        name: "Koa",
        patterns: &["\"koa\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 52,
    },
    FrameworkRule {
        name: "Elysia",
        patterns: &["\"elysia\""],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 51,
    },
];

const JS_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "node_modules", category: "dependencies" },
    StorageDir { name: "dist", category: "build" },
    StorageDir { name: "build", category: "build" },
    StorageDir { name: ".next", category: "cache" },
    StorageDir { name: ".nuxt", category: "cache" },
    StorageDir { name: ".turbo", category: "cache" },
    StorageDir { name: ".astro", category: "cache" },
    StorageDir { name: ".svelte-kit", category: "cache" },
    StorageDir { name: ".output", category: "build" },
];

const JS_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "pnpm-lock.yaml", manager: PackageManager::Pnpm },
    LockfileEntry { file: "yarn.lock", manager: PackageManager::Yarn },
    LockfileEntry { file: "bun.lock", manager: PackageManager::Bun },
    LockfileEntry { file: "bun.lockb", manager: PackageManager::Bun },
    LockfileEntry { file: "package-lock.json", manager: PackageManager::Npm },
];

// ============================================================================
// Rust Frameworks
// ============================================================================

const RUST_FRAMEWORKS: &[FrameworkRule] = &[
    // Desktop Apps
    FrameworkRule {
        name: "Tauri",
        patterns: &["tauri"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 100,
    },
    FrameworkRule {
        name: "Iced",
        patterns: &["iced"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 95,
    },
    FrameworkRule {
        name: "egui",
        patterns: &["egui", "eframe"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 94,
    },
    FrameworkRule {
        name: "Slint",
        patterns: &["slint"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 93,
    },
    FrameworkRule {
        name: "Druid",
        patterns: &["druid"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 92,
    },
    // Cross-platform (Dioxus variants)
    FrameworkRule {
        name: "Dioxus Desktop",
        patterns: &["dioxus-desktop"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 90,
    },
    FrameworkRule {
        name: "Dioxus Mobile",
        patterns: &["dioxus-mobile"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 89,
    },
    FrameworkRule {
        name: "Dioxus",
        patterns: &["dioxus"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 85,
    },
    // Web Frameworks (WASM)
    FrameworkRule {
        name: "Leptos",
        patterns: &["leptos"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 80,
    },
    FrameworkRule {
        name: "Yew",
        patterns: &["yew"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 79,
    },
    FrameworkRule {
        name: "Sycamore",
        patterns: &["sycamore"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 78,
    },
    // Backend Frameworks
    FrameworkRule {
        name: "Axum",
        patterns: &["axum"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Actix",
        patterns: &["actix", "actix-web"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
    FrameworkRule {
        name: "Rocket",
        patterns: &["rocket"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 68,
    },
    FrameworkRule {
        name: "Warp",
        patterns: &["warp"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 67,
    },
    FrameworkRule {
        name: "Tide",
        patterns: &["tide"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 66,
    },
    FrameworkRule {
        name: "Poem",
        patterns: &["poem"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 65,
    },
];

const RUST_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "target", category: "build" },
];

const RUST_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "Cargo.lock", manager: PackageManager::Cargo },
];

// ============================================================================
// Python Frameworks
// ============================================================================

const PYTHON_FRAMEWORKS: &[FrameworkRule] = &[
    // Desktop Apps
    FrameworkRule {
        name: "PyQt",
        patterns: &["pyqt", "pyside"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 90,
    },
    FrameworkRule {
        name: "Tkinter",
        patterns: &["tkinter", "customtkinter"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 85,
    },
    // Mobile Apps
    FrameworkRule {
        name: "Kivy",
        patterns: &["kivy"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 80,
    },
    // Web Apps
    FrameworkRule {
        name: "Flet",
        patterns: &["flet"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 75,
    },
    FrameworkRule {
        name: "Textual",
        patterns: &["textual"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Cli,
        priority: 74,
    },
    // Backend Frameworks
    FrameworkRule {
        name: "Django",
        patterns: &["django"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "FastAPI",
        patterns: &["fastapi"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
    FrameworkRule {
        name: "Flask",
        patterns: &["flask"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 68,
    },
    FrameworkRule {
        name: "Starlette",
        patterns: &["starlette"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 67,
    },
    FrameworkRule {
        name: "Litestar",
        patterns: &["litestar"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 66,
    },
    FrameworkRule {
        name: "Sanic",
        patterns: &["sanic"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 65,
    },
];

const PYTHON_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "venv", category: "dependencies" },
    StorageDir { name: ".venv", category: "dependencies" },
    StorageDir { name: "__pycache__", category: "cache" },
    StorageDir { name: ".pytest_cache", category: "cache" },
    StorageDir { name: ".ruff_cache", category: "cache" },
    StorageDir { name: ".mypy_cache", category: "cache" },
    StorageDir { name: "dist", category: "build" },
    StorageDir { name: "build", category: "build" },
    StorageDir { name: "*.egg-info", category: "build" },
];

const PYTHON_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "uv.lock", manager: PackageManager::Uv },
    LockfileEntry { file: "poetry.lock", manager: PackageManager::Poetry },
    LockfileEntry { file: "Pipfile.lock", manager: PackageManager::Pipenv },
];

// ============================================================================
// Go Frameworks
// ============================================================================

const GO_FRAMEWORKS: &[FrameworkRule] = &[
    // Desktop Apps
    FrameworkRule {
        name: "Fyne",
        patterns: &["fyne.io/fyne"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 90,
    },
    FrameworkRule {
        name: "Wails",
        patterns: &["github.com/wailsapp/wails"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 89,
    },
    // Backend Frameworks
    FrameworkRule {
        name: "Gin",
        patterns: &["gin-gonic"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Fiber",
        patterns: &["gofiber/fiber"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
    FrameworkRule {
        name: "Echo",
        patterns: &["labstack/echo"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 68,
    },
    FrameworkRule {
        name: "Chi",
        patterns: &["go-chi/chi"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 67,
    },
    FrameworkRule {
        name: "Gorilla",
        patterns: &["gorilla/mux"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 66,
    },
    FrameworkRule {
        name: "Buffalo",
        patterns: &["gobuffalo/buffalo"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 65,
    },
];

const GO_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "vendor", category: "dependencies" },
    StorageDir { name: "bin", category: "build" },
];

const GO_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "go.sum", manager: PackageManager::GoMod },
];

// ============================================================================
// Java/Kotlin Frameworks
// ============================================================================

const JAVA_FRAMEWORKS: &[FrameworkRule] = &[
    // Mobile Apps
    FrameworkRule {
        name: "Android",
        patterns: &["com.android.application", "AndroidManifest.xml"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 95,
    },
    // Backend Frameworks
    FrameworkRule {
        name: "Spring Boot",
        patterns: &["org.springframework.boot", "spring-boot"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Quarkus",
        patterns: &["io.quarkus", "quarkus"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
    FrameworkRule {
        name: "Micronaut",
        patterns: &["io.micronaut", "micronaut"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 68,
    },
    FrameworkRule {
        name: "Ktor",
        patterns: &["io.ktor", "ktor"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 67,
    },
    FrameworkRule {
        name: "Vert.x",
        patterns: &["io.vertx", "vertx"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 66,
    },
];

const JAVA_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "target", category: "build" },
    StorageDir { name: "build", category: "build" },
    StorageDir { name: ".gradle", category: "cache" },
    StorageDir { name: ".m2", category: "cache" },
];

const JAVA_LOCKFILES: &[LockfileEntry] = &[];

// ============================================================================
// C# / .NET Frameworks
// ============================================================================

const CSHARP_FRAMEWORKS: &[FrameworkRule] = &[
    // Desktop Apps
    FrameworkRule {
        name: "MAUI",
        patterns: &["Microsoft.Maui", "UseMaui"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 95,
    },
    FrameworkRule {
        name: "WPF",
        patterns: &["UseWPF", "PresentationFramework"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 94,
    },
    FrameworkRule {
        name: "WinForms",
        patterns: &["UseWindowsForms", "System.Windows.Forms"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 93,
    },
    FrameworkRule {
        name: "Avalonia",
        patterns: &["Avalonia"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 92,
    },
    // Web Apps
    FrameworkRule {
        name: "Blazor",
        patterns: &["Microsoft.AspNetCore.Components", "Blazor"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 85,
    },
    // Backend
    FrameworkRule {
        name: "ASP.NET Core",
        patterns: &["Microsoft.AspNetCore", "WebApplication"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
];

const CSHARP_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "bin", category: "build" },
    StorageDir { name: "obj", category: "build" },
    StorageDir { name: "packages", category: "dependencies" },
];

const CSHARP_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "packages.lock.json", manager: PackageManager::Nuget },
];

// ============================================================================
// PHP Frameworks
// ============================================================================

const PHP_FRAMEWORKS: &[FrameworkRule] = &[
    FrameworkRule {
        name: "Laravel",
        patterns: &["laravel/framework", "laravel/laravel"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Symfony",
        patterns: &["symfony/framework-bundle", "symfony/symfony"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
    FrameworkRule {
        name: "CodeIgniter",
        patterns: &["codeigniter4/framework", "codeigniter"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 68,
    },
    FrameworkRule {
        name: "CakePHP",
        patterns: &["cakephp/cakephp"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 67,
    },
    FrameworkRule {
        name: "Slim",
        patterns: &["slim/slim"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 66,
    },
];

const PHP_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "vendor", category: "dependencies" },
    StorageDir { name: "storage", category: "cache" },
    StorageDir { name: "bootstrap/cache", category: "cache" },
];

const PHP_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "composer.lock", manager: PackageManager::Composer },
];

// ============================================================================
// Ruby Frameworks
// ============================================================================

const RUBY_FRAMEWORKS: &[FrameworkRule] = &[
    FrameworkRule {
        name: "Rails",
        patterns: &["rails", "railties"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Sinatra",
        patterns: &["sinatra"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
    FrameworkRule {
        name: "Hanami",
        patterns: &["hanami"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 68,
    },
    FrameworkRule {
        name: "Grape",
        patterns: &["grape"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 67,
    },
];

const RUBY_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "vendor/bundle", category: "dependencies" },
    StorageDir { name: "tmp", category: "cache" },
    StorageDir { name: "log", category: "cache" },
];

const RUBY_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "Gemfile.lock", manager: PackageManager::Bundler },
];

// ============================================================================
// Swift Frameworks
// ============================================================================

const SWIFT_FRAMEWORKS: &[FrameworkRule] = &[
    // Mobile/Desktop Apps
    FrameworkRule {
        name: "SwiftUI",
        patterns: &["SwiftUI"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 90,
    },
    FrameworkRule {
        name: "UIKit",
        patterns: &["UIKit"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 85,
    },
    // Backend
    FrameworkRule {
        name: "Vapor",
        patterns: &["vapor/vapor", "Vapor"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Hummingbird",
        patterns: &["hummingbird-project/hummingbird"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
];

const SWIFT_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: ".build", category: "build" },
    StorageDir { name: "DerivedData", category: "build" },
    StorageDir { name: "Pods", category: "dependencies" },
];

const SWIFT_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "Package.resolved", manager: PackageManager::Swift },
    LockfileEntry { file: "Podfile.lock", manager: PackageManager::Swift },
];

// ============================================================================
// Dart/Flutter Frameworks
// ============================================================================

const DART_FRAMEWORKS: &[FrameworkRule] = &[
    FrameworkRule {
        name: "Flutter",
        patterns: &["flutter"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::MobileApp,
        priority: 90,
    },
    // Backend frameworks
    FrameworkRule {
        name: "Shelf",
        patterns: &["shelf"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Serverpod",
        patterns: &["serverpod"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 69,
    },
];

const DART_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "build", category: "build" },
    StorageDir { name: ".dart_tool", category: "cache" },
];

const DART_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "pubspec.lock", manager: PackageManager::Pub },
];

// ============================================================================
// Elixir Frameworks
// ============================================================================

const ELIXIR_FRAMEWORKS: &[FrameworkRule] = &[
    FrameworkRule {
        name: "Phoenix",
        patterns: &["phoenix", ":phoenix"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::Backend,
        priority: 70,
    },
    FrameworkRule {
        name: "Phoenix LiveView",
        patterns: &["phoenix_live_view"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::WebApp,
        priority: 75,
    },
    FrameworkRule {
        name: "Nerves",
        patterns: &["nerves"],
        source: DetectionSource::ManifestContent,
        category: AppCategory::DesktopApp,
        priority: 80,
    },
];

const ELIXIR_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: "_build", category: "build" },
    StorageDir { name: "deps", category: "dependencies" },
];

const ELIXIR_LOCKFILES: &[LockfileEntry] = &[
    LockfileEntry { file: "mix.lock", manager: PackageManager::Mix },
];

// ============================================================================
// Common Storage Directories
// ============================================================================

/// Storage directories common to all project types
pub const COMMON_STORAGE_DIRS: &[StorageDir] = &[
    StorageDir { name: ".git", category: "vcs" },
];

// ============================================================================
// Main Registry
// ============================================================================

/// The master registry of all supported languages and their detection rules.
/// Sorted by priority/popularity based on Stack Overflow 2025 Survey.
pub static REGISTRY: &[LanguageEntry] = &[
    // JavaScript/TypeScript (66% usage)
    LanguageEntry {
        language: Language::JavaScript,
        display_name: "JavaScript/TypeScript",
        manifest: "package.json",
        alt_manifests: &[],
        frameworks: JS_FRAMEWORKS,
        storage_dirs: JS_STORAGE_DIRS,
        lockfiles: JS_LOCKFILES,
        default_manager: PackageManager::Npm,
        default_category: AppCategory::Library,
        default_framework: "Node.js",
    },
    // Python (58% usage)
    LanguageEntry {
        language: Language::Python,
        display_name: "Python",
        manifest: "pyproject.toml",
        alt_manifests: &["requirements.txt", "setup.py"],
        frameworks: PYTHON_FRAMEWORKS,
        storage_dirs: PYTHON_STORAGE_DIRS,
        lockfiles: PYTHON_LOCKFILES,
        default_manager: PackageManager::Pip,
        default_category: AppCategory::Library,
        default_framework: "Python",
    },
    // Java (29% usage)
    LanguageEntry {
        language: Language::Java,
        display_name: "Java",
        manifest: "pom.xml",
        alt_manifests: &["build.gradle", "build.gradle.kts"],
        frameworks: JAVA_FRAMEWORKS,
        storage_dirs: JAVA_STORAGE_DIRS,
        lockfiles: JAVA_LOCKFILES,
        default_manager: PackageManager::Maven,
        default_category: AppCategory::Library,
        default_framework: "Java",
    },
    // C# (28% usage)
    LanguageEntry {
        language: Language::CSharp,
        display_name: "C#",
        manifest: "*.csproj",
        alt_manifests: &["*.sln", "*.fsproj"],
        frameworks: CSHARP_FRAMEWORKS,
        storage_dirs: CSHARP_STORAGE_DIRS,
        lockfiles: CSHARP_LOCKFILES,
        default_manager: PackageManager::Dotnet,
        default_category: AppCategory::Library,
        default_framework: ".NET",
    },
    // PHP (19% usage)
    LanguageEntry {
        language: Language::Php,
        display_name: "PHP",
        manifest: "composer.json",
        alt_manifests: &[],
        frameworks: PHP_FRAMEWORKS,
        storage_dirs: PHP_STORAGE_DIRS,
        lockfiles: PHP_LOCKFILES,
        default_manager: PackageManager::Composer,
        default_category: AppCategory::Backend,
        default_framework: "PHP",
    },
    // Go (16% usage)
    LanguageEntry {
        language: Language::Go,
        display_name: "Go",
        manifest: "go.mod",
        alt_manifests: &[],
        frameworks: GO_FRAMEWORKS,
        storage_dirs: GO_STORAGE_DIRS,
        lockfiles: GO_LOCKFILES,
        default_manager: PackageManager::GoMod,
        default_category: AppCategory::Library,
        default_framework: "Go",
    },
    // Rust (15% usage)
    LanguageEntry {
        language: Language::Rust,
        display_name: "Rust",
        manifest: "Cargo.toml",
        alt_manifests: &[],
        frameworks: RUST_FRAMEWORKS,
        storage_dirs: RUST_STORAGE_DIRS,
        lockfiles: RUST_LOCKFILES,
        default_manager: PackageManager::Cargo,
        default_category: AppCategory::Library,
        default_framework: "Rust",
    },
    // Ruby (~5% usage)
    LanguageEntry {
        language: Language::Ruby,
        display_name: "Ruby",
        manifest: "Gemfile",
        alt_manifests: &[],
        frameworks: RUBY_FRAMEWORKS,
        storage_dirs: RUBY_STORAGE_DIRS,
        lockfiles: RUBY_LOCKFILES,
        default_manager: PackageManager::Bundler,
        default_category: AppCategory::Backend,
        default_framework: "Ruby",
    },
    // Swift (~5% usage)
    LanguageEntry {
        language: Language::Swift,
        display_name: "Swift",
        manifest: "Package.swift",
        alt_manifests: &[],
        frameworks: SWIFT_FRAMEWORKS,
        storage_dirs: SWIFT_STORAGE_DIRS,
        lockfiles: SWIFT_LOCKFILES,
        default_manager: PackageManager::Swift,
        default_category: AppCategory::MobileApp,
        default_framework: "Swift",
    },
    // Dart/Flutter (~4% usage)
    LanguageEntry {
        language: Language::Dart,
        display_name: "Dart",
        manifest: "pubspec.yaml",
        alt_manifests: &[],
        frameworks: DART_FRAMEWORKS,
        storage_dirs: DART_STORAGE_DIRS,
        lockfiles: DART_LOCKFILES,
        default_manager: PackageManager::Pub,
        default_category: AppCategory::MobileApp,
        default_framework: "Dart",
    },
    // Elixir (~2% usage)
    LanguageEntry {
        language: Language::Elixir,
        display_name: "Elixir",
        manifest: "mix.exs",
        alt_manifests: &[],
        frameworks: ELIXIR_FRAMEWORKS,
        storage_dirs: ELIXIR_STORAGE_DIRS,
        lockfiles: ELIXIR_LOCKFILES,
        default_manager: PackageManager::Mix,
        default_category: AppCategory::Backend,
        default_framework: "Elixir",
    },
];

/// Directories that should never be descended into during project scanning
pub const SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    ".git",
    "__pycache__",
    "vendor",
    ".next",
    ".nuxt",
    "venv",
    ".venv",
    "_build",
    "deps",
    ".dart_tool",
    "Pods",
    "DerivedData",
    ".gradle",
    "bin",
    "obj",
];
