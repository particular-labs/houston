import { useEffect } from "react";
import {
  Rocket,
  FolderPlus,
  Palette,
  RefreshCw,
  Command,
  Keyboard,
  X,
} from "lucide-react";
import { useNavigationStore } from "@/stores/navigation";

const QUICK_START_ITEMS = [
  {
    icon: FolderPlus,
    title: "Add Workspaces",
    description: "Scan your project folders to see all your projects in one place",
    shortcut: "⌘6",
  },
  {
    icon: Palette,
    title: "Change Theme",
    description: "Toggle between dark and light mode using the sidebar button",
    shortcut: null,
  },
  {
    icon: RefreshCw,
    title: "Check for Updates",
    description: "Houston checks automatically, or visit Settings to check manually",
    shortcut: "⌘9",
  },
  {
    icon: Command,
    title: "Command Palette",
    description: "Quick access to any section or action",
    shortcut: "⌘K",
  },
];

const SHORTCUTS = [
  { keys: "⌘1-9", action: "Navigate sections" },
  { keys: "⌘K", action: "Command palette" },
  { keys: "⌘R", action: "Refresh all data" },
  { keys: "Esc", action: "Close dialogs" },
];

export function OnboardingModal() {
  const { onboardingOpen, setOnboardingOpen, setActiveSection } =
    useNavigationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onboardingOpen) {
        setOnboardingOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onboardingOpen, setOnboardingOpen]);

  if (!onboardingOpen) return null;

  const handleGetStarted = () => {
    setOnboardingOpen(false);
    setActiveSection("workspaces"); // Take them to add workspaces
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOnboardingOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <button
            onClick={() => setOnboardingOpen(false)}
            className="absolute right-3 top-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                Welcome to Houston
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your developer environment dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start Items */}
        <div className="p-5 space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick Start
          </h3>
          {QUICK_START_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50"
            >
              <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {item.title}
                  </span>
                  {item.shortcut && (
                    <kbd className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono shrink-0">
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Shortcuts Reference */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Keyboard Shortcuts
            </h3>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {SHORTCUTS.map((s) => (
              <span key={s.keys} className="text-xs text-muted-foreground">
                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono mr-1">
                  {s.keys}
                </kbd>
                {s.action}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 bg-card/50">
          <button
            onClick={handleGetStarted}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
