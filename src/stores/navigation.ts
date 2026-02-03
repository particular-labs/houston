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
  | "settings";

export type DetailContext =
  | { type: "project-group"; groupName: string; label: string }
  | { type: "monorepo-detail"; rootPath: string; label: string; parentGroupName: string }
  | { type: "tool-detail"; toolName: string; label: string };

interface NavigationState {
  activeSection: Section;
  commandPaletteOpen: boolean;
  detailContext: DetailContext | null;
  setActiveSection: (section: Section) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setDetailContext: (ctx: DetailContext | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSection: "dashboard",
  commandPaletteOpen: false,
  detailContext: null,
  setActiveSection: (section) => set({ activeSection: section, detailContext: null }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setDetailContext: (ctx) => set({ detailContext: ctx }),
}));
