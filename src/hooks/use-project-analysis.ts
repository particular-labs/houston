import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useProjectAnalysis(projectPath: string | null) {
  return useQuery({
    queryKey: ["project-analysis", projectPath],
    queryFn: () => commands.analyzeProject(projectPath!),
    enabled: !!projectPath,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
