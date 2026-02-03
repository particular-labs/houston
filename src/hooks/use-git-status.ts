import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useGitStatus(projectPath: string) {
  return useQuery({
    queryKey: ["git-status", projectPath],
    queryFn: () => commands.getGitStatus(projectPath),
    staleTime: 30_000,
    enabled: !!projectPath,
  });
}

export function useAllGitStatuses() {
  return useQuery({
    queryKey: ["all-git-statuses"],
    queryFn: commands.getAllGitStatuses,
    staleTime: 30_000,
  });
}
