import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderPlus,
  FolderX,
  GitBranch,
  GitCommit,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowUpDown,
  Terminal,
  Code2,
  Sparkles,
  FolderOpen,
  Folder,
  Package,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Brain,
  AlertTriangle,
} from "lucide-react";
import {
  useProjects,
  useAddWorkspace,
  useRemoveWorkspace,
  useWorkspacePaths,
} from "@/hooks/use-workspaces";
import { useGitStatus, useAllGitStatuses } from "@/hooks/use-git-status";
import { useDevServers } from "@/hooks/use-dev-servers";
import { useSetting, useSetSetting } from "@/hooks/use-settings";
import { commands, type ProjectInfo } from "@/lib/commands";
import { useNavigationStore } from "@/stores/navigation";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCardSkeleton } from "@/components/shared/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { useCollapsibleSections } from "@/hooks/use-collapsible-sections";
import { useVersionMismatches } from "@/hooks/use-version-mismatches";
import { groupBySubfolder } from "@/lib/group-by-subfolder";
import { ProjectDetail } from "./project-detail";

function ProjectCard({ project }: { project: ProjectInfo }) {
  const { data: git } = useGitStatus(project.has_git ? project.path : "");
  const { data: devServerReport } = useDevServers();
  const hasDevServer = devServerReport?.servers.some(
    (s) => s.project_path === project.path
  );
  const { byProject } = useVersionMismatches();
  const hasMismatch = byProject.get(project.path)?.hasMismatch ?? false;
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);

  const handleCardClick = () => {
    setDetailContext({
      type: "project-detail",
      projectPath: project.path,
      projectName: project.name,
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick();
        }
      }}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-medium">{project.name}</h3>
            {hasDevServer && (
              <span className="relative flex h-2 w-2" title="Dev server running">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
            )}
            {project.ai_context_files?.length > 0 && (
              <span title={`AI: ${project.ai_context_files.join(", ")}`}>
                <Brain className="h-3.5 w-3.5 text-primary" />
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="ml-2 flex items-center gap-1">
          {project.is_monorepo_root && (
            <StatusBadge variant="neutral">root</StatusBadge>
          )}
          <StatusBadge variant="info">{project.project_type}</StatusBadge>
          {project.health_score && (
            <StatusBadge
              variant={
                project.health_score.grade === "A" || project.health_score.grade === "B"
                  ? "success"
                  : project.health_score.grade === "C"
                    ? "warning"
                    : "error"
              }
            >
              {project.health_score.grade}
            </StatusBadge>
          )}
          {hasMismatch && (
            <span title="Version mismatch detected">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            </span>
          )}
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
            onClick={(e) => {
              e.stopPropagation();
              commands.openInTerminal(project.path);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Open in Terminal"
          >
            <Terminal className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              commands.openInEditor(project.path);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Open in Editor"
          >
            <Code2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              commands.openClaudeCode(project.path);
            }}
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
  type: string;
  projects: ProjectInfo[];
}

type PageItem =
  | { kind: "group"; group: ProjectGroup }
  | { kind: "project"; project: ProjectInfo };

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
      groups.push({ name: "", type: "", projects: topLevel });
    }

    // Then named groups, sorted alphabetically
    const sortedKeys = Array.from(groupMap.keys())
      .filter((k) => k !== "")
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    for (const key of sortedKeys) {
      const items = groupMap.get(key)!;
      const type = items[0]?.group_type || "folder";
      groups.push({ name: key, type, projects: items });
    }

    return groups;
  }, [projects]);
}

