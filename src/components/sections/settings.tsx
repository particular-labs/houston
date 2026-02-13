import {
  Settings,
  Trash2,
  Clock,
  HardDrive,
  Hash,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Database,
  Palette,
  Cog,
  Timer,
  Gauge,
  Info,
  Sparkles,
  FolderSearch,
  Code2,
} from "lucide-react";
import { useAppStats } from "@/hooks/use-app-stats";
import { SectionHeader } from "@/components/shared/section-header";
import { InfoCardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useSettings, useSetSetting, getSettingValue } from "@/hooks/use-settings";
import { appDataDir } from "@tauri-apps/api/path";
import { useQuery } from "@tanstack/react-query";
import { ReleaseNotesSection } from "./release-notes";
import { useUpdateStore, type UpdateStatus } from "@/stores/update";
import { commands } from "@/lib/commands";
import { filterToolsByCategory } from "@/lib/tool-filters";

function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "N/A";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function hitRate(hits: number, misses: number): string {
  const total = hits + misses;
  if (total === 0) return "-";
  return `${((hits / total) * 100).toFixed(0)}%`;
}

type SettingsTab = "general" | "performance" | "system" | "releases";

const TABS: { id: SettingsTab; label: string; icon: typeof Cog }[] = [
  { id: "general", label: "General", icon: Cog },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "system", label: "System", icon: Info },
  { id: "releases", label: "Release Notes", icon: Sparkles },
];

const STARTUP_SECTIONS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "system", label: "System" },
  { value: "path", label: "PATH" },
  { value: "languages", label: "Languages" },
  { value: "environment", label: "Environment" },
  { value: "workspaces", label: "Workspaces" },
  { value: "packages", label: "Packages" },
  { value: "tools", label: "Tools" },
  { value: "issues", label: "Issues" },
  { value: "settings", label: "Settings" },
];

const TTL_SETTINGS = [
  { key: "ttl_system", label: "System", default: 300 },
  { key: "ttl_path", label: "PATH", default: 60 },
  { key: "ttl_languages", label: "Languages", default: 120 },
  { key: "ttl_env", label: "Environment", default: 60 },
  { key: "ttl_projects", label: "Projects", default: 60 },
  { key: "ttl_git", label: "Git", default: 30 },
  { key: "ttl_packages", label: "Packages", default: 300 },
  { key: "ttl_claude", label: "Claude", default: 300 },
  { key: "ttl_diagnostics", label: "Diagnostics", default: 120 },
  { key: "ttl_ai_tools", label: "AI Tools", default: 120 },
];

// =============================================================================
// General Tab Components
// =============================================================================

