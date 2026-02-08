import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import { useWorkspaceStore } from "@/stores/workspaces";
import { useSmartQuery } from "./use-smart-query";
import { toast } from "sonner";

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
      toast.success("Workspace added — scanning...");
      queryClient.invalidateQueries({ queryKey: ["workspace-paths"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-git-statuses"] });
    },
    onError: () => {
      toast.error("Failed to add workspace");
    },
  });
}

export function useRemoveWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commands.removeWorkspace,
    onSuccess: () => {
      toast.success("Workspace removed");
      queryClient.invalidateQueries({ queryKey: ["workspace-paths"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["all-git-statuses"] });
    },
    onError: () => {
      toast.error("Failed to remove workspace");
    },
  });
}
