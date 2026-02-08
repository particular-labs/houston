import { useState, useMemo } from "react";
import {
  Container,
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  Terminal,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Database,
  Zap,
  Inbox,
  Globe,
  Activity,
  Box,
  LayoutDashboard,
  HardDrive,
  Lock,
  Network,
  Brain,
  Image,
  Mail,
  BookOpen,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useDockerStatus, useContainerActions, useContainerLogs } from "@/hooks/use-docker";
import { SectionHeader } from "@/components/shared/section-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { DetailViewSkeleton, ContainerCardSkeleton } from "@/components/shared/skeleton";
import { useNavigationStore, type DetailContext } from "@/stores/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ContainerInfo, ComposeProject } from "@/lib/commands";

// Icon mapping for container categories
const categoryIcons: Record<string, typeof Database> = {
  database: Database,
  cache: Zap,
  queue: Inbox,
  proxy: Globe,
  monitoring: Activity,
  webapp: LayoutDashboard,
  service: Box,
  unknown: Box,
};

// Get icon component from icon name
function getIconFromName(iconName: string) {
  const icons: Record<string, typeof Database> = {
    database: Database,
    zap: Zap,
    inbox: Inbox,
    globe: Globe,
    activity: Activity,
    "layout-dashboard": LayoutDashboard,
    box: Box,
    "hard-drive": HardDrive,
    lock: Lock,
    network: Network,
    brain: Brain,
    image: Image,
    mail: Mail,
    "book-open": BookOpen,
  };
  return icons[iconName] || Box;
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Status badge variant
function getStatusVariant(status: string): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "running":
      return "success";
    case "paused":
      return "warning";
    case "exited":
    case "dead":
      return "error";
    default:
      return "neutral";
  }
}

// HTTP-likely ports that should get clickable links
const HTTP_PORTS = new Set([80, 443, 3000, 3001, 4000, 5000, 5173, 8000, 8080, 8443, 8888, 9000]);
function isHttpLikelyPort(containerPort: number): boolean {
  return HTTP_PORTS.has(containerPort);
}

// --- Container Card ---

