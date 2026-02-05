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
};
