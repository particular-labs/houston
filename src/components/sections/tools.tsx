import {
  Sparkles,
  Server,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ArrowUpCircle,
  ArrowLeft,
  Wrench,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useClaudeConfig } from "@/hooks/use-claude-config";
import { useAiTools } from "@/hooks/use-ai-tools";
import { useToolMcpServers } from "@/hooks/use-tool-mcp-servers";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useNavigationStore } from "@/stores/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import type { AiToolInfo, FixResult, SettingEntry } from "@/lib/commands";

// --- Shared Components ---

function ToolTypeBadge({ toolType }: { toolType: AiToolInfo["tool_type"] }) {
  const label =
    toolType === "both" ? "CLI + App" : toolType === "app" ? "App" : "CLI";
  return <StatusBadge variant="neutral">{label}</StatusBadge>;
}

function SettingEntryRow({ entry }: { entry: SettingEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isExpandable =
    entry.value_type === "array" || entry.value_type === "object";

  const renderValue = () => {
    switch (entry.value_type) {
      case "boolean":
        return (
          <span
            className={`inline-block h-2 w-2 rounded-full ${entry.value === "true" ? "bg-success" : "bg-destructive"}`}
          />
        );
      case "array": {
        let count = "?";
        try {
          const parsed = JSON.parse(entry.value);
          if (Array.isArray(parsed)) count = String(parsed.length);
        } catch {
          /* ignore */
        }
        return (
          <span className="text-muted-foreground">[{count} items]</span>
        );
      }
      case "object": {
        let count = "?";
        try {
          count = String(Object.keys(JSON.parse(entry.value)).length);
        } catch {
          /* ignore */
        }
        return (
          <span className="text-muted-foreground">
            {"{"}
            {count} keys
            {"}"}
          </span>
        );
      }
      default:
        return (
          <span className="font-mono text-muted-foreground">
            {entry.value}
          </span>
        );
    }
  };

  return (
    <div className="py-1">
      <div
        className={`flex items-center justify-between text-xs ${isExpandable ? "cursor-pointer" : ""}`}
        onClick={isExpandable ? () => setExpanded(!expanded) : undefined}
      >
        <span className="font-medium">{entry.key}</span>
        <div className="flex items-center gap-1">
          {renderValue()}
          {isExpandable &&
            (expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            ))}
        </div>
      </div>
      {isExpandable && expanded && (
        <pre className="mt-1 overflow-x-auto rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
          {entry.value}
        </pre>
      )}
    </div>
  );
}

// --- List View Components ---

function InstalledToolCard({ tool }: { tool: AiToolInfo }) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const displayVersion = tool.version ?? tool.app_version ?? "installed";
  const displayPath = tool.binary_path ?? tool.app_path;

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const result = await commands.updateAiTool(tool.name);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["ai-tools"] });
      }
    } catch {
      /* ignore */
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() =>
        setDetailContext({
          type: "tool-detail",
          toolName: tool.name,
          label: tool.name,
        })
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setDetailContext({
            type: "tool-detail",
            toolName: tool.name,
            label: tool.name,
          });
        }
      }}
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-sm font-medium">{tool.name}</span>
          {tool.has_ai && (
            <span className="flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tool.update_available && !isUpdating && (
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning transition-colors hover:bg-warning/20"
            >
              <ArrowUpCircle className="h-3 w-3" />
              Update
            </button>
          )}
          {isUpdating && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="max-w-[180px] truncate text-2xl font-semibold tracking-tight"
          title={displayVersion}
        >
          {displayVersion}
        </span>
        <ToolTypeBadge toolType={tool.tool_type} />
      </div>
      {tool.has_ai && tool.ai_features.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tool.ai_features.map((feature) => (
            <span
              key={feature}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      )}
      {tool.update_available && tool.latest_version && (
        <span className="mt-1 block text-xs text-warning">
          {tool.latest_version} available
        </span>
      )}
      {displayPath && (
        <div className="mt-2">
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {displayPath}
          </span>
        </div>
      )}
    </div>
  );
}


function ToolsListView() {
  const {
    data: aiReport,
    isLoading,
    isFetching,
  } = useAiTools();
  const queryClient = useQueryClient();

  const installedTools = aiReport?.tools.filter((t) => t.installed) ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Tools"
        description={
          aiReport
            ? `${installedTools.length} tool${installedTools.length !== 1 ? "s" : ""} detected`
            : "Scanning for AI tools..."
        }
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ["ai-tools"] });
          queryClient.invalidateQueries({ queryKey: ["claude-config"] });
        }}
        isRefreshing={isFetching}
      />

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {installedTools.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {installedTools.map((tool) => (
                <InstalledToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          )}
          {/* Not-detected tools hidden — only show installed */}
        </>
      )}
    </div>
  );
}

// --- Detail View Components ---

