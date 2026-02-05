import {
  Monitor,
  Route,
  Code2,
  GitBranch,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { useSystemInfo } from "@/hooks/use-system-info";
import { usePathEntries } from "@/hooks/use-path-entries";
import { useLanguages } from "@/hooks/use-languages";
import { useAllGitStatuses } from "@/hooks/use-git-status";
import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import { StatusDot } from "@/components/shared/status-dot";
import { CardSkeleton } from "@/components/shared/skeleton";
import { useNavigationStore } from "@/stores/navigation";

function MetricCard({
  icon: Icon,
  label,
  value,
  status,
  detail,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  status: "success" | "warning" | "error" | "info";
  detail?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
      </div>
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
    </button>
  );
}

export function Dashboard() {
  const { data: system, isLoading: systemLoading } = useSystemInfo();
  const { data: paths, isLoading: pathsLoading } = usePathEntries();
  const { data: languages, isLoading: langsLoading } = useLanguages();
  const { data: gitStatuses } = useAllGitStatuses();
  // Read diagnostics from cache only -- don't trigger the scan from dashboard
  const { data: diagnosticsReport } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: commands.getDiagnostics,
    staleTime: 120_000,
    enabled: false,
  });
  const setSection = useNavigationStore((s) => s.setActiveSection);

  const pathWarnings =
    paths?.filter((p) => !p.exists || p.is_duplicate).length ?? 0;
  const installedLangs = languages?.filter((l) => l.installed).length ?? 0;
  const dirtyRepos =
    gitStatuses?.filter((g) => g.is_dirty).length ?? 0;
  const diagnosticCount = diagnosticsReport?.items.length ?? 0;
  const hasErrors = diagnosticsReport?.items.some((i) => i.severity === "error") ?? false;
  const hasWarnings = diagnosticsReport?.items.some((i) => i.severity === "warning") ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Overview of your development environment
        </p>
      </div>

      {/* Architecture mismatch warning */}
      {system?.architecture_mismatch && (
        <div className="rounded-lg border border-warning/25 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" />
            Running under Rosetta 2
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You're running the x86_64 build on Apple Silicon via Rosetta 2.
            Download the Apple Silicon (aarch64) build for native speed.
          </p>
        </div>
      )}

      {/* Metric cards — each renders independently */}
      <div className="grid grid-cols-5 gap-4">
        {systemLoading ? (
          <CardSkeleton />
        ) : (
          <MetricCard
            icon={Monitor}
            label="System"
            value={system ? "OK" : "..."}
            status="success"
            detail={
              system
                ? `${system.os_name} ${system.os_version} (${system.architecture})`
                : undefined
            }
            onClick={() => setSection("system")}
          />
        )}
        {pathsLoading ? (
          <CardSkeleton />
        ) : (
          <MetricCard
            icon={Route}
            label="PATH"
            value={pathWarnings}
            status={pathWarnings > 0 ? "warning" : "success"}
            detail={
              pathWarnings > 0
                ? `${pathWarnings} issue${pathWarnings > 1 ? "s" : ""} found`
                : `${paths?.length ?? 0} entries, all valid`
            }
            onClick={() => setSection("path")}
          />
        )}
        {langsLoading ? (
          <CardSkeleton />
        ) : (
          <MetricCard
            icon={Code2}
            label="Languages"
            value={installedLangs}
            status="info"
            detail={`${installedLangs} runtime${installedLangs !== 1 ? "s" : ""} detected`}
            onClick={() => setSection("languages")}
          />
        )}
        <MetricCard
          icon={GitBranch}
          label="Dirty Repos"
          value={dirtyRepos}
          status={dirtyRepos > 0 ? "warning" : "success"}
          detail={
            dirtyRepos > 0
              ? `${dirtyRepos} repo${dirtyRepos !== 1 ? "s" : ""} with uncommitted changes`
              : "All repos clean"
          }
          onClick={() => setSection("workspaces")}
        />
        <MetricCard
          icon={Activity}
          label="Health"
          value={diagnosticCount}
          status={hasErrors ? "error" : hasWarnings ? "warning" : "success"}
          detail={
            diagnosticCount === 0
              ? "All systems healthy"
              : `${diagnosticCount} issue${diagnosticCount !== 1 ? "s" : ""} found`
          }
          onClick={() => setSection("system")}
        />
      </div>

      {/* System overview + Languages */}
      <div className="grid grid-cols-2 gap-4">
        {/* System card */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            System Overview
          </h3>
          {systemLoading ? (
            <CardSkeleton />
          ) : system ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS</span>
                <span className="font-mono text-xs">
                  {system.os_name} {system.os_version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kernel</span>
                <span className="font-mono text-xs">
                  {system.kernel_version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Architecture</span>
                <span className="font-mono text-xs">
                  {system.architecture}
                  {system.architecture_mismatch && " (Rosetta 2)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shell</span>
                <span className="font-mono text-xs">{system.shell}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPU</span>
                <span className="font-mono text-xs">{system.cpu_brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono text-xs">{system.memory_gb}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Languages grid card */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Installed Languages
          </h3>
          {langsLoading ? (
            <CardSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {languages
                ?.filter((l) => l.installed)
                .map((lang) => (
                  <div
                    key={lang.name}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5"
                  >
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span className="text-xs font-medium">{lang.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {lang.version}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* PATH Health */}
      {paths && pathWarnings > 0 && (
        <div className="rounded-lg border border-warning/25 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" />
            PATH Issues
          </div>
          <div className="mt-2 space-y-1">
            {paths
              .filter((p) => !p.exists || p.is_duplicate)
              .slice(0, 5)
              .map((p) => (
                <div
                  key={`${p.index}-${p.path}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <StatusDot
                    status={!p.exists ? "error" : "warning"}
                  />
                  <span className="font-mono text-muted-foreground">
                    {p.path}
                  </span>
                  <span className="text-muted-foreground">
                    {!p.exists ? "(missing)" : "(duplicate)"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
