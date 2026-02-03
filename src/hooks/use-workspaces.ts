import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import { useWorkspaceStore } from "@/stores/workspaces";

const WORKSPACE_PATHS_KEY = "houston:workspace-paths";

function loadPersistedPaths(): string[] {
  try {
    const raw = localStorage.getItem(WORKSPACE_PATHS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPaths(paths: string[]): void {
  try {
    localStorage.setItem(WORKSPACE_PATHS_KEY, JSON.stringify(paths));
  } catch {
    // Silently ignore storage errors
  }
}

export function useHydrateWorkspaces() {
  const queryClient = useQueryClient();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const paths = loadPersistedPaths();
    if (paths.length === 0) return;

    (async () => {
      for (const path of paths) {
        try {
          await commands.addWorkspace(path);
        } catch {
          // Path may no longer exist -- skip
        }
      }
      queryClient.invalidateQueries({ queryKey: ["workspace-paths"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    })();
  }, [queryClient]);
}

export function useWorkspacePaths() {
  const setPaths = useWorkspaceStore((s) => s.setPaths);
  return useQuery({
    queryKey: ["workspace-paths"],
    queryFn: async () => {
      const paths = await commands.getWorkspacePaths();
      setPaths(paths);
      persistPaths(paths);
      return paths;
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: commands.scanProjects,
    staleTime: 60_000,
  });
}

export function useAddWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commands.addWorkspace,
    onSuccess: (updatedPaths) => {
      persistPaths(updatedPaths);
      queryClient.invalidateQueries({ queryKey: ["workspace-paths"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-git-statuses"] });
    },
  });
}

export function useRemoveWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commands.removeWorkspace,
    onSuccess: (updatedPaths) => {
      persistPaths(updatedPaths);
      queryClient.invalidateQueries({ queryKey: ["workspace-paths"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-git-statuses"] });
    },
  });
}
