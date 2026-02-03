import {
  Sparkles,
  Server,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  ArrowLeft,
  Wrench,
  Bot,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useClaudeConfig } from "@/hooks/use-claude-config";
import { useAiTools } from "@/hooks/use-ai-tools";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useNavigationStore } from "@/stores/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { AiToolInfo } from "@/lib/commands";

// --- List View Components ---

function ToolTypeBadge({ toolType }: { toolType: AiToolInfo["tool_type"] }) {
  const label =
    toolType === "both" ? "CLI + App" : toolType === "app" ? "App" : "CLI";
  return <StatusBadge variant="neutral">{label}</StatusBadge>;
}

function InstalledToolCard({ tool }: { tool: AiToolInfo }) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const displayVersion = tool.version ?? tool.app_version ?? "installed";
  const displayPath = tool.binary_path ?? tool.app_path;

  return (
    <button
      onClick={() =>
        setDetailContext({
          type: "tool-detail",
          toolName: tool.name,
          label: tool.name,
        })
      }
      className="group rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-sm font-medium">{tool.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {tool.update_available && (
            <StatusBadge variant="warning">
              <ArrowUpCircle className="h-3 w-3" />
              Update
            </StatusBadge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-semibold tracking-tight">
          {displayVersion}
        </span>
        <ToolTypeBadge toolType={tool.tool_type} />
      </div>
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
    </button>
  );
}

function NotDetectedRow({ tools }: { tools: AiToolInfo[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="grid grid-cols-4 gap-3">
      {tools.map((tool) => (
        <div
          key={tool.name}
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 opacity-50"
          title={tool.install_hint}
        >
          <XCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs text-muted-foreground">
            {tool.name}
          </span>
        </div>
      ))}
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
  const notDetected = aiReport?.tools.filter((t) => !t.installed) ?? [];

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
          <NotDetectedRow tools={notDetected} />
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
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const queryClient = useQueryClient();
  const [mcpExpanded, setMcpExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const tool = aiReport?.tools.find((t) => t.name === toolName);

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

          {/* Update info */}
          {tool.update_available && tool.latest_version && (
            <div>
              <span className="text-xs text-muted-foreground">
                Latest Version
              </span>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs">{tool.latest_version}</p>
                <StatusBadge variant="warning">
                  <ArrowUpCircle className="h-3 w-3" />
                  Update available
                </StatusBadge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MCP Servers card */}
      {isClaudeCode && claude?.installed && !claudeLoading ? (
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
                  MCP Servers
                </span>
                <p className="font-mono text-xs">
                  {claude.mcp_servers.length}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Projects
                </span>
                <p className="font-mono text-xs">{claude.project_count}</p>
              </div>
            </div>

            {/* MCP Servers accordion */}
            {claude.has_mcp_servers && (
              <div className="rounded-md border border-border">
                <button
                  onClick={() => setMcpExpanded(!mcpExpanded)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/30"
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    MCP Servers ({claude.mcp_servers.length})
                  </div>
                  {mcpExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {mcpExpanded && (
                  <div className="border-t border-border">
                    {claude.mcp_servers.map((server) => (
                      <div
                        key={server.name}
                        className="border-b border-border px-3 py-2 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {server.name}
                          </span>
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
            )}

            {/* Settings accordion */}
            {claude.has_settings && claude.settings_summary.length > 0 && (
              <div className="mt-2 rounded-md border border-border">
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
                    {claude.settings_summary.map((setting) => (
                      <p
                        key={setting}
                        className="py-0.5 font-mono text-xs text-muted-foreground"
                      >
                        {setting}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : !isClaudeCode ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">MCP Servers</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            No MCP configuration detected for {tool.name}.
          </p>
        </div>
      ) : null}

      {/* Placeholder cards for future features */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 p-6 opacity-50">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Agents
          </span>
          <span className="text-[10px] text-muted-foreground">
            Coming soon
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 p-6 opacity-50">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Skills
          </span>
          <span className="text-[10px] text-muted-foreground">
            Coming soon
          </span>
        </div>
      </div>
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
