import { useState, useMemo } from "react";
import { useEnvVars } from "@/hooks/use-env-vars";
import { SectionHeader } from "@/components/shared/section-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyButton } from "@/components/shared/copy-button";
import { TableSkeleton } from "@/components/shared/skeleton";
import { IssueLinkBadge } from "@/components/shared/issue-link-badge";
import { useQueryClient } from "@tanstack/react-query";

const categoryVariant: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  Path: "info",
  Language: "success",
  Shell: "neutral",
  Cloud: "info",
  "Git/SSH": "success",
  Homebrew: "warning",
  Sensitive: "error",
  System: "neutral",
  Other: "neutral",
};

export function EnvironmentSection() {
  const { data: vars, isLoading, isFetching } = useEnvVars();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => {
    if (!vars) return [];
    const cats = new Set(vars.map((v) => v.category));
    return Array.from(cats).sort();
  }, [vars]);

  const filtered = useMemo(() => {
    if (!vars) return [];
    return vars.filter((v) => {
      const matchesSearch =
        !search ||
        v.key.toLowerCase().includes(search.toLowerCase()) ||
        v.value.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vars, search, categoryFilter]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Environment"
        description={`${vars?.length ?? 0} variables`}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["env-vars"] })}
        isRefreshing={isFetching}
      />

      <IssueLinkBadge section="environment" />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search variables..."
          className="w-64"
        />
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Variable
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Value
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Category
                </th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.key}
                  className="border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <td className="px-3 py-2 font-mono text-xs font-medium text-primary">
                    {v.key}
                  </td>
                  <td className="max-w-[400px] truncate px-3 py-2 font-mono text-xs text-muted-foreground">
                    {v.value}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      variant={categoryVariant[v.category] ?? "neutral"}
                    >
                      {v.category}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    <CopyButton value={`${v.key}=${v.value}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching variables found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
