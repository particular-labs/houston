import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useDockerStatus() {
  return useSmartQuery({
    queryKey: ["docker-status"],
    queryFn: commands.getDockerStatus,
    activeStaleTime: 10_000,
    hiddenStaleTime: 60_000,
    activeInterval: 15_000,
    hiddenInterval: 60_000,
    deepIdleInterval: false,
  });
}

/** Read-only cache access for sidebar — does NOT trigger refetching */
export function useDockerStatusCached() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["docker-status"],
    queryFn: commands.getDockerStatus,
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    initialData: () => queryClient.getQueryData(["docker-status"]),
  });
}

export function useContainerActions() {
  const queryClient = useQueryClient();

  const startContainer = useMutation({
    mutationFn: commands.startDockerContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-status"] });
    },
  });

  const stopContainer = useMutation({
    mutationFn: commands.stopDockerContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-status"] });
    },
  });

  const restartContainer = useMutation({
    mutationFn: commands.restartDockerContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-status"] });
    },
  });

  return { startContainer, stopContainer, restartContainer };
}

export function useContainerLogs(containerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["container-logs", containerId],
    queryFn: () => commands.getDockerContainerLogs(containerId, 100),
    enabled: enabled && !!containerId,
    staleTime: 5_000,
  });
}
