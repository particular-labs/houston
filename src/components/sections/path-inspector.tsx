import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Copy as CopyIcon } from "lucide-react";
import { usePathEntries } from "@/hooks/use-path-entries";
import { SectionHeader } from "@/components/shared/section-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { TableSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export function PathInspector() {
  const { data: entries, isLoading, isFetching } = usePathEntries();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "valid" | "issues">("all");

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((entry) => {
      const matchesSearch =
        !search ||
        entry.path.toLowerCase().includes(search.toLowerCase()) ||
        entry.category.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "valid" && entry.exists && !entry.is_duplicate) ||
        (filter === "issues" && (!entry.exists || entry.is_duplicate));
      return matchesSearch && matchesFilter;
    });
  }, [entries, search, filter]);

  const issueCount = entries?.filter((e) => !e.exists || e.is_duplicate).length ?? 0;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="PATH Inspector"
        description={`${entries?.length ?? 0} entries, ${issueCount} issue${issueCount !== 1 ? "s" : ""}`}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["path-entries"] })}
        isRefreshing={isFetching}
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter PATH entries..."
          className="w-64"
        />
        <div className="flex gap-1">
          {(["all", "valid", "issues"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {f === "all"
                ? `All (${entries?.length ?? 0})`
                : f === "valid"
                  ? `Valid (${(entries?.length ?? 0) - issueCount})`
                  : `Issues (${issueCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Path
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={`${entry.index}-${entry.path}`}
                  className="border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {entry.index + 1}
                  </td>
                  <td className="max-w-[400px] truncate px-3 py-2 font-mono text-xs">
                    {entry.path}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge variant="neutral">{entry.category}</StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    {!entry.exists ? (
                      <StatusBadge variant="error">
                        <AlertTriangle className="h-3 w-3" />
                        Missing
                      </StatusBadge>
                    ) : entry.is_duplicate ? (
                      <StatusBadge variant="warning">
                        <CopyIcon className="h-3 w-3" />
                        Duplicate
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="success">
                        <CheckCircle2 className="h-3 w-3" />
                        Valid
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <CopyButton value={entry.path} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching entries found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
