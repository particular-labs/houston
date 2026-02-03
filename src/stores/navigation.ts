import { create } from "zustand";

export type Section =
  | "dashboard"
  | "system"
  | "path"
  | "languages"
  | "environment"
  | "workspaces"
  | "packages"
  | "tools";

interface NavigationState {
  activeSection: Section;
  commandPaletteOpen: boolean;
  setActiveSection: (section: Section) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSection: "dashboard",
  commandPaletteOpen: false,
  setActiveSection: (section) => set({ activeSection: section }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
}));
