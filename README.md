# Houston

A lightweight desktop app for inspecting your local development environment. Built with Tauri 2.0, React 19, and TypeScript.

Houston gives you a single dashboard to see your PATH, language runtimes, environment variables, workspace git status, global packages, and CLI tool configs &mdash; things you'd otherwise piece together from a dozen terminal commands.

## Features

**System Overview** &mdash; OS, kernel, architecture, shell, CPU, and memory at a glance.

**PATH Inspector** &mdash; Every PATH entry validated for existence and duplicates, categorized by source (Homebrew, Rust, Node.js, Python, etc.), with search and filtering.

**Language Detection** &mdash; Automatically detects Node.js, Python, Ruby, Go, Rust, Java, PHP, Deno, and Bun with version numbers, binary paths, and version manager identification (nvm, pyenv, rbenv, rustup, etc.).

**Environment Variables** &mdash; All env vars categorized (Path, Language, Shell, Cloud, Git/SSH, Sensitive) with search. Sensitive values are automatically masked.

**Workspace Manager** &mdash; Point Houston at your project directories. It scans for projects by marker files (package.json, Cargo.toml, go.mod, etc.), detects frameworks (Next.js, Django, Tauri, Astro, etc.), and shows package manager info.

**Git Awareness** &mdash; Per-project branch, dirty state, modified/untracked/staged counts, ahead/behind remote, and last commit info.

**Global Packages** &mdash; Tabbed view of npm global, Homebrew, pip, and Cargo installed packages with search.

**Claude Code Config** &mdash; Reads `~/.claude/` to show MCP servers, settings, and project count.

**Quick Actions** &mdash; Open any project in Terminal, your editor (VS Code, Cursor, Zed), or Claude Code with one click.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Tauri 2.0 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| State | TanStack React Query + Zustand |
| Icons | Lucide React |
| Build | Vite 7 |
| Package Manager | pnpm |

## Architecture

All system scanning runs in Rust via `std::process::Command`. The frontend never executes shell commands directly.

```
src-tauri/src/
  lib.rs              # Builder setup, plugin + command registration
  state.rs            # AppState with TTL caches (Mutex<ScanCache<T>>)
  scanners/           # System, PATH, languages, env, workspace, git, packages, claude
  commands/           # Tauri command handlers (21 commands)

src/
  lib/commands.ts     # Typed invoke() wrappers
  hooks/              # React Query hooks per scanner
  stores/             # Zustand stores (navigation, workspaces)
  components/
    layout/           # App shell, sidebar, header, status bar, command palette
    sections/         # Dashboard, System, PATH, Languages, Environment,
                      # Workspaces, Packages, Tools
    shared/           # StatusDot, StatusBadge, SearchInput, CopyButton, etc.
```

**Caching**: Each scanner result is cached with TTLs (system: 300s, PATH/env: 60s, languages: 120s, git: 30s, packages: 300s). Manual refresh invalidates the cache.

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- Tauri 2 system dependencies ([see Tauri docs](https://v2.tauri.app/start/prerequisites/))

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+1` through `Cmd+8` | Navigate to section |
| `Cmd+K` | Open command palette |
| `Cmd+R` | Refresh all data |

## License

MIT
