import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { AppStatusBar } from "./app-status-bar";
import { CommandPalette } from "./command-palette";
import { useNavigationStore } from "@/stores/navigation";

import { Dashboard } from "@/components/sections/dashboard";
import { SystemSection } from "@/components/sections/system";
import { PathInspector } from "@/components/sections/path-inspector";
import { LanguagesSection } from "@/components/sections/languages";
import { EnvironmentSection } from "@/components/sections/environment";
import { WorkspacesSection } from "@/components/sections/workspaces";
import { PackagesSection } from "@/components/sections/packages";
import { ToolsSection } from "@/components/sections/tools";

const sections = {
  dashboard: Dashboard,
  system: SystemSection,
  path: PathInspector,
  languages: LanguagesSection,
  environment: EnvironmentSection,
  workspaces: WorkspacesSection,
  packages: PackagesSection,
  tools: ToolsSection,
} as const;

export function AppShell() {
  const activeSection = useNavigationStore((s) => s.activeSection);
  const ActiveComponent = sections[activeSection];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-lg">
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <ActiveComponent />
          </main>
        </div>
      </div>
      <AppStatusBar />
      <CommandPalette />
    </div>
  );
}