function ToolDetailView({ toolName }: { toolName: string }) {
  const { data: aiReport, isFetching } = useAiTools();
  const {
    data: claude,
    isLoading: claudeLoading,
  } = useClaudeConfig();
  const { data: mcpServers, isLoading: mcpLoading } = useToolMcpServers(toolName);
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const queryClient = useQueryClient();
  const [mcpExpanded, setMcpExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<FixResult | null>(null);

  const tool = aiReport?.tools.find((t) => t.name === toolName);

  const handleUpdate = async () => {
    if (!tool) return;
    setIsUpdating(true);
    setUpdateResult(null);
    try {
      const result = await commands.updateAiTool(tool.name);
      setUpdateResult(result);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["ai-tools"] });
      }
    } catch {
      setUpdateResult({
        success: false,
        message: "Failed to run update",
        output: null,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!tool) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setDetailContext(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Tools
        </button>
        <EmptyState
          icon={Wrench}
          title="Tool not found"
          description={`"${toolName}" was not found in the scan results.`}
        />
      </div>
    );
  }

  const isClaudeCode = tool.name === "Claude Code";
  const typeLabel =
    tool.tool_type === "both"
      ? "CLI + Desktop App"
      : tool.tool_type === "app"
        ? "Desktop App"
        : "CLI Tool";

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="space-y-4">
        <button
          onClick={() => setDetailContext(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Tools
        </button>
        <SectionHeader
          title={tool.name}
          description={typeLabel}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["ai-tools"] });
            queryClient.invalidateQueries({ queryKey: ["claude-config"] });
            queryClient.invalidateQueries({ queryKey: ["tool-mcp-servers", toolName] });
          }}
          isRefreshing={isFetching}
        />
      </div>

      {/* Info card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {/* CLI version + path */}
          {(tool.tool_type === "cli" || tool.tool_type === "both") && (
            <>
              <div>
                <span className="text-xs text-muted-foreground">
                  CLI Version
                </span>
                <p className="font-mono text-xs">
                  {tool.version ?? "not found"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  CLI Path
                </span>
                <div className="flex items-center gap-1">
                  <span className="truncate font-mono text-xs">
                    {tool.binary_path ?? "not found"}
                  </span>
                  {tool.binary_path && (
                    <CopyButton value={tool.binary_path} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* App version + path */}
          {(tool.tool_type === "app" || tool.tool_type === "both") && (
            <>
              <div>
                <span className="text-xs text-muted-foreground">
                  App Version
                </span>
                <p className="font-mono text-xs">
                  {tool.app_installed
                    ? tool.app_version ?? "installed"
                    : "not found"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  App Path
                </span>
                <div className="flex items-center gap-1">
                  <span className="truncate font-mono text-xs">
                    {tool.app_path ?? "not found"}
                  </span>
                  {tool.app_path && <CopyButton value={tool.app_path} />}
                </div>
              </div>
            </>
          )}

          {/* Install method */}
          <div>
            <span className="text-xs text-muted-foreground">
              Install Method
            </span>
            <p className="font-mono text-xs">{tool.install_method}</p>
          </div>

          {/* Config directory */}
          {tool.config_dir && (
            <div>
              <span className="text-xs text-muted-foreground">
                Config Directory
              </span>
              <div className="flex items-center gap-1">
                <span className="truncate font-mono text-xs">
                  {tool.config_dir}
                </span>
                <CopyButton value={tool.config_dir} />
              </div>
            </div>
          )}

          {/* Update info with action button */}
          {tool.update_available && tool.latest_version && (
            <div className="col-span-full">
              <span className="text-xs text-muted-foreground">
                Latest Version
              </span>
              <div className="mt-1 flex items-center gap-3">
                <p className="font-mono text-xs">{tool.latest_version}</p>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ArrowUpCircle className="h-3 w-3" />
                  )}
                  Update to {tool.latest_version}
                </button>
              </div>
              {updateResult && (
                <div
                  className={`mt-2 rounded-md p-2 text-xs ${updateResult.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                >
                  {updateResult.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Features tags */}
        {tool.has_ai && tool.ai_features.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">AI Features</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {tool.ai_features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generic MCP Servers accordion — works for any tool */}
      {mcpLoading ? (
        <CardSkeleton />
      ) : mcpServers && mcpServers.length > 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <button
            onClick={() => setMcpExpanded(!mcpExpanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/30"
          >
            <div className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-muted-foreground" />
              MCP Servers ({mcpServers.length})
            </div>
            {mcpExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {mcpExpanded && (
            <div className="border-t border-border">
              {mcpServers.map((server) => (
                <div
                  key={server.name}
                  className="border-b border-border px-4 py-2 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{server.name}</span>
                    <CopyButton
                      value={`${server.command} ${server.args.join(" ")}`}
                    />
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {server.command} {server.args.join(" ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Claude Code Config card (config path, projects, settings — Claude-only) */}
      {isClaudeCode && claude?.installed && !claudeLoading && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Claude Code Config</h3>
            </div>
            <StatusBadge variant="success">
              <CheckCircle2 className="h-3 w-3" />
              Configured
            </StatusBadge>
          </div>

          <div className="p-4">
            {/* Overview */}
            <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">
                  Config Path
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">
                    {claude.config_path}
                  </span>
                  <CopyButton value={claude.config_path} />
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Projects
                </span>
                <p className="font-mono text-xs">{claude.project_count}</p>
              </div>
            </div>

            {/* Settings accordion */}
            {claude.has_settings && claude.settings.length > 0 && (
              <div className="rounded-md border border-border">
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/30"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    Settings
                  </div>
                  {settingsExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {settingsExpanded && (
                  <div className="border-t border-border px-3 py-2">
                    {claude.settings.map((entry) => (
                      <SettingEntryRow key={entry.key} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Router ---

export function ToolsSection() {
  const detailContext = useNavigationStore((s) => s.detailContext);
  if (detailContext?.type === "tool-detail") {
    return <ToolDetailView toolName={detailContext.toolName} />;
  }
  return <ToolsListView />;
}
