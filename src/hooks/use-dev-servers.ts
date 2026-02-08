import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";
import { toast } from "sonner";

export function useDevServers() {
  return useSmartQuery({
    queryKey: ["dev-servers"],
    queryFn: commands.getDevServers,
    activeStaleTime: 15_000,
    hiddenStaleTime: 60_000,
    activeInterval: 15_000,
    hiddenInterval: 60_000,
    deepIdleInterval: false,
  });
}

export function useStopDevServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: number) => commands.stopDevServer(pid),
    onSuccess: () => {
      toast.success("Dev server stopped");
      queryClient.invalidateQueries({ queryKey: ["dev-servers"] });
    },
    onError: () => {
      toast.error("Failed to stop dev server");
    },
  });
}

export function useStartDevServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectPath,
      command,
    }: {
      projectPath: string;
      command?: string;
    }) => commands.startDevServer(projectPath, command),
    onSuccess: (_data, { projectPath }) => {
      toast.success("Starting dev server...");
      queryClient.invalidateQueries({ queryKey: ["dev-servers"] });
    },
    onError: () => {
      toast.error("Failed to start dev server");
    },
  });
}
