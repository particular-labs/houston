import { useState, useMemo } from "react";
import { Package, Box } from "lucide-react";
import { useGlobalPackages } from "@/hooks/use-global-packages";
import { SectionHeader } from "@/components/shared/section-header";
import { SearchInput } from "@/components/shared/search-input";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import type { PackageInfo } from "@/lib/commands";

type Tab = "npm" | "brew" | "pip" | "cargo";

const tabs: { id: Tab; label: string }[] = [
  { id: "npm", label: "npm global" },
  { id: "brew", label: "Homebrew" },
  { id: "pip", label: "pip" },
  { id: "cargo", label: "Cargo" },
];

function PackageTable({
  packages,
  search,
}: {
  packages: PackageInfo[];
  search: string;
}) {
  const filtered = useMemo(() => {
    if (!search) return packages;
    return packages.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.version.toLowerCase().includes(search.toLowerCase()),
    );
  }, [packages, search]);

  if (packages.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No packages found"
        description="This package manager doesn't have any globally installed packages, or it's not installed"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Package
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Version
            </th>
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((pkg) => (
            <tr
              key={pkg.name}
              className="border-b border-border last:border-0 hover:bg-accent/30"
            >
              <td className="px-3 py-2 font-mono text-xs font-medium">
                {pkg.name}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {pkg.version}
              </td>
              <td className="px-3 py-2">
                <CopyButton value={`${pkg.name}@${pkg.version}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && packages.length > 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No matching packages
        </div>
      )}
    </div>
  );
}

export function PackagesSection() {
  const { data: packages, isLoading, isFetching } = useGlobalPackages();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("npm");
  const [search, setSearch] = useState("");

  const tabData: Record<Tab, PackageInfo[]> = {
    npm: packages?.npm_global ?? [],
    brew: packages?.brew ?? [],
    pip: packages?.pip ?? [],
    cargo: packages?.cargo ?? [],
  };

  const currentPackages = tabData[activeTab];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Global Packages"
        description="Packages installed globally across package managers"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["global-packages"] })}
        isRefreshing={isFetching}
      />

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch("");
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({tabData[tab.id].length})
              </span>
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${tabs.find((t) => t.id === activeTab)?.label} packages...`}
          className="w-64"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <PackageTable packages={currentPackages} search={search} />
      )}
    </div>
  );
}
