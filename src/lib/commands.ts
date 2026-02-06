import { invoke } from "@tauri-apps/api/core";

// System types
export interface SystemInfo {
  os_name: string;
  os_version: string;
  kernel_version: string;
  architecture: string;
  hostname: string;
  shell: string;
  shell_version: string;
  cpu_brand: string;
  memory_gb: string;
  username: string;
  home_dir: string;
  binary_architecture: string;
  architecture_mismatch: boolean;
}

export interface PathEntry {
  path: string;
  exists: boolean;
  is_duplicate: boolean;
  index: number;
  category: string;
}

export interface LanguageInfo {
  name: string;
  version: string;
  binary_path: string;
  manager: string;
  installed: boolean;
  icon: string;
}

export interface EnvVarInfo {
  key: string;
  value: string;
  category: string;
}

export interface ProjectInfo {
  name: string;
  path: string;
  project_type: string;
  framework: string;
  package_manager: string;
  description: string;
  has_git: boolean;
  group: string;
  group_type: string;
  is_monorepo_root: boolean;
  worktree_id: string;
}

export interface GitStatus {
  project_path: string;
  branch: string;
  is_dirty: boolean;
  modified_count: number;
  untracked_count: number;
  staged_count: number;
  ahead: number;
  behind: number;
  last_commit_message: string;
  last_commit_date: string;
  remote_url: string;
}

export interface PackageInfo {
  name: string;
  version: string;
}

export interface PackageList {
  npm_global: PackageInfo[];
  brew: PackageInfo[];
  pip: PackageInfo[];
  cargo: PackageInfo[];
  scoop: PackageInfo[];
  chocolatey: PackageInfo[];
}

export interface McpServer {
  name: string;
  command: string;
  args: string[];
}

export interface SettingEntry {
  key: string;
  value: string;
  value_type: string;
}

export interface ClaudeConfig {
  installed: boolean;
  config_path: string;
  has_mcp_servers: boolean;
  mcp_servers: McpServer[];
  project_count: number;
  has_settings: boolean;
  settings: SettingEntry[];
}

// AI Tools types
export interface AiToolInfo {
  name: string;
  binary: string;
  installed: boolean;
  version: string | null;
  latest_version: string | null;
  update_available: boolean;
  install_method:
    | "npm"
    | "pip"
    | "brew"
    | "brew_cask"
    | "gh_extension"
    | "self_managed";
  package_name: string;
  binary_path: string | null;
  install_hint: string;
  tool_type: "cli" | "app" | "both";
  app_name: string | null;
  app_installed: boolean;
  app_path: string | null;
  app_version: string | null;
  config_dir: string | null;
  has_ai: boolean;
  ai_features: string[];
}

export interface AiToolsReport {
  tools: AiToolInfo[];
  scanned_at: string;
}

// Diagnostics types
export interface DiagnosticItem {
  id: string;
  category: string;
  severity: "error" | "warning" | "info" | "suggestion";
  title: string;
  description: string;
  details: string | null;
  fix_id: string | null;
  fix_label: string | null;
}

export interface DiagnosticReport {
  items: DiagnosticItem[];
  scanned_at: string;
}

export interface FixResult {
  success: boolean;
  message: string;
  output: string | null;
}

// Settings types
export interface SettingPair {
  key: string;
  value: string;
}

// Scan history types
export interface ScanHistoryRow {
  id: number;
  scanner: string;
  data_json: string;
  scanned_at: string;
}

// Issue types
export interface IssueRow {
  diagnostic_id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: "open" | "dismissed" | "resolved";
  first_seen: string;
  last_seen: string;
}

// Changelog types
export interface ChangelogRow {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string;  // JSON array
  sections: string | null;  // JSON array (optional)
}

export interface ChangelogInput {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string;  // JSON string
  sections?: string;  // JSON string
}

// Project Analysis types
export interface SizeInfo {
  bytes: number;
  display: string;
}

export interface DirectorySize {
  name: string;
  size: SizeInfo;
  category: string;
}

export interface JsDetails {
  node_modules_size: SizeInfo | null;
  dependency_count: number;
  dev_dependency_count: number;
  scripts: string[];
  engines: string | null;
  license: string | null;
}

export interface RustDetails {
  target_size: SizeInfo | null;
  dependency_count: number;
  edition: string | null;
  features: string[];
}

export interface PythonDetails {
  venv_size: SizeInfo | null;
  dependency_count: number;
  python_version: string | null;
}

export interface GoDetails {
  vendor_size: SizeInfo | null;
  module_count: number;
  go_version: string | null;
}

export type LanguageDetails =
  | { type: "JavaScript" } & JsDetails
  | { type: "Rust" } & RustDetails
  | { type: "Python" } & PythonDetails
  | { type: "Go" } & GoDetails
  | { type: "Other" };

export interface ExtendedGitInfo {
  total_commits: number;
  contributors: string[];
  first_commit_date: string | null;
  tags: string[];
  stash_count: number;
}

