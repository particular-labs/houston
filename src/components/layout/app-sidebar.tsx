import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Monitor,
  Route,
  Code2,
  Variable,
  FolderGit2,
  Package,
  Wrench,
  Settings,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { cn } from "@/lib/utils";
import { useNavigationStore, type Section } from "@/stores/navigation";

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
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

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
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: "var(--color-sidebar-border)" }}
      >
        <button
          onClick={() => setActiveSection("settings")}
          className="sidebar-settings-btn transition-colors"
          style={{ color: "var(--color-muted-foreground)" }}
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
    </aside>
  );
}
