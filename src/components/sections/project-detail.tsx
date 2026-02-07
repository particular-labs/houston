import {
  ArrowLeft,
  Terminal,
  Code2,
  Sparkles,
  HardDrive,
  GitBranch,
  Users,
  Tag,
  History,
  Package,
  Folder,
  FileCode,
  Database,
} from "lucide-react";
import { useProjectAnalysis } from "@/hooks/use-project-analysis";
import { useNavigationStore } from "@/stores/navigation";
import { commands } from "@/lib/commands";
import type {
  ProjectAnalysis,
  DirectorySize,
  LanguageDetails,
} from "@/lib/commands";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { InfoCardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectDetailProps {
  projectPath: string;
  projectName: string;
}

function QuickActions({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => commands.openInTerminal(path)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-accent"
        title="Open in Terminal"
      >
        <Terminal className="h-3.5 w-3.5" />
        Terminal
      </button>
      <button
        onClick={() => commands.openInEditor(path)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-accent"
        title="Open in Editor"
      >
        <Code2 className="h-3.5 w-3.5" />
        Editor
      </button>
      <button
        onClick={() => commands.openClaudeCode(path)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        title="Open Claude Code"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Claude Code
      </button>
    </div>
  );
}

function StorageCard({ analysis }: { analysis: ProjectAnalysis }) {
  const totalBytes = analysis.total_size.bytes;
  const codeBytes = analysis.code_size.bytes;
  const artifactBytes = totalBytes - codeBytes;

  // Colors for categories
  const categoryColors: Record<string, string> = {
    dependencies: "bg-blue-500",
    build: "bg-amber-500",
    cache: "bg-purple-500",
    vcs: "bg-green-500",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Storage</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Total Size</span>
          <p className="text-2xl font-semibold tracking-tight">
            {analysis.total_size.display}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Code Size</span>
          <p className="text-2xl font-semibold tracking-tight">
            {analysis.code_size.display}
          </p>
        </div>
      </div>

      {/* Storage breakdown bar */}
      {totalBytes > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {/* Code portion */}
            <div
              className="bg-emerald-500"
              style={{ width: `${(codeBytes / totalBytes) * 100}%` }}
              title={`Code: ${analysis.code_size.display}`}
            />
            {/* Artifact portions by category */}
            {analysis.storage_breakdown.map((dir) => (
              <div
                key={dir.name}
                className={categoryColors[dir.category] || "bg-gray-500"}
                style={{ width: `${(dir.size.bytes / totalBytes) * 100}%` }}
                title={`${dir.name}: ${dir.size.display}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Code</span>
            </div>
            {analysis.storage_breakdown.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Dependencies</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Build</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-muted-foreground">Cache</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">VCS</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function JsDetailsCard({ details }: { details: LanguageDetails & { type: "JavaScript" } }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">JavaScript/TypeScript</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Dependencies</span>
          <p className="text-xl font-semibold">{details.dependency_count}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Dev Dependencies</span>
          <p className="text-xl font-semibold">{details.dev_dependency_count}</p>
        </div>
        {details.node_modules_size && (
          <div>
            <span className="text-xs text-muted-foreground">node_modules</span>
            <p className="text-xl font-semibold">
              {details.node_modules_size.display}
            </p>
          </div>
        )}
      </div>

      {details.scripts.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Scripts</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {details.scripts.map((script) => (
              <span
                key={script}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
              >
                {script}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {details.engines && <span>Engines: {details.engines}</span>}
        {details.license && <span>License: {details.license}</span>}
      </div>
    </div>
  );
}

function RustDetailsCard({ details }: { details: LanguageDetails & { type: "Rust" } }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Rust</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Dependencies</span>
          <p className="text-xl font-semibold">{details.dependency_count}</p>
        </div>
        {details.edition && (
          <div>
            <span className="text-xs text-muted-foreground">Edition</span>
            <p className="text-xl font-semibold">{details.edition}</p>
          </div>
        )}
        {details.target_size && (
          <div>
            <span className="text-xs text-muted-foreground">target/</span>
            <p className="text-xl font-semibold">{details.target_size.display}</p>
          </div>
        )}
      </div>

      {details.features.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Features</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {details.features.map((feature) => (
              <span
                key={feature}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PythonDetailsCard({ details }: { details: LanguageDetails & { type: "Python" } }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Python</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Dependencies</span>
          <p className="text-xl font-semibold">{details.dependency_count}</p>
        </div>
        {details.python_version && (
          <div>
            <span className="text-xs text-muted-foreground">Python Version</span>
            <p className="text-xl font-semibold">{details.python_version}</p>
          </div>
        )}
        {details.venv_size && (
          <div>
            <span className="text-xs text-muted-foreground">venv</span>
            <p className="text-xl font-semibold">{details.venv_size.display}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GoDetailsCard({ details }: { details: LanguageDetails & { type: "Go" } }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Go</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Modules</span>
          <p className="text-xl font-semibold">{details.module_count}</p>
        </div>
        {details.go_version && (
          <div>
            <span className="text-xs text-muted-foreground">Go Version</span>
            <p className="text-xl font-semibold">{details.go_version}</p>
          </div>
        )}
        {details.vendor_size && (
          <div>
            <span className="text-xs text-muted-foreground">vendor/</span>
            <p className="text-xl font-semibold">{details.vendor_size.display}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LanguageDetailsCard({ details }: { details: LanguageDetails }) {
  switch (details.type) {
    case "JavaScript":
      return <JsDetailsCard details={details} />;
    case "Rust":
      return <RustDetailsCard details={details} />;
    case "Python":
      return <PythonDetailsCard details={details} />;
    case "Go":
      return <GoDetailsCard details={details} />;
    default:
      return null;
  }
}

function GitInfoCard({ gitInfo }: { gitInfo: NonNullable<ProjectAnalysis["git_info"]> }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Git History</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <span className="text-xs text-muted-foreground">Total Commits</span>
          <p className="text-xl font-semibold">{gitInfo.total_commits.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Contributors</span>
          <p className="text-xl font-semibold">{gitInfo.contributors.length}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Tags</span>
          <p className="text-xl font-semibold">{gitInfo.tags.length}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Stashes</span>
          <p className="text-xl font-semibold">{gitInfo.stash_count}</p>
        </div>
      </div>

      {/* First commit date */}
      {gitInfo.first_commit_date && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <History className="h-3 w-3" />
          <span>First commit: {gitInfo.first_commit_date}</span>
        </div>
      )}

      {/* Top contributors */}
      {gitInfo.contributors.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Top Contributors</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gitInfo.contributors.map((name) => (
              <span
                key={name}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent tags */}
      {gitInfo.tags.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>Recent Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gitInfo.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DirectoryBreakdownTable({ directories }: { directories: DirectorySize[] }) {
  if (directories.length === 0) return null;

  const categoryIcons: Record<string, typeof Folder> = {
    dependencies: Package,
    build: Database,
    cache: HardDrive,
    vcs: GitBranch,
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Directory Breakdown</h3>
        </div>
      </div>
      <div className="divide-y divide-border">
        {directories.map((dir) => {
          const Icon = categoryIcons[dir.category] || Folder;
          return (
            <div
              key={dir.name}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-sm">{dir.name}/</span>
                <StatusBadge variant="neutral">{dir.category}</StatusBadge>
              </div>
              <span className="font-mono text-sm font-medium">
                {dir.size.display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectDetail({ projectPath, projectName }: ProjectDetailProps) {
  const setDetailContext = useNavigationStore((s) => s.setDetailContext);
  const queryClient = useQueryClient();
  const { data: analysis, isLoading, isFetching } = useProjectAnalysis(projectPath);

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="space-y-4">
        <button
          onClick={() => setDetailContext(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {analysis?.name || projectName}
              </h2>
              {analysis && (
                <>
                  <StatusBadge variant="info">{analysis.project_type}</StatusBadge>
                  {analysis.framework && (
                    <StatusBadge variant="neutral">{analysis.framework}</StatusBadge>
                  )}
                </>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="font-mono text-xs text-muted-foreground">
                {projectPath}
              </span>
              <CopyButton value={projectPath} />
            </div>
          </div>

          {/* Quick actions */}
          <QuickActions path={projectPath} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCardSkeleton />
          <InfoCardSkeleton />
          <InfoCardSkeleton />
          <InfoCardSkeleton />
        </div>
      ) : analysis ? (
        <div className="space-y-4">
          {/* Top row: Storage + Language Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <StorageCard analysis={analysis} />
            <LanguageDetailsCard details={analysis.language_details} />
          </div>

          {/* Git info */}
          {analysis.git_info && <GitInfoCard gitInfo={analysis.git_info} />}

          {/* Directory breakdown */}
          <DirectoryBreakdownTable directories={analysis.storage_breakdown} />

          {/* Last analyzed timestamp */}
          <p className="text-right text-[10px] text-muted-foreground">
            Analyzed {new Date(analysis.analyzed_at).toLocaleString()}
            {isFetching && " (refreshing...)"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Unable to analyze project at this path
          </p>
        </div>
      )}
    </div>
  );
}
