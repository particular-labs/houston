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

export interface ClaudeConfig {
  installed: boolean;
  config_path: string;
  has_mcp_servers: boolean;
  mcp_servers: McpServer[];
  project_count: number;
  has_settings: boolean;
  settings_summary: string[];
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
};
