import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import { useWorkspaceStore } from "@/stores/workspaces";
import { useSmartQuery } from "./use-smart-query";

export function useWorkspacePaths() {
  const setPaths = useWorkspaceStore((s) => s.setPaths);
  return useQuery({
    queryKey: ["workspace-paths"],
    queryFn: async () => {
      const paths = await commands.getWorkspacePaths();
      setPaths(paths);
      return paths;
    },
  });
}

export function useProjects() {
  return useSmartQuery({
    queryKey: ["projects"],
    queryFn: commands.scanProjects,
    activeStaleTime: 300_000,
    hiddenStaleTime: Infinity,
  });
}

export function useAddWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commands.addWorkspace,
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-paths"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-git-statuses"] });
    },
  });
}
