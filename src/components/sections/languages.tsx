import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useLanguages } from "@/hooks/use-languages";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export function LanguagesSection() {
  const { data: languages, isLoading, isFetching } = useLanguages();
  const queryClient = useQueryClient();

  const installed = languages?.filter((l) => l.installed) ?? [];
  const notInstalled = languages?.filter((l) => !l.installed) ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Languages"
        description={`${installed.length} runtime${installed.length !== 1 ? "s" : ""} detected`}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["languages"] })}
        isRefreshing={isFetching}
      />

      {/* Installed */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
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

          {/* Not installed */}
          {notInstalled.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Not Detected
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {notInstalled.map((lang) => (
                  <div
                    key={lang.name}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {lang.name}
                    </span>
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
