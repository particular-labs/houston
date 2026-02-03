import { useMemo } from "react";
import {
  FolderPlus,
  FolderX,
  GitBranch,
  GitCommit,
  ArrowUp,
  ArrowDown,
  Terminal,
  Code2,
  Sparkles,
  FolderOpen,
  Folder,
} from "lucide-react";
import {
  useProjects,
  useAddWorkspace,
  useRemoveWorkspace,
  useWorkspacePaths,
} from "@/hooks/use-workspaces";
import { useGitStatus } from "@/hooks/use-git-status";
import { commands, type ProjectInfo } from "@/lib/commands";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { CardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";

function ProjectCard({ project }: { project: ProjectInfo }) {
  const { data: git } = useGitStatus(project.has_git ? project.path : "");

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{project.name}</h3>
          {project.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="ml-2 flex items-center gap-1">
          <StatusBadge variant="info">{project.project_type}</StatusBadge>
        </div>
      </div>

      {/* Framework & Package Manager */}
      <div className="mt-2 flex items-center gap-2">
        {project.framework && (
          <StatusBadge variant="neutral">{project.framework}</StatusBadge>
        )}
        <StatusBadge variant="neutral">{project.package_manager}</StatusBadge>
      </div>

      {/* Git status */}
      {git && (
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            <span className="font-mono">{git.branch}</span>
          </div>
          {git.is_dirty && <StatusDot status="warning" />}
          {git.modified_count > 0 && (
            <span className="text-warning">{git.modified_count}M</span>
          )}
          {git.untracked_count > 0 && (
            <span className="text-muted-foreground">
              {git.untracked_count}U
            </span>
          )}
          {git.staged_count > 0 && (
            <span className="text-success">{git.staged_count}S</span>
          )}
          {git.ahead > 0 && (
            <span className="flex items-center gap-0.5 text-info">
              <ArrowUp className="h-3 w-3" />
              {git.ahead}
            </span>
          )}
          {git.behind > 0 && (
            <span className="flex items-center gap-0.5 text-warning">
              <ArrowDown className="h-3 w-3" />
              {git.behind}
            </span>
          )}
        </div>
      )}
      {git && git.last_commit_message && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <GitCommit className="h-3 w-3 shrink-0" />
          <span className="truncate">{git.last_commit_message}</span>
          <span className="shrink-0 text-[10px]">{git.last_commit_date}</span>
        </div>
      )}

      {/* Path + actions */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
        <div className="flex items-center gap-1">
          <span className="max-w-[200px] truncate font-mono text-[10px] text-muted-foreground">
            {project.path}
          </span>
          <CopyButton value={project.path} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => commands.openInTerminal(project.path)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Open in Terminal"
          >
            <Terminal className="h-3 w-3" />
          </button>
          <button
            onClick={() => commands.openInEditor(project.path)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Open in Editor"
          >
            <Code2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => commands.openClaudeCode(project.path)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Open Claude Code"
          >
            <Sparkles className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProjectGroup {
  name: string;
  projects: ProjectInfo[];
}

function useGroupedProjects(projects: ProjectInfo[] | undefined): ProjectGroup[] {
  return useMemo(() => {
    if (!projects) return [];

    const groupMap = new Map<string, ProjectInfo[]>();

    for (const project of projects) {
      const key = project.group || "";
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(project);
    }

    const groups: ProjectGroup[] = [];

    // Top-level projects first (empty group)
    const topLevel = groupMap.get("");
    if (topLevel && topLevel.length > 0) {
      groups.push({ name: "", projects: topLevel });
    }

    // Then named groups, sorted alphabetically
    const sortedKeys = Array.from(groupMap.keys())
      .filter((k) => k !== "")
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    for (const key of sortedKeys) {
      groups.push({ name: key, projects: groupMap.get(key)! });
    }

    return groups;
  }, [projects]);
}

export function WorkspacesSection() {
  const { data: workspacePaths } = useWorkspacePaths();
  const { data: projects, isLoading, isFetching } = useProjects();
  const addWorkspace = useAddWorkspace();
  const removeWorkspace = useRemoveWorkspace();
  const queryClient = useQueryClient();
  const groups = useGroupedProjects(projects);

  const handleAddWorkspace = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Workspace Directory",
    });
    if (selected) {
      await addWorkspace.mutateAsync(selected as string);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Projects"
        description={`${projects?.length ?? 0} project${(projects?.length ?? 0) !== 1 ? "s" : ""} across ${workspacePaths?.length ?? 0} workspace${(workspacePaths?.length ?? 0) !== 1 ? "s" : ""}`}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["all-git-statuses"] });
        }}
        isRefreshing={isFetching}
        actions={
          <button
            onClick={handleAddWorkspace}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Add Workspace
          </button>
        }
      />

      {/* Workspace paths */}
      {workspacePaths && workspacePaths.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workspacePaths.map((path) => (
            <div
              key={path}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs"
            >
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-muted-foreground">{path}</span>
              <button
                onClick={() => removeWorkspace.mutate(path)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                title="Remove workspace"
              >
                <FolderX className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Project groups */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.name || "__root__"}>
              {group.name ? (
                <div className="mb-3 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{group.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {group.projects.length} project
                    {group.projects.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : groups.length > 1 ? (
                <div className="mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Projects
                  </h3>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                {group.projects.map((project) => (
                  <ProjectCard key={project.path} project={project} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderPlus}
          title="No workspaces added"
          description="Add a workspace directory to scan for projects"
          action={
            <button
              onClick={handleAddWorkspace}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              Add Workspace
            </button>
          }
        />
      )}
    </div>
  );
}
