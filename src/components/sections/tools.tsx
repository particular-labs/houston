import {
  Sparkles,
  Server,
  Settings,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useClaudeConfig } from "@/hooks/use-claude-config";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export function ToolsSection() {
  const { data: claude, isLoading, isFetching } = useClaudeConfig();
  const queryClient = useQueryClient();
  const [mcpExpanded, setMcpExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="CLI Tools & Config"
        description="Configuration for developer CLI tools"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["claude-config"] })}
        isRefreshing={isFetching}
      />

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* Claude Code */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Claude Code</h3>
              </div>
              {claude?.installed ? (
                <StatusBadge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Installed
                </StatusBadge>
              ) : (
                <StatusBadge variant="error">
                  <XCircle className="h-3 w-3" />
                  Not Found
                </StatusBadge>
              )}
            </div>

            {claude?.installed && (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
