import { create } from "zustand";

interface WorkspaceState {
  paths: string[];
  setPaths: (paths: string[]) => void;
  addPath: (path: string) => void;
  removePath: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  paths: [],
  setPaths: (paths) => set({ paths }),
  addPath: (path) =>
    set((state) => ({
      paths: state.paths.includes(path) ? state.paths : [...state.paths, path],
    })),
  removePath: (path) =>
    set((state) => ({
      paths: state.paths.filter((p) => p !== path),
    })),
}));