export interface ProjectAnalysis {
  path: string;
  name: string;
  project_type: string;
  framework: string;
  total_size: SizeInfo;
  code_size: SizeInfo;
  language_details: LanguageDetails;
  storage_breakdown: DirectorySize[];
  git_info: ExtendedGitInfo | null;
  analyzed_at: string;
}

// Stats types
export interface ScannerStatsSnapshot {
  name: string;
  cache_hits: number;
  cache_misses: number;
  last_scan_duration_ms: number | null;
  total_scans: number;
  ttl_secs: number;
  is_warm: boolean;
}

export interface AppStatsSnapshot {
  scanners: ScannerStatsSnapshot[];
  pid: number;
  uptime_secs: number;
  memory_bytes: number;
}

// Command wrappers
export const commands = {
  // System
  getSystemInfo: () => invoke<SystemInfo>("get_system_info"),
  getPathEntries: () => invoke<PathEntry[]>("get_path_entries"),
  refreshSystemInfo: () => invoke<SystemInfo>("refresh_system_info"),
  refreshPathEntries: () => invoke<PathEntry[]>("refresh_path_entries"),

  // Languages
  getLanguages: () => invoke<LanguageInfo[]>("get_languages"),
  refreshLanguages: () => invoke<LanguageInfo[]>("refresh_languages"),

  // Environment
  getEnvVars: () => invoke<EnvVarInfo[]>("get_env_vars"),
  refreshEnvVars: () => invoke<EnvVarInfo[]>("refresh_env_vars"),

  // Workspace
  getWorkspacePaths: () => invoke<string[]>("get_workspace_paths"),
  addWorkspace: (path: string) => invoke<string[]>("add_workspace", { path }),
  removeWorkspace: (path: string) =>
    invoke<string[]>("remove_workspace", { path }),
  scanProjects: () => invoke<ProjectInfo[]>("scan_projects"),
  getGitStatus: (projectPath: string) =>
    invoke<GitStatus | null>("get_git_status", { projectPath }),
  getAllGitStatuses: () => invoke<GitStatus[]>("get_all_git_statuses"),
  getMonorepoPackages: (rootPath: string) =>
    invoke<ProjectInfo[]>("get_monorepo_packages", { rootPath }),

  // Packages
  getPackages: () => invoke<PackageList>("get_packages"),
  refreshPackages: () => invoke<PackageList>("refresh_packages"),

  // Claude
  getClaudeConfig: () => invoke<ClaudeConfig>("get_claude_config"),
  refreshClaudeConfig: () => invoke<ClaudeConfig>("refresh_claude_config"),

  // Actions
  openInTerminal: (path: string) =>
    invoke<void>("open_in_terminal", { path }),
  openInEditor: (path: string) => invoke<void>("open_in_editor", { path }),
  openClaudeCode: (path: string) =>
    invoke<void>("open_claude_code", { path }),

  // AI Tools
  getAiTools: () => invoke<AiToolsReport>("get_ai_tools"),
  refreshAiTools: () => invoke<AiToolsReport>("refresh_ai_tools"),
  updateAiTool: (toolName: string) =>
    invoke<FixResult>("update_ai_tool", { toolName }),
  getToolMcpServers: (toolName: string) =>
    invoke<McpServer[]>("get_tool_mcp_servers", { toolName }),

  // Diagnostics
  getDiagnostics: () => invoke<DiagnosticReport>("get_diagnostics"),
  refreshDiagnostics: () =>
    invoke<DiagnosticReport>("refresh_diagnostics"),
  runDiagnosticFix: (fixId: string) =>
    invoke<FixResult>("run_diagnostic_fix", { fixId }),

  // Stats
  getAppStats: () => invoke<AppStatsSnapshot>("get_app_stats"),

  // Settings
  getSettings: () => invoke<SettingPair[]>("get_settings"),
  getSetting: (key: string) => invoke<string | null>("get_setting", { key }),
  setSetting: (key: string, value: string) =>
    invoke<void>("set_setting", { key, value }),

  // Scan History
  getScanHistory: (scanner: string, limit?: number) =>
    invoke<ScanHistoryRow[]>("get_scan_history", { scanner, limit }),
  getLatestScan: (scanner: string) =>
    invoke<ScanHistoryRow | null>("get_latest_scan", { scanner }),

  // Issues
  getIssues: (status?: string) =>
    invoke<IssueRow[]>("get_issues", { status }),
  dismissIssue: (diagnosticId: string) =>
    invoke<void>("dismiss_issue", { diagnosticId }),
  updateIssueStatus: (diagnosticId: string, status: string) =>
    invoke<void>("update_issue_status", { diagnosticId, status }),

  // Project Analysis
  analyzeProject: (projectPath: string) =>
    invoke<ProjectAnalysis>("analyze_project", { projectPath }),

  // Changelogs
  getChangelogs: () => invoke<ChangelogRow[]>("get_changelogs"),
  getChangelog: (version: string) =>
    invoke<ChangelogRow | null>("get_changelog", { version }),
  syncChangelog: (changelog: ChangelogInput) =>
    invoke<void>("sync_changelog", { changelog }),
};
