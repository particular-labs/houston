import { Search, RefreshCw } from "lucide-react";
import { useNavigationStore, type Section } from "@/stores/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const sectionLabels: Record<Section, string> = {
  dashboard: "Dashboard",
  system: "System",
  path: "PATH Inspector",
  languages: "Languages",
  environment: "Environment",
  workspaces: "Projects",
  packages: "Packages",
  tools: "CLI Tools",
};

export function AppHeader() {
  const { activeSection, detailContext, setDetailContext, toggleCommandPalette } =
    useNavigationStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm"
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <span className="text-sm text-muted-foreground">Houston</span>
        <span className="text-xs text-muted-foreground">/</span>
        {detailContext ? (
          <>
            <button
              onClick={() => setDetailContext(null)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {sectionLabels[activeSection]}
            </button>
            {detailContext.type === "monorepo-detail" ? (
              <>
                <span className="text-xs text-muted-foreground">/</span>
                <button
                  onClick={() =>
                    setDetailContext({
                      type: "project-group",
                      groupName: detailContext.parentGroupName,
                      label: detailContext.parentGroupName,
                    })
                  }
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {detailContext.parentGroupName}
                </button>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-sm font-medium">
                  {detailContext.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-sm font-medium">
                  {detailContext.label}
                </span>
              </>
            )}
          </>
        ) : (
          <span className="text-sm font-medium">
            {sectionLabels[activeSection]}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Search / Command Palette trigger */}
        <button
          onClick={toggleCommandPalette}
          className="flex h-7 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
        >
          <Search className="h-3 w-3" />
          <span>Search</span>
          <kbd className="ml-1.5 rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium">
            {"\u2318"}K
          </kbd>
        </button>

        {/* Refresh all */}
        <button
          onClick={handleRefreshAll}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Refresh all (Cmd+R)"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </header>
  );
}
