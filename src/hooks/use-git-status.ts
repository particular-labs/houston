import { commands } from "@/lib/commands";
import { useProjects } from "@/hooks/use-workspaces";
import { useSmartQuery } from "./use-smart-query";

export function useGitStatus(projectPath: string) {
  return useSmartQuery({
    queryKey: ["git-status", projectPath],
    queryFn: () => commands.getGitStatus(projectPath),
    activeStaleTime: 60_000,
    hiddenStaleTime: Infinity,
    enabled: !!projectPath,
  });
}

export function useAllGitStatuses() {
  const { data: projects } = useProjects();
  const hasGitProjects = (projects ?? []).some((p) => p.has_git);

  return useSmartQuery({
    queryKey: ["all-git-statuses"],
    queryFn: commands.getAllGitStatuses,
    activeStaleTime: 60_000,
    hiddenStaleTime: Infinity,
    enabled: hasGitProjects,
  });
}
