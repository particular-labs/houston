import { Command } from "cmdk";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Monitor,
  Route,
  Code2,
  Variable,
  FolderGit2,
  Package,
  Wrench,
} from "lucide-react";
import { useNavigationStore, type Section } from "@/stores/navigation";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  group: string;
}

const items: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Navigation" },
  { id: "system", label: "System Info", icon: Monitor, group: "Navigation" },
  { id: "path", label: "PATH Inspector", icon: Route, group: "Navigation" },
  { id: "languages", label: "Languages", icon: Code2, group: "Navigation" },
  { id: "environment", label: "Environment Variables", icon: Variable, group: "Navigation" },
  { id: "workspaces", label: "Projects & Workspaces", icon: FolderGit2, group: "Navigation" },
  { id: "packages", label: "Global Packages", icon: Package, group: "Navigation" },
  { id: "tools", label: "AI Tools", icon: Wrench, group: "Navigation" },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveSection } =
    useNavigationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl">
        <Command className="w-full" label="Command palette">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => {
                      setActiveSection(item.id);
                      setCommandPaletteOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
