import { Settings, Trash2, Clock, HardDrive, Hash } from "lucide-react";
import { useAppStats } from "@/hooks/use-app-stats";
import { SectionHeader } from "@/components/shared/section-header";
import { CardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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

export function SettingsSection() {
  const { data: stats, isLoading } = useAppStats();
  const queryClient = useQueryClient();

  const handleClearCaches = () => {
    queryClient.invalidateQueries();
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Settings"
          description="App performance and cache management"
        />
        <div className="grid grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="App performance and cache management"
      />

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

      {/* Scanner Performance Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Scanner Performance</span>
          </div>
          <button
            onClick={handleClearCaches}
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
                <th className="px-4 py-2 font-medium text-right">
                  Last Scan
                </th>
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
                          : "bg-zinc-500/10 text-zinc-400",
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
    </div>
  );
}
