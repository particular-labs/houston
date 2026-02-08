import { CheckCircle2, Code2 } from "lucide-react";
import { useLanguages } from "@/hooks/use-languages";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { InfoCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { useQueryClient } from "@tanstack/react-query";

export function LanguagesSection() {
  const { data: languages, isLoading, isFetching, isError, refetch } = useLanguages();
  const queryClient = useQueryClient();

  const installed = languages?.filter((l) => l.installed) ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Languages"
        description={`${installed.length} runtime${installed.length !== 1 ? "s" : ""} detected`}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["languages"] })}
        isRefreshing={isFetching}
      />

      {isError ? (
        <ErrorBanner message="Failed to scan language runtimes" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          <InfoCardSkeleton rows={3} />
          <InfoCardSkeleton rows={3} />
          <InfoCardSkeleton rows={3} />
        </div>
      ) : installed.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No language runtimes detected"
          description="Install Node.js, Python, Go, Rust, or other runtimes to see them here"
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {installed.map((lang) => (
              <div
                key={lang.name}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{lang.name}</h3>
                    <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight">
                      {lang.version}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Binary</span>
                    <div className="flex items-center gap-1">
                      <span className="max-w-[180px] truncate font-mono text-muted-foreground">
                        {lang.binary_path}
                      </span>
                      <CopyButton value={lang.binary_path} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Manager</span>
                    <StatusBadge variant="neutral">{lang.manager}</StatusBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
