import { create } from "zustand";

export type Section =
  | "dashboard"
  | "system"
  | "path"
  | "languages"
  | "environment"
  | "workspaces"
  | "packages"
  | "tools"
  | "settings"
  | "issues";

export type DetailContext =
  | { type: "project-group"; groupName: string; label: string }
  | { type: "monorepo-detail"; rootPath: string; label: string; parentGroupName: string }
  | { type: "tool-detail"; toolName: string; label: string }
  | { type: "project-detail"; projectPath: string; projectName: string };

interface NavigationState {
  activeSection: Section;
  commandPaletteOpen: boolean;
  detailContext: DetailContext | null;
  issuesExpandedSection: Section | null;
  setActiveSection: (section: Section) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setDetailContext: (ctx: DetailContext | null) => void;
  navigateToIssues: (expandSection?: Section) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSection: "dashboard",
  commandPaletteOpen: false,
  detailContext: null,
  issuesExpandedSection: null,
  setActiveSection: (section) => set({ activeSection: section, detailContext: null, issuesExpandedSection: null }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setDetailContext: (ctx) => set({ detailContext: ctx }),
  navigateToIssues: (expandSection) => set({ activeSection: "issues", detailContext: null, issuesExpandedSection: expandSection ?? null }),
}));