function SubfolderAccordion({
  categories,
  toggle,
  isExpanded,
}: {
  categories: [string, ProjectInfo[]][];
  toggle: (key: string) => void;
  isExpanded: (key: string) => boolean;
}) {
  return (
    <>
      {categories.map(([category, categoryProjects]) => (
        <div key={category} className="rounded-md border border-border">
          <button
            onClick={() => toggle(category)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/30"
            aria-expanded={isExpanded(category)}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              {category}/ ({categoryProjects.length})
            </div>
            {isExpanded(category) ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded(category) && (
            <div className="border-t border-border p-4">
              <div className="grid grid-cols-2 gap-4">
                {categoryProjects.map((project) => (
                  <ProjectCard key={project.path} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function GroupSummaryCard({ group }: { group: ProjectGroup }) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);

  const rootProject = group.projects.find((p) => p.is_monorepo_root);
  const subProjects = group.projects.filter((p) => !p.is_monorepo_root);
  const displayCount = group.type === "worktree" ? group.projects.length : subProjects.length;
  const rootPath = rootProject?.path ?? group.projects[0]?.path ?? "";

  const frameworks = useMemo(() => {
    const unique = new Set<string>();
    for (const p of group.projects) {
      if (p.framework) unique.add(p.framework);
    }
    return Array.from(unique);
  }, [group.projects]);

  const Icon =
    group.type === "monorepo"
      ? Package
      : group.type === "worktree"
        ? GitBranch
        : Folder;
  const badgeLabel =
    group.type === "monorepo"
      ? "monorepo"
      : group.type === "worktree"
        ? "worktrees"
        : "folder";

  return (
    <button
      onClick={() =>
        setDetailContext({
          type: "project-group",
          groupName: group.name,
          label: group.name,
        })
      }
      className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{group.name}</h3>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {badgeLabel}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {rootProject?.description && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {rootProject.description}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {displayCount}{" "}
          {group.type === "monorepo"
            ? "package"
            : group.type === "worktree"
              ? "worktree"
              : "project"}
          {displayCount !== 1 ? "s" : ""}
        </span>
        {frameworks.length > 0 && (
          <div className="flex items-center gap-1">
            {frameworks.slice(0, 3).map((fw) => (
              <StatusBadge key={fw} variant="neutral">
                {fw}
              </StatusBadge>
            ))}
            {frameworks.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{frameworks.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2">
        <span className="max-w-[300px] truncate font-mono text-[10px] text-muted-foreground">
          {rootPath}
        </span>
      </div>
    </button>
  );
}

function ProjectGroupDetail({ groupName }: { groupName: string }) {
  const { data: projects } = useProjects();
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const { toggle, isExpanded } = useCollapsibleSections();

  const groupProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => p.group === groupName);
  }, [projects, groupName]);

  const rootProject = groupProjects.find((p) => p.is_monorepo_root);
  const subProjects = groupProjects.filter((p) => !p.is_monorepo_root);
  const groupType = groupProjects[0]?.group_type || "folder";
  const displayProjects = groupType === "worktree" ? groupProjects : subProjects;

  const subfolderCategories = useMemo(() => {
    if (groupType !== "monorepo" || !rootProject) return null;
    return groupBySubfolder(subProjects, rootProject.path);
  }, [groupType, rootProject, subProjects]);

  // Auto-navigate back if group becomes empty
  if (projects && groupProjects.length === 0) {
    setDetailContext(null);
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDetailContext(null)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Back to projects"
          aria-label="Back to projects"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <SectionHeader
          title={groupName}
          description={`${groupProjects.length} project${groupProjects.length !== 1 ? "s" : ""}`}
        />
      </div>

      {groupType === "monorepo" && subfolderCategories ? (
        <>
          {/* Root project */}
          {rootProject && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Root
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <ProjectCard project={rootProject} />
              </div>
            </div>
          )}

          {/* Subfolder accordion sections */}
          <SubfolderAccordion
            categories={subfolderCategories}
            toggle={toggle}
            isExpanded={isExpanded}
          />
        </>
      ) : (
        <>
          {/* Worktree / folder detail: flat grid */}
          {displayProjects.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {groupType === "worktree" ? "Worktrees" : "Projects"}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {displayProjects.map((project) => (
                  <div key={project.path} className="space-y-1">
                    <ProjectCard project={project} />
                    {project.is_monorepo_root && groupType === "worktree" && (
                      <button
                        onClick={() =>
                          setDetailContext({
                            type: "monorepo-detail",
                            rootPath: project.path,
                            label: project.name,
                            parentGroupName: groupName,
                          })
                        }
                        className="flex w-full items-center gap-1.5 rounded-md px-3 py-1 text-xs text-primary transition-colors hover:bg-accent/30"
                      >
                        <Package className="h-3 w-3" />
                        <span>View packages</span>
                        <ChevronRight className="ml-auto h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MonorepoWorktreeDetail({
  rootPath,
  label,
  parentGroupName,
}: {
  rootPath: string;
  label: string;
  parentGroupName: string;
}) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const { toggle, isExpanded } = useCollapsibleSections();

  const { data: packages, isLoading } = useQuery({
    queryKey: ["monorepo-packages", rootPath],
    queryFn: () => commands.getMonorepoPackages(rootPath),
  });

  const subfolderCategories = useMemo(
    () => (packages ? groupBySubfolder(packages, rootPath) : []),
    [packages, rootPath],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setDetailContext({
              type: "project-group",
              groupName: parentGroupName,
              label: parentGroupName,
            })
          }
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={`Back to ${parentGroupName}`}
          aria-label={`Back to ${parentGroupName}`}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <SectionHeader
          title={label}
          description={
            packages
              ? `${packages.length} package${packages.length !== 1 ? "s" : ""}`
              : "Loading..."
          }
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : subfolderCategories.length > 0 ? (
        <SubfolderAccordion
          categories={subfolderCategories}
          toggle={toggle}
          isExpanded={isExpanded}
        />
      ) : (
        <EmptyState
          icon={Package}
          title="No packages found"
          description="This monorepo has no detected workspace packages"
        />
      )}
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 0] as const;
const PAGE_SIZE_LABELS: Record<number, string> = { 5: "5", 10: "10", 20: "20", 0: "All" };

type SortKey = "name" | "framework" | "type" | "recent";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "framework", label: "Framework" },
  { value: "type", label: "Language" },
  { value: "recent", label: "Recent" },
];

type GitFilter = "all" | "dirty" | "clean";
type ServerFilter = "all" | "running";
type ArtifactsFilter = "all" | "has_artifacts";

export function WorkspacesSection() {
  const { data: workspacePaths } = useWorkspacePaths();
  const { data: projects, isLoading, isFetching } = useProjects();
  const addWorkspace = useAddWorkspace();
  const removeWorkspace = useRemoveWorkspace();
  const queryClient = useQueryClient();
  const groups = useGroupedProjects(projects);
  const detailContext = useNavigationStore((s) => s.detailContext);
  const { data: allGitStatuses } = useAllGitStatuses();
  const { data: devServerReport } = useDevServers();

  // Persisted sort preference
  const { data: savedSort } = useSetting("project_sort");
  const setSetting = useSetSetting();

  // Pagination, filter & sort state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [gitFilter, setGitFilter] = useState<GitFilter>("all");
  const [serverFilter, setServerFilter] = useState<ServerFilter>("all");
  const [artifactsFilter, setArtifactsFilter] = useState<ArtifactsFilter>("all");

  // Restore persisted sort on load
  useEffect(() => {
    if (savedSort && SORT_OPTIONS.some((o) => o.value === savedSort)) {
      setSortKey(savedSort as SortKey);
    }
  }, [savedSort]);

  const handleSortChange = useCallback(
    (key: SortKey) => {
      setSortKey(key);
      setCurrentPage(0);
      setSetting.mutate({ key: "project_sort", value: key });
    },
    [setSetting],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchFilter(value);
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  // Build a lookup for git dirty status
  const gitDirtySet = useMemo(() => {
    const set = new Set<string>();
    if (allGitStatuses) {
      for (const gs of allGitStatuses) {
        if (gs.is_dirty) set.add(gs.project_path);
      }
    }
    return set;
  }, [allGitStatuses]);

  // Build a lookup for running dev servers
  const runningServerPaths = useMemo(() => {
    const set = new Set<string>();
    if (devServerReport?.servers) {
      for (const s of devServerReport.servers) {
        if (s.project_path) set.add(s.project_path);
      }
    }
    return set;
  }, [devServerReport]);

  // Filter helper for individual projects
  const projectMatchesFilters = useCallback(
    (p: ProjectInfo) => {
      if (gitFilter === "dirty" && !gitDirtySet.has(p.path)) return false;
      if (gitFilter === "clean" && gitDirtySet.has(p.path)) return false;
      if (serverFilter === "running" && !runningServerPaths.has(p.path)) return false;
      if (artifactsFilter === "has_artifacts" && !p.has_build_artifacts) return false;
      return true;
    },
    [gitFilter, serverFilter, artifactsFilter, gitDirtySet, runningServerPaths],
  );

  // Sort comparator for projects
  // Build epoch lookup for recent sort
  const epochLookup = useMemo(() => {
    const map = new Map<string, number>();
    if (allGitStatuses) {
      for (const gs of allGitStatuses) {
        if (gs.last_commit_epoch) map.set(gs.project_path, gs.last_commit_epoch);
      }
    }
    return map;
  }, [allGitStatuses]);

  const sortProjects = useCallback(
    (a: ProjectInfo, b: ProjectInfo) => {
      switch (sortKey) {
        case "framework":
          return (a.framework || "").localeCompare(b.framework || "");
        case "type":
          return (a.project_type || "").localeCompare(b.project_type || "");
        case "recent": {
          const ea = epochLookup.get(a.path) ?? 0;
          const eb = epochLookup.get(b.path) ?? 0;
          return eb - ea; // descending — most recent first
        }
        case "name":
        default:
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
    },
    [sortKey, epochLookup],
  );

  // Filtering + sorting
  const filteredGroups = useMemo(() => {
    const query = searchFilter.toLowerCase();
    const hasExtraFilters = gitFilter !== "all" || serverFilter !== "all" || artifactsFilter !== "all";

    return groups
      .map((group) => {
        // For named groups (monorepos, worktrees), filter at project level
        const filteredProjects = group.projects.filter((p) => {
          const matchesSearch =
            !searchFilter ||
            p.name.toLowerCase().includes(query) ||
            (group.name && group.name.toLowerCase().includes(query));
          return matchesSearch && projectMatchesFilters(p);
        });

        if (filteredProjects.length === 0) return null;

        const sorted = [...filteredProjects].sort(sortProjects);
        return { ...group, projects: sorted };
      })
      .filter(Boolean) as ProjectGroup[];
  }, [groups, searchFilter, gitFilter, serverFilter, artifactsFilter, projectMatchesFilters, sortProjects]);

  // Pagination
  const pageItems = useMemo(() => {
    const items: PageItem[] = [];
    for (const group of filteredGroups) {
      if (group.name) {
        items.push({ kind: "group", group });
      } else {
        for (const project of group.projects) {
          items.push({ kind: "project", project });
        }
      }
    }
    return items;
  }, [filteredGroups]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(pageItems.length / pageSize);

  const paginatedItems = useMemo(() => {
    if (pageSize === 0) return pageItems;
    return pageItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [pageItems, currentPage, pageSize]);

  // Description
  const totalProjectCount = projects?.length ?? 0;
  const filteredProjectCount = filteredGroups.reduce(
    (acc, g) => acc + g.projects.length,
    0,
  );
  const wsCount = workspacePaths?.length ?? 0;
  const description = searchFilter
    ? `${filteredProjectCount} of ${totalProjectCount} projects across ${wsCount} workspace${wsCount !== 1 ? "s" : ""}`
    : `${totalProjectCount} project${totalProjectCount !== 1 ? "s" : ""} across ${wsCount} workspace${wsCount !== 1 ? "s" : ""}`;

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

  // Detail views
  if (detailContext?.type === "project-detail") {
    return (
      <ProjectDetail
        projectPath={detailContext.projectPath}
        projectName={detailContext.projectName}
      />
    );
  }

  if (detailContext?.type === "monorepo-detail") {
    return (
      <MonorepoWorktreeDetail
        rootPath={detailContext.rootPath}
        label={detailContext.label}
        parentGroupName={detailContext.parentGroupName}
      />
    );
  }

  if (detailContext?.type === "project-group") {
    return <ProjectGroupDetail groupName={detailContext.groupName} />;
  }

  // List view
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Projects"
        description={description}
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

      {/* Toolbar: search + sort + filters + page size + pagination */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Filter projects..."
              aria-label="Filter projects"
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      sortKey === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page size */}
            <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    pageSize === size
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PAGE_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {/* Git status filter */}
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {(["all", "dirty", "clean"] as GitFilter[]).map((val) => (
              <button
                key={val}
                onClick={() => {
                  setGitFilter(val);
                  setCurrentPage(0);
                }}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  gitFilter === val
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {val === "all" ? "All" : val === "dirty" ? "Uncommitted" : "Clean"}
              </button>
            ))}
          </div>
          {/* Dev server filter */}
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {(["all", "running"] as ServerFilter[]).map((val) => (
              <button
                key={val}
                onClick={() => {
                  setServerFilter(val);
                  setCurrentPage(0);
                }}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  serverFilter === val
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {val === "all" ? "Any Server" : "Server Running"}
              </button>
            ))}
          </div>
          {/* Artifacts filter */}
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {(["all", "has_artifacts"] as ArtifactsFilter[]).map((val) => (
              <button
                key={val}
                onClick={() => {
                  setArtifactsFilter(val);
                  setCurrentPage(0);
                }}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  artifactsFilter === val
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {val === "all" ? "Any Artifacts" : "Has Artifacts"}
              </button>
            ))}
          </div>
          {(gitFilter !== "all" || serverFilter !== "all" || artifactsFilter !== "all") && (
            <button
              onClick={() => {
                setGitFilter("all");
                setServerFilter("all");
                setArtifactsFilter("all");
                setCurrentPage(0);
              }}
              className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Project grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : paginatedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {paginatedItems.map((item) =>
            item.kind === "group" ? (
              <GroupSummaryCard key={item.group.name} group={item.group} />
            ) : (
              <ProjectCard key={item.project.path} project={item.project} />
            ),
          )}
        </div>
      ) : groups.length === 0 ? (
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
      ) : (
        <EmptyState
          icon={Search}
          title="No matching projects"
          description="Try a different search term"
        />
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
