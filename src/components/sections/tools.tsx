import {
  Sparkles,
  Server,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useState } from "react";
import { useClaudeConfig } from "@/hooks/use-claude-config";
import { useAiTools } from "@/hooks/use-ai-tools";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import type { AiToolInfo } from "@/lib/commands";

function InstalledToolCard({ tool }: { tool: AiToolInfo }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-sm font-medium">{tool.name}</span>
        </div>
        {tool.update_available && (
          <StatusBadge variant="warning">
            <ArrowUpCircle className="h-3 w-3" />
            Update
          </StatusBadge>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-semibold tracking-tight">
          {tool.version ?? "installed"}
        </span>
        {tool.update_available && tool.latest_version && (
          <span className="ml-2 text-xs text-warning">
            {tool.latest_version} available
          </span>
        )}
      </div>
      {tool.binary_path && (
        <div className="mt-2 flex items-center gap-1">
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {tool.binary_path}
          </span>
          <CopyButton value={tool.binary_path} />
        </div>
      )}
    </div>
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

export function ToolsSection() {
  const { data: aiReport, isLoading: aiLoading, isFetching: aiFetching } = useAiTools();
  const { data: claude, isLoading: claudeLoading, isFetching: claudeFetching } = useClaudeConfig();
  const queryClient = useQueryClient();
  const [mcpExpanded, setMcpExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const isLoading = aiLoading || claudeLoading;
  const isFetching = aiFetching || claudeFetching;

  const installedTools = aiReport?.tools.filter((t) => t.installed) ?? [];
  const notDetected = aiReport?.tools.filter((t) => !t.installed) ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI CLI Tools"
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
          {/* Installed tools grid */}
          {installedTools.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {installedTools.map((tool) => (
                <InstalledToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          )}

          {/* Not detected row */}
          <NotDetectedRow tools={notDetected} />

          {/* Claude Config detail card */}
          {claude?.installed && (
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
          )}
        </>
      )}
    </div>
  );
}
