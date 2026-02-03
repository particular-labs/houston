import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useClaudeConfig() {
  return useQuery({
    queryKey: ["claude-config"],
    queryFn: commands.getClaudeConfig,
    staleTime: 300_000,
  });
}