function ContainerCard({ container }: { container: ContainerInfo }) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const { startContainer, stopContainer, restartContainer } = useContainerActions();
  const Icon = getIconFromName(container.icon);
  const isRunning = container.status === "running";
  const isPending = startContainer.isPending || stopContainer.isPending || restartContainer.isPending;

  const handleAction = (action: "start" | "stop" | "restart") => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action === "start") startContainer.mutate(container.id);
    else if (action === "stop") stopContainer.mutate(container.id);
    else restartContainer.mutate(container.id);
  };

  const primaryPort = container.ports.find((p) => p.host_port);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() =>
        setDetailContext({
          type: "container-detail",
          containerId: container.id,
          containerName: container.name,
        })
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setDetailContext({
            type: "container-detail",
            containerId: container.id,
            containerName: container.name,
          });
        }
      }}
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{container.name}</span>
              <StatusBadge variant={getStatusVariant(container.status)}>
                {container.status}
              </StatusBadge>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {container.image}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {container.state_detail}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isRunning ? (
            <>
              <button
                onClick={handleAction("stop")}
                disabled={isPending}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Stop"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={handleAction("restart")}
                disabled={isPending}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Restart"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </>
          ) : (
            <button
              onClick={handleAction("start")}
              disabled={isPending}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Start"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Play className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {isRunning && (
        <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>CPU: {container.cpu_percent.toFixed(1)}%</span>
          <span>
            Mem: {formatBytes(container.memory_bytes)}
            {container.memory_limit > 0 && ` / ${formatBytes(container.memory_limit)}`}
          </span>
          {primaryPort && primaryPort.host_port && (
            isHttpLikelyPort(primaryPort.container_port) ? (
              <a
                href={`http://localhost:${primaryPort.host_port}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                :{primaryPort.host_port}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : (
              <span>:{primaryPort.host_port}</span>
            )
          )}
        </div>
      )}
    </div>
  );
}

// --- Compose Project Group ---

function ComposeProjectGroup({
  project,
  containers,
  defaultExpanded = true,
}: {
  project: ComposeProject;
  containers: ContainerInfo[];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const projectContainers = containers.filter((c) => project.containers.includes(c.id));

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span>{project.name}</span>
        <span className="text-xs text-muted-foreground">
          ({project.running_count}/{project.container_count} running)
        </span>
      </button>

      {expanded && (
        <div className="grid gap-3 pl-6 sm:grid-cols-2 lg:grid-cols-3">
          {projectContainers.map((container) => (
            <ContainerCard key={container.id} container={container} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Container Detail View ---

function ContainerDetailView({ containerId }: { containerId: string }) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const { data: dockerStatus, isLoading } = useDockerStatus();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useContainerLogs(containerId);
  const { startContainer, stopContainer, restartContainer } = useContainerActions();
  const queryClient = useQueryClient();

  const container = dockerStatus?.containers.find((c) => c.id === containerId);
  const isPending = startContainer.isPending || stopContainer.isPending || restartContainer.isPending;

  if (isLoading) return <DetailViewSkeleton cards={3} showLogs />;
  if (!container) {
    return (
      <EmptyState
        icon={Container}
        title="Container not found"
        description="This container may have been removed"
      />
    );
  }

  const Icon = getIconFromName(container.icon);
  const isRunning = container.status === "running";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => setDetailContext(null)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Containers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{container.name}</h2>
              <StatusBadge variant={getStatusVariant(container.status)}>
                {container.status}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">{container.image}</p>
            <p className="text-xs text-muted-foreground mt-1">{container.state_detail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <button
                onClick={() => stopContainer.mutate(container.id)}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 transition-colors"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                Stop
              </button>
              <button
                onClick={() => restartContainer.mutate(container.id)}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </button>
            </>
          ) : (
            <button
              onClick={() => startContainer.mutate(container.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start
            </button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Container Info */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Container Info</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{container.id.slice(0, 12)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Service</dt>
              <dd>{container.service_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="capitalize">{container.category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-xs">{container.created}</dd>
            </div>
          </dl>
        </div>

        {/* Resources */}
        {isRunning && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Resources</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">CPU</dt>
                <dd>{container.cpu_percent.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Memory</dt>
                <dd>
                  {formatBytes(container.memory_bytes)}
                  {container.memory_limit > 0 && ` / ${formatBytes(container.memory_limit)}`}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Ports */}
        {container.ports.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Ports</h3>
            <div className="space-y-1.5">
              {container.ports.map((port, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {port.container_port}/{port.protocol}
                  </span>
                  {port.host_port ? (
                    isHttpLikelyPort(port.container_port) ? (
                      <a
                        href={`http://localhost:${port.host_port}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        :{port.host_port}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-xs">:{port.host_port}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">not mapped</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compose Info */}
        {container.compose_project && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Compose</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Project</dt>
                <dd>{container.compose_project}</dd>
              </div>
              {container.compose_service && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service</dt>
                  <dd>{container.compose_service}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Logs */}
      {isRunning && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Logs</h3>
            </div>
            <button
              onClick={() => refetchLogs()}
              disabled={logsLoading}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${logsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="max-h-64 overflow-auto p-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading logs...
              </div>
            ) : logs && logs.length > 0 ? (
              <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                {logs.join("\n")}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No logs available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Docker Unavailable State ---

function DockerUnavailable() {
  return (
    <EmptyState
      icon={Container}
      title="Docker not available"
      description="Docker daemon is not running or not installed"
      action={
        <a
          href="https://www.docker.com/get-started/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get Docker
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      }
    />
  );
}

// --- Main Section ---

export function ContainersSection() {
  const { data: dockerStatus, isLoading, isFetching, isError, refetch } = useDockerStatus();
  const detailContext = useNavigationStore((s) => s.detailContext);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "running" | "stopped">("all");

  // Filter containers - must be called before any conditional returns (Rules of Hooks)
  const filteredContainers = useMemo(() => {
    if (!dockerStatus?.containers) return [];
    let containers = dockerStatus.containers;

    // Apply status filter
    if (filter === "running") {
      containers = containers.filter((c) => c.status === "running");
    } else if (filter === "stopped") {
      containers = containers.filter((c) => c.status !== "running");
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      containers = containers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.image.toLowerCase().includes(searchLower) ||
          c.service_name.toLowerCase().includes(searchLower)
      );
    }

    return containers;
  }, [dockerStatus?.containers, filter, search]);

  // Get standalone containers (not in a compose project)
  const standaloneContainers = useMemo(
    () => filteredContainers.filter((c) => !c.compose_project),
    [filteredContainers]
  );

  // Filter compose projects that have matching containers
  const filteredProjects = useMemo(
    () =>
      dockerStatus?.compose_projects?.filter((project) =>
        filteredContainers.some((c) => project.containers.includes(c.id))
      ) ?? [],
    [dockerStatus?.compose_projects, filteredContainers]
  );

  const hasNoResults = filteredContainers.length === 0 && (search || filter !== "all");

  // Handle detail view
  if (detailContext?.type === "container-detail") {
    return <ContainerDetailView containerId={detailContext.containerId} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Containers"
          description="Docker containers and Compose projects"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ContainerCardSkeleton />
          <ContainerCardSkeleton />
          <ContainerCardSkeleton />
          <ContainerCardSkeleton />
          <ContainerCardSkeleton />
          <ContainerCardSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Containers"
          description="Docker containers and Compose projects"
        />
        <ErrorBanner message="Failed to scan Docker containers" onRetry={() => refetch()} />
      </div>
    );
  }

  if (!dockerStatus?.available) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Containers"
          description="Docker containers and Compose projects"
        />
        <DockerUnavailable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Containers"
        description={
          dockerStatus.version
            ? `Docker ${dockerStatus.version} - ${dockerStatus.total_running} running, ${dockerStatus.total_stopped} stopped`
            : "Docker containers and Compose projects"
        }
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["docker-status"] })}
        isRefreshing={isFetching}
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
          {(["all", "running", "stopped"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                (
                {f === "all"
                  ? dockerStatus.containers.length
                  : f === "running"
                    ? dockerStatus.total_running
                    : dockerStatus.total_stopped}
                )
              </span>
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search containers..."
          className="w-64"
        />
      </div>

      {/* Content */}
      {dockerStatus.containers.length === 0 ? (
        <EmptyState
          icon={Container}
          title="No containers"
          description="No Docker containers found. Start some containers to see them here."
        />
      ) : hasNoResults ? (
        <EmptyState
          icon={Container}
          title="No matching containers"
          description="Try adjusting your search or filter"
        />
      ) : (
        <div className="space-y-6">
          {/* Compose Projects */}
          {filteredProjects.map((project) => (
            <ComposeProjectGroup
              key={project.name}
              project={project}
              containers={filteredContainers}
            />
          ))}

          {/* Standalone Containers */}
          {standaloneContainers.length > 0 && (
            <div className="space-y-2">
              {filteredProjects.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground">
                  Standalone Containers
                </h3>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {standaloneContainers.map((container) => (
                  <ContainerCard key={container.id} container={container} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
