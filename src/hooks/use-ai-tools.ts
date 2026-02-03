import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useAiTools() {
  return useQuery({
    queryKey: ["ai-tools"],
    queryFn: commands.getAiTools,
    staleTime: 120_000,
  });
}
