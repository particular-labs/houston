import { lazy, Suspense } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { AppStatusBar } from "./app-status-bar";
import { CommandPalette } from "./command-palette";
import { WhatsNewModal } from "./whats-new-modal";
import { useNavigationStore } from "@/stores/navigation";
import { SectionSkeleton } from "@/components/shared/skeleton";

const Dashboard = lazy(() =>
  import("@/components/sections/dashboard").then((m) => ({
    default: m.Dashboard,
  })),
);
const SystemSection = lazy(() =>
  import("@/components/sections/system").then((m) => ({
    default: m.SystemSection,
  })),
);
const PathInspector = lazy(() =>
  import("@/components/sections/path-inspector").then((m) => ({
    default: m.PathInspector,
  })),
);
const LanguagesSection = lazy(() =>
  import("@/components/sections/languages").then((m) => ({
    default: m.LanguagesSection,
  })),
);
const EnvironmentSection = lazy(() =>
  import("@/components/sections/environment").then((m) => ({
    default: m.EnvironmentSection,
  })),
);
const WorkspacesSection = lazy(() =>
  import("@/components/sections/workspaces").then((m) => ({
    default: m.WorkspacesSection,
  })),
);
const PackagesSection = lazy(() =>
  import("@/components/sections/packages").then((m) => ({
    default: m.PackagesSection,
  })),
);
const ToolsSection = lazy(() =>
  import("@/components/sections/tools").then((m) => ({
    default: m.ToolsSection,
  })),
);
const SettingsSection = lazy(() =>
  import("@/components/sections/settings").then((m) => ({
    default: m.SettingsSection,
  })),
);
const IssuesSection = lazy(() =>
  import("@/components/sections/issues").then((m) => ({
    default: m.IssuesSection,
  })),
);

const sections = {
  dashboard: Dashboard,
  system: SystemSection,
  path: PathInspector,
  languages: LanguagesSection,
  environment: EnvironmentSection,
  workspaces: WorkspacesSection,
  packages: PackagesSection,
  tools: ToolsSection,
  settings: SettingsSection,
  issues: IssuesSection,
} as const;

export function AppShell() {
  const activeSection = useNavigationStore((s) => s.activeSection);
  const ActiveComponent = sections[activeSection];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-lg">
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div data-tauri-drag-region className="h-11 shrink-0" />
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <Suspense fallback={<SectionSkeleton />}>
              <ActiveComponent />
            </Suspense>
          </main>
        </div>
      </div>
      <AppStatusBar />
      <CommandPalette />
      <WhatsNewModal />
    </div>
  );
}
