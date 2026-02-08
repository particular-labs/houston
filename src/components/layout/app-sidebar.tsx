import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Monitor,
  Route,
  Code2,
  Variable,
  FolderGit2,
  Container,
  Package,
  Wrench,
  Settings,
  Sun,
  Moon,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigationStore, type Section } from "@/stores/navigation";
import { useUpdateStore } from "@/stores/update";
import { useSettings, useSetSetting, getSettingValue } from "@/hooks/use-settings";
import { useIssueCount } from "@/hooks/use-issue-count";
import { useProjects } from "@/hooks/use-workspaces";
import { useDockerStatusCached } from "@/hooks/use-docker";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Environment",
    items: [
      { id: "system", label: "System", icon: Monitor },
      { id: "path", label: "PATH", icon: Route },
      { id: "languages", label: "Languages", icon: Code2 },
      { id: "environment", label: "Environment", icon: Variable },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "workspaces", label: "Projects", icon: FolderGit2 },
      { id: "containers", label: "Containers", icon: Container },
    ],
  },
  {
    title: "Tools",
    items: [
      { id: "packages", label: "Packages", icon: Package },
      { id: "tools", label: "Tools", icon: Wrench },
    ],
  },
];

export function AppSidebar() {
  const { activeSection, setActiveSection } = useNavigationStore();
  const { status: updateStatus, version: updateVersion, setStatus: setUpdateStatus } = useUpdateStore();
  const [version, setVersion] = useState("");
  const { data: settings } = useSettings();
  const setSetting = useSetSetting();
  const theme = getSettingValue(settings, "theme", "dark");
  const { count: totalCount } = useIssueCount();
  const { data: projects } = useProjects();
  const { data: dockerStatus } = useDockerStatusCached();
  const projectCount = projects?.length ?? 0;
  const runningContainerCount = dockerStatus?.total_running ?? 0;

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const handleInstallUpdate = async () => {
    setUpdateStatus("downloading", updateVersion);
    toast("Downloading update...");
    try {
      const update = await check();
      if (update?.available) {
        await update.downloadAndInstall();
        toast.success("Update ready — restarting...");
        await relaunch();
      }
    } catch {
      toast.error("Update failed");
      setUpdateStatus("error");
    }
  };

  const toggleTheme = () => {
    setSetting.mutate({ key: "theme", value: theme === "dark" ? "light" : "dark" });
  };

  return (
    <aside
      className="flex h-full w-[240px] flex-col border-r"
      style={{
        backgroundColor: "var(--color-sidebar)",
        borderColor: "var(--color-sidebar-border)",
      }}
    >
      {/* Traffic light inset (macOS overlay titlebar) */}
      <div data-tauri-drag-region className="h-11 shrink-0" />
      {/* Title */}
      <div className="shrink-0 px-4 pb-2">
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: "var(--color-sidebar-foreground)" }}
        >
          Houston
        </span>
        <span
          className="block text-[10px] tracking-wide"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Dev Mission Control
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <div
              className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const showProjectCount = item.id === "workspaces" && projectCount > 0;
              const showContainerCount = item.id === "containers" && runningContainerCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "sidebar-nav-item flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive && "active",
                  )}
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-sidebar-accent)"
                      : "transparent",
                    color: isActive
                      ? "var(--color-sidebar-accent-foreground)"
                      : "var(--color-muted-foreground)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {showProjectCount && (
                    <span className="ml-auto rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                      {projectCount}
                    </span>
                  )}
                  {showContainerCount && (
                    <span className="ml-auto rounded-full bg-green-500/20 px-1.5 text-[10px] font-medium text-green-500">
                      {runningContainerCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Issues Nav Item */}
      {totalCount > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setActiveSection("issues")}
            className={cn(
              "sidebar-nav-item flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              activeSection === "issues" && "active"
            )}
            style={{
              backgroundColor:
                activeSection === "issues"
                  ? "var(--color-sidebar-accent)"
                  : "transparent",
              color:
                activeSection === "issues"
                  ? "var(--color-sidebar-accent-foreground)"
                  : "var(--color-muted-foreground)",
              fontWeight: activeSection === "issues" ? 500 : 400,
            }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Issues
            <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-medium text-white">
              {totalCount}
            </span>
          </button>
        </div>
      )}

      {/* Update Banner */}
      {updateStatus === "available" && (
        <div
          className="mx-3 mb-2 rounded-md px-3 py-2"
          style={{ backgroundColor: "var(--color-sidebar-accent)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Download
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--color-primary)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-sidebar-foreground)" }}
              >
                v{updateVersion}
              </span>
            </div>
            <button
              onClick={handleInstallUpdate}
              className="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              Update
            </button>
          </div>
        </div>
      )}

      {updateStatus === "downloading" && (
        <div
          className="mx-3 mb-2 flex items-center gap-2 rounded-md px-3 py-2"
          style={{ backgroundColor: "var(--color-sidebar-accent)" }}
        >
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
          <span
            className="text-xs"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Installing...
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: "var(--color-sidebar-border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSection("settings")}
            className="sidebar-settings-btn transition-colors"
            style={{ color: "var(--color-muted-foreground)" }}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          {version && (
            <span
              className="text-[10px]"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              v{version}
            </span>
          )}
        </div>
        <button
          onClick={toggleTheme}
          className="sidebar-settings-btn transition-colors"
          style={{ color: "var(--color-muted-foreground)" }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
