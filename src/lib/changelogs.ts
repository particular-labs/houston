import { commands, type ChangelogRow, type ChangelogInput } from "./commands";

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  sections?: ChangelogSection[];
}

// Static changelog data - add new versions at the TOP
export const changelogs: ChangelogEntry[] = [
  {
    version: "0.11.0",
    date: "2026-02-10",
    title: "AI Context & Project Health",
    summary: "See which projects have AI context files (CLAUDE.md, .cursorrules, etc.) and get a health grade for every project based on best-practice checks.",
    highlights: [
      "Project Health Score grades every project A–F across 7 quality checks",
      "AI Context Files dashboard detects CLAUDE.md, .cursorrules, copilot-instructions, and AGENTS.md",
      "New dashboard metric cards for AI context coverage and average health grade",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Project Health Score with letter grade (A–F) based on README, LICENSE, tests, CI, .gitignore, linter, and type checking",
          "Health grade badge on every project card with color-coded status",
          "Health Score detail card with percentage bar and 7-item checklist",
          "AI context file detection for CLAUDE.md, .cursorrules, .github/copilot-instructions.md, and AGENTS.md",
          "Brain icon on project cards when AI context files are present",
          "AI Context detail card showing detected and missing context files",
          "Dashboard metric card showing AI context coverage across projects",
          "Dashboard metric card showing average project health grade",
        ],
      },
    ],
  },
  {
    version: "0.10.0",
    date: "2026-02-08",
    title: "Dev Servers & UX Polish",
    summary: "Detect running dev servers per project, sort and filter your workspace, and dozens of UX improvements across the board.",
    highlights: [
      "Dev server detection and start/stop controls for every project",
      "Project sorting by name, framework, or language with persistent preference",
      "Filter projects by git status (uncommitted/clean) or running dev server",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Dev server scanner detects listening processes and maps them to workspace projects",
          "Start and stop dev servers directly from the project detail view",
          "Green pulsing indicator on project cards when a dev server is running",
          "Sort projects by name, framework, or language — preference persists across sessions",
          "Filter projects by git status (uncommitted changes vs clean) or running dev server",
          "Keyboard shortcuts: Cmd+, for Settings, Escape to close panels, Cmd+Shift+R for hard refresh",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Global cursor-pointer for all interactive elements (buttons, links, toggles)",
          "Empty states for Languages, Tools, and Issues sections when no data is found",
          "Error banners with retry buttons across all major sections",
          "Toast notifications for workspace add/remove, container actions, settings saves, and refreshes",
          "Container port links only show for HTTP-likely ports — database ports display as plain text",
          "TTL settings validate input range (5–3600 seconds) with inline error messages",
          "Memory display shows 'Unknown' instead of misleading '0 GB' or 'unlimited'",
        ],
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-02-07",
    title: "Performance Overhaul",
    summary: "Dramatic reduction in CPU and memory usage when Houston is idle or running in the background.",
    highlights: [
      "Zero CPU usage when minimized — app fully idles after 5 minutes hidden",
      "60-70% fewer process spawns during active use",
      "Shared package cache eliminates duplicate brew/npm/pip outdated calls",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Visibility-aware polling pauses all scanning when app is hidden",
          "Smart query system with tiered intervals: active, hidden, and deep idle",
          "Lightweight issue count for sidebar instead of full diagnostic scan",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Docker scanner skips expensive stats query when no containers are running",
          "Docker DB writes use fingerprinting — only records when container state changes",
          "Backend TTLs increased across all scanners for stable data (system, PATH, env: 1hr)",
          "SQLite write throttling prevents scan history bloat (5-min minimum between writes)",
          "Shared outdated package cache with 10-minute TTL used by diagnostics and AI tools",
          "Sidebar no longer drives Docker or diagnostics polling",
        ],
      },
      {
        title: "Technical",
        items: [
          "New use-visibility hook tracks document.visibilityState + Tauri focus events",
          "New use-smart-query hook wraps TanStack Query with visibility awareness",
          "New outdated_cache.rs module deduplicates brew/npm/pip outdated queries",
          "All data hooks migrated from useQuery to useSmartQuery",
          "refetchOnWindowFocus enabled for instant data refresh when returning to app",
        ],
      },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-02-06",
    title: "Onboarding & Reliable Updates",
    summary: "A welcoming first-launch experience and improved background update checking.",
    highlights: [
      "Onboarding modal welcomes first-time users with a quick start guide",
      "Reliable background update checking with global state",
      "Hourly update checks for faster update delivery",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "First-launch onboarding modal with quick start tips",
          "Keyboard shortcuts reference in onboarding",
          "One-click navigation to Workspaces after onboarding",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Update state now shared between sidebar and settings",
          "Background update checks run every hour during active development",
          "Rate-limited focus checks prevent duplicate API calls",
        ],
      },
      {
        title: "Technical",
        items: [
          "New Zustand store for global update state",
          "Centralized update checker hook with refs to avoid effect loops",
          "Onboarding state persisted via has_seen_onboarding setting",
        ],
      },
    ],
  },
  {
    version: "0.7.2",
    date: "2026-02-06",
    title: "Release Notes Display Fix",
    summary: "Fixed an issue where release notes weren't loading in the Settings tab.",
    highlights: [
      "Fixed release notes not appearing in Settings",
    ],
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Fixed race condition where changelog data wasn't loaded before display",
          "Invalidate changelog query after syncing data to database",
        ],
      },
    ],
  },
  {
    version: "0.7.1",
    date: "2026-02-06",
    title: "Database Migration Fix",
    summary: "Hotfix for a crash on startup when upgrading from previous versions.",
    highlights: [
      "Fixed crash on startup caused by duplicate database column",
    ],
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Fixed database migration error that caused app to crash on launch",
          "Corrected migration order for changelogs table schema",
        ],
      },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-02-06",
    title: "What's New & Settings Overhaul",
    summary: "Stay informed about updates with the new What's New modal and enjoy a cleaner, tabbed Settings experience.",
    highlights: [
      "What's New modal appears after updates to show what changed",
      "Settings page reorganized into 4 tabs for better navigation",
      "Release Notes section with paginated history",
      "Changelog data now persisted in database",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "What's New modal automatically displays after app updates",
          "View any past release details from the Release Notes tab",
          "Changelogs synced to SQLite database on startup",
          "Manual 'View What's New' trigger from Release Notes",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Settings page split into General, Performance, System, and Release Notes tabs",
          "Cleaner tab navigation with icons and active states",
          "Release cards show version, date, title, and expandable highlights",
          "Pagination for release history (5 per page)",
        ],
      },
      {
        title: "Technical",
        items: [
          "New database migration for changelogs table with summary column",
          "Zustand state for What's New modal with version targeting",
          "React Query hook for fetching changelogs from database",
          "Updated CLAUDE.md with release process documentation",
        ],
      },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-02-05",
    title: "Issues Dashboard & Polish",
    summary: "Centralized diagnostics view with a touch of personality, plus quality-of-life improvements across the app.",
    highlights: [
      "New centralized Issues section aggregates all diagnostics",
      "Onboarding toast welcomes new users with quick tips",
      "Periodic background update checks keep you current",
      "AI Tools renamed to Tools for clarity",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Issues section with filterable diagnostics across all categories",
          "Snarky personality adds humor to issue descriptions",
          "Project count badge shows workspace size at a glance",
          "Onboarding toast with keyboard shortcuts on first launch",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Automatic update checks every 6 hours in background",
          "Updated landing page with new screenshots",
          "Renamed 'AI Tools' section to 'Tools' for simplicity",
        ],
      },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-02-05",
    title: "Demo Mode & Dynamic Downloads",
    summary: "Try Houston without installing, and get the right download for your platform automatically.",
    highlights: [
      "Demo mode lets you explore Houston without installation",
      "Landing page now shows correct download for your platform",
      "Improved first-run experience",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Demo mode with sample data for trying the app",
          "Dynamic download buttons detect your OS automatically",
          "Platform-specific installation instructions",
        ],
      },
    ],
  },
  {
    version: "0.4.1",
    date: "2026-02-05",
    title: "Project Details & Bug Fixes",
    summary: "Deep dive into project storage usage and git statistics, plus visual fixes for light mode users.",
    highlights: [
      "New project detail view with storage analysis",
      "Fixed splash screen appearance in light mode",
      "Centralized project detection for consistency",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Project detail drawer shows disk usage breakdown",
          "Storage analysis for node_modules, target, venv directories",
          "Git statistics including commit count and contributors",
        ],
      },
      {
        title: "Bug Fixes",
        items: [
          "Splash screen now renders correctly in light theme",
          "Unified project detection logic across all scanners",
        ],
      },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-02-05",
    title: "SQLite Persistence & Light Theme",
    summary: "Your settings and scan history now persist across sessions, plus a beautiful new light theme option.",
    highlights: [
      "All settings and data now persist in SQLite database",
      "Beautiful light theme option added",
      "Theme toggle moved to sidebar for quick access",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "SQLite database stores settings, workspaces, and scan history",
          "Light theme with carefully tuned color palette",
          "Theme toggle button in sidebar footer",
          "Scan history preserved across app restarts",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Settings persist between sessions",
          "Workspace paths saved to database",
          "Cache TTL settings now configurable and persistent",
        ],
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-02-05",
    title: "Cross-Platform Support",
    summary: "Houston now runs natively on Windows and Linux alongside macOS, with platform-specific optimizations.",
    highlights: [
      "Houston now runs on Windows and Linux",
      "Platform-specific optimizations for each OS",
      "Unified codebase with conditional compilation",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Windows support with native look and feel",
          "Linux support for major distributions",
          "Platform-aware shell and path detection",
        ],
      },
      {
        title: "Technical",
        items: [
          "Conditional compilation for platform-specific code",
          "Fixed cross-platform build errors",
          "CI/CD pipeline builds for all three platforms",
        ],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-02-05",
    title: "Performance & Architecture Detection",
    summary: "Dramatically faster startup with parallel scanning, plus warnings when running under Rosetta emulation.",
    highlights: [
      "Parallel scanning makes startup 3x faster",
      "Detects Apple Silicon vs Intel architecture mismatch",
      "Fixed window dragging on macOS",
    ],
    sections: [
      {
        title: "New Features",
        items: [
          "Architecture detection warns about Rosetta emulation",
          "Landing page with download links and feature overview",
          "Auto-updater checks for new versions",
        ],
      },
      {
        title: "Improvements",
        items: [
          "All scanners now run in parallel on startup",
          "Window dragging works correctly on macOS",
          "Improved notarization reliability with retry logic",
        ],
      },
    ],
  },
  {
    version: "0.1.1",
    date: "2026-02-03",
    title: "CI/CD Fix",
    summary: "Quick patch to fix continuous integration builds and improve release reliability.",
    highlights: [
      "Fixed package manager configuration for CI builds",
      "Improved build reliability",
    ],
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Added packageManager field to package.json",
          "Fixed CI pipeline dependency installation",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-03",
    title: "Initial Release",
    summary: "The first public release of Houston — a comprehensive developer environment dashboard for macOS, Windows, and Linux.",
    highlights: [
      "First public release of Houston",
      "Complete developer environment dashboard",
      "AI tools detection and management",
    ],
    sections: [
      {
        title: "Features",
        items: [
          "Dashboard with system health overview",
          "System info panel with OS and hardware details",
          "PATH inspector with duplicate and issue detection",
          "Language version manager (Node, Python, Ruby, etc.)",
          "Environment variable browser with categories",
          "Workspace scanner with monorepo support",
          "Global packages viewer (npm, pip, brew, cargo)",
          "AI tools section with update checking",
        ],
      },
      {
        title: "Developer Experience",
        items: [
          "Pre-flight system check splash screen",
          "Keyboard shortcuts for navigation (Cmd+1-9)",
          "Command palette for quick access (Cmd+K)",
          "Contextual health diagnostics per section",
          "One-click open in Terminal, Editor, or Claude Code",
        ],
      },
      {
        title: "Technical",
        items: [
          "Built with Tauri, React, and TypeScript",
          "Rust backend for fast native scanning",
          "Signed and notarized for macOS Gatekeeper",
          "Auto-updater for seamless updates",
        ],
      },
    ],
  },
];