function GeneralTabContent() {
  const { data: settings } = useSettings();
  const setSetting = useSetSetting();
  const queryClient = useQueryClient();

  const theme = getSettingValue(settings, "theme", "dark");

  const { data: aiToolsReport } = useQuery({
    queryKey: ["ai-tools"],
    queryFn: () => commands.getAiTools(),
  });

  const terminalOptions = filterToolsByCategory(aiToolsReport?.tools, "terminal");
  const editorOptions = filterToolsByCategory(aiToolsReport?.tools, "editor");
  const aiToolOptions = filterToolsByCategory(aiToolsReport?.tools, "ai_tool");

  const defaultTerminal = getSettingValue(settings, "default_terminal", "auto");
  const defaultEditor = getSettingValue(settings, "default_editor", "auto");
  const defaultAiTool = getSettingValue(settings, "default_ai_tool", "auto");
  const startupSection = getSettingValue(settings, "startup_section", "dashboard");
  const autoScan = getSettingValue(settings, "auto_scan_on_startup", "true");
  const snarkyEnabled = getSettingValue(settings, "snarky_comments", "true");
  const scanDepth = getSettingValue(settings, "scan_max_depth", "5");

  const selectClass = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Appearance */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          Appearance
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSetting.mutate({ key: "theme", value: "dark" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              theme === "dark"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            onClick={() => setSetting.mutate({ key: "theme", value: "light" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              theme === "light"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
        </div>
      </div>

      {/* Developer Tools */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Code2 className="h-3.5 w-3.5" />
          Developer Tools
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Default Terminal
            </label>
            <select
              value={defaultTerminal}
              onChange={(e) =>
                setSetting.mutate({ key: "default_terminal", value: e.target.value })
              }
              className={selectClass}
            >
              <option value="auto">Auto-detect</option>
              {terminalOptions.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Default Editor
            </label>
            <select
              value={defaultEditor}
              onChange={(e) =>
                setSetting.mutate({ key: "default_editor", value: e.target.value })
              }
              className={selectClass}
            >
              <option value="auto">Auto-detect</option>
              {editorOptions.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Default AI Tool
            </label>
            <select
              value={defaultAiTool}
              onChange={(e) =>
                setSetting.mutate({ key: "default_ai_tool", value: e.target.value })
              }
              className={selectClass}
            >
              <option value="auto">Auto-detect</option>
              {aiToolOptions.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <FolderSearch className="h-3.5 w-3.5" />
          Workspace
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Startup Section
              </label>
              <select
                value={startupSection}
                onChange={(e) =>
                  setSetting.mutate({ key: "startup_section", value: e.target.value })
                }
                className={selectClass}
              >
                {STARTUP_SECTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Scan Depth
              </label>
              <select
                value={scanDepth}
                onChange={(e) => {
                  setSetting.mutate({ key: "scan_max_depth", value: e.target.value });
                  queryClient.invalidateQueries({ queryKey: ["projects"] });
                }}
                className={selectClass}
              >
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} levels{n === 5 ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Auto-scan on startup
            </label>
            <button
              onClick={() =>
                setSetting.mutate({
                  key: "auto_scan_on_startup",
                  value: autoScan === "true" ? "false" : "true",
                })
              }
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                autoScan === "true" ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  autoScan === "true" ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Miscellaneous */}
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Cog className="h-3.5 w-3.5" />
          Miscellaneous
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">
            Snarky comments
          </label>
          <button
            onClick={() =>
              setSetting.mutate({
                key: "snarky_comments",
                value: snarkyEnabled === "true" ? "false" : "true",
              })
            }
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              snarkyEnabled === "true" ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                snarkyEnabled === "true" ? "left-[18px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Performance Tab Components
// =============================================================================

const TTL_MIN = 5;
const TTL_MAX = 3600;

function CacheConfigCard() {
  const { data: settings } = useSettings();
  const setSetting = useSetSetting();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = (key: string) => {
    const num = parseInt(editValue, 10);
    if (isNaN(num) || num < TTL_MIN || num > TTL_MAX) {
      setValidationError(`Must be ${TTL_MIN}–${TTL_MAX}s`);
      return;
    }
    setSetting.mutate({ key, value: String(num) });
    setEditingKey(null);
    setValidationError(null);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Timer className="h-4 w-4 text-muted-foreground" />
        Cache TTL (seconds)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TTL_SETTINGS.map(({ key, label, default: def }) => {
          const value = getSettingValue(settings, key, String(def));
          const isEditing = editingKey === key;

          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  {validationError && (
                    <span className="text-[10px] text-destructive">{validationError}</span>
                  )}
                  <input
                    type="number"
                    min={TTL_MIN}
                    max={TTL_MAX}
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      setValidationError(null);
                    }}
                    onBlur={() => handleSave(key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(key);
                      if (e.key === "Escape") {
                        setEditingKey(null);
                        setValidationError(null);
                      }
                    }}
                    autoFocus
                    className={cn(
                      "w-16 rounded border bg-background px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none",
                      validationError ? "border-destructive" : "border-primary"
                    )}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingKey(key);
                    setEditValue(value);
                    setValidationError(null);
                  }}
                  className="rounded px-1.5 py-0.5 font-mono text-xs text-foreground hover:bg-accent"
                >
                  {value}s
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ScannerTableProps {
  stats: NonNullable<ReturnType<typeof useAppStats>["data"]>;
  onClearCaches: () => void;
}

function ScannerTable({ stats, onClearCaches }: ScannerTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Scanner Performance</span>
        </div>
        <button
          onClick={onClearCaches}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Trash2 className="h-3 w-3" />
          Clear All Caches
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Scanner</th>
              <th className="px-4 py-2 font-medium text-right">Last Scan</th>
              <th className="px-4 py-2 font-medium text-right">Hits</th>
              <th className="px-4 py-2 font-medium text-right">Misses</th>
              <th className="px-4 py-2 font-medium text-right">Hit Rate</th>
              <th className="px-4 py-2 font-medium text-right">TTL</th>
              <th className="px-4 py-2 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.scanners.map((scanner) => (
              <tr
                key={scanner.name}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-2 font-medium">{scanner.name}</td>
                <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                  {scanner.last_scan_duration_ms != null
                    ? `${scanner.last_scan_duration_ms}ms`
                    : "-"}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {scanner.cache_hits}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {scanner.cache_misses}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {hitRate(scanner.cache_hits, scanner.cache_misses)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                  {scanner.ttl_secs}s
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      scanner.is_warm
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-500/10 text-zinc-400"
                    )}
                  >
                    {scanner.is_warm ? "warm" : "cold"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PerformanceTabContentProps {
  stats: NonNullable<ReturnType<typeof useAppStats>["data"]>;
  onClearCaches: () => void;
}

function PerformanceTabContent({ stats, onClearCaches }: PerformanceTabContentProps) {
  return (
    <div className="space-y-4">
      <CacheConfigCard />
      <ScannerTable stats={stats} onClearCaches={onClearCaches} />
    </div>
  );
}

// =============================================================================
// System Tab Components
// =============================================================================

function DatabaseCard() {
  const { data: dbPath } = useQuery({
    queryKey: ["db-path"],
    queryFn: async () => {
      const dir = await appDataDir();
      return `${dir}houston.db`;
    },
  });
  const { data: settings } = useSettings();
  const historyLimit = getSettingValue(settings, "scan_history_limit", "50");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Database className="h-4 w-4 text-muted-foreground" />
        Database
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground">Location</span>
          <span className="truncate font-mono text-foreground" title={dbPath}>
            {dbPath || "Loading..."}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">History Limit</span>
          <span className="font-mono text-foreground">{historyLimit} entries/scanner</span>
        </div>
      </div>
    </div>
  );
}

interface SoftwareUpdateCardProps {
  updateStatus: UpdateStatus;
  updateVersion: string;
  updateError: string;
  onCheckUpdate: () => void;
  onInstallUpdate: () => void;
}

function SoftwareUpdateCard({
  updateStatus,
  updateVersion,
  updateError,
  onCheckUpdate,
  onInstallUpdate,
}: SoftwareUpdateCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Download className="h-4 w-4 text-muted-foreground" />
            Software Update
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {updateStatus === "idle" && "Check for new versions of Houston."}
            {updateStatus === "checking" && "Checking for updates..."}
            {updateStatus === "up-to-date" && "Houston is up to date."}
            {updateStatus === "available" &&
              `Version ${updateVersion} is available.`}
            {updateStatus === "downloading" &&
              "Downloading and installing update..."}
            {updateStatus === "error" &&
              (updateError || "Failed to check for updates.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {updateStatus === "checking" || updateStatus === "downloading" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : updateStatus === "up-to-date" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : updateStatus === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : null}
          {updateStatus === "available" ? (
            <button
              onClick={onInstallUpdate}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="h-3 w-3" />
              Install Update
            </button>
          ) : (
            <button
              onClick={onCheckUpdate}
              disabled={
                updateStatus === "checking" || updateStatus === "downloading"
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              Check for Updates
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SystemTabContentProps {
  stats: NonNullable<ReturnType<typeof useAppStats>["data"]>;
  updateStatus: UpdateStatus;
  updateVersion: string;
  updateError: string;
  onCheckUpdate: () => void;
  onInstallUpdate: () => void;
}

function SystemTabContent({
  stats,
  updateStatus,
  updateVersion,
  updateError,
  onCheckUpdate,
  onInstallUpdate,
}: SystemTabContentProps) {
  return (
    <div className="space-y-4">
      {/* App Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-3.5 w-3.5" />
            PID
          </div>
          <div className="font-mono text-lg font-semibold">{stats.pid}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Uptime
          </div>
          <div className="font-mono text-lg font-semibold">
            {formatUptime(stats.uptime_secs)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            Memory
          </div>
          <div className="font-mono text-lg font-semibold">
            {formatBytes(stats.memory_bytes)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DatabaseCard />
        <SoftwareUpdateCard
          updateStatus={updateStatus}
          updateVersion={updateVersion}
          updateError={updateError}
          onCheckUpdate={onCheckUpdate}
          onInstallUpdate={onInstallUpdate}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Main Settings Section
// =============================================================================

export function SettingsSection() {
  const { data: stats, isLoading } = useAppStats();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { status: updateStatus, version: updateVersion, setStatus: setUpdateStatus } = useUpdateStore();
  const [updateError, setUpdateError] = useState<string>("");

  const handleClearCaches = () => {
    queryClient.invalidateQueries();
  };

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    setUpdateError("");
    try {
      const update = await check();
      if (update?.available) {
        setUpdateStatus("available", update.version);
      } else {
        setUpdateStatus("up-to-date");
      }
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e));
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateStatus("downloading", updateVersion);
    try {
      const update = await check();
      if (update?.available) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e));
      setUpdateStatus("error");
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Settings"
          description="App preferences and performance"
        />
        <div className="flex gap-2 border-b border-border pb-2">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              className="h-8 w-24 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InfoCardSkeleton />
          <InfoCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="App preferences and performance"
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "general" && <GeneralTabContent />}
        {activeTab === "performance" && (
          <PerformanceTabContent stats={stats} onClearCaches={handleClearCaches} />
        )}
        {activeTab === "system" && (
          <SystemTabContent
            stats={stats}
            updateStatus={updateStatus}
            updateVersion={updateVersion ?? ""}
            updateError={updateError}
            onCheckUpdate={handleCheckUpdate}
            onInstallUpdate={handleInstallUpdate}
          />
        )}
        {activeTab === "releases" && <ReleaseNotesSection />}
      </div>
    </div>
  );
}