// Convert static entry to DB format
function toChangelogInput(entry: ChangelogEntry): ChangelogInput {
  return {
    version: entry.version,
    date: entry.date,
    title: entry.title,
    summary: entry.summary,
    highlights: JSON.stringify(entry.highlights),
    sections: entry.sections ? JSON.stringify(entry.sections) : undefined,
  };
}

// Convert DB row to ChangelogEntry
export function fromChangelogRow(row: ChangelogRow): ChangelogEntry {
  return {
    version: row.version,
    date: row.date,
    title: row.title,
    summary: row.summary,
    highlights: JSON.parse(row.highlights) as string[],
    sections: row.sections ? (JSON.parse(row.sections) as ChangelogSection[]) : undefined,
  };
}

// Sync all static changelogs to the database
export async function syncChangelogsToDb(): Promise<void> {
  for (const entry of changelogs) {
    await commands.syncChangelog(toChangelogInput(entry));
  }
}

// Get all changelogs from DB
export async function getChangelogsFromDb(): Promise<ChangelogEntry[]> {
  const rows = await commands.getChangelogs();
  return rows.map(fromChangelogRow);
}

// Get a specific changelog from DB
export async function getChangelogFromDb(version: string): Promise<ChangelogEntry | null> {
  const row = await commands.getChangelog(version);
  return row ? fromChangelogRow(row) : null;
}

// Legacy functions for backward compatibility
export function getChangelogForVersion(version: string): ChangelogEntry | undefined {
  return changelogs.find((entry) => entry.version === version);
}

export function getLatestChangelog(): ChangelogEntry | undefined {
  return changelogs[0];
}
