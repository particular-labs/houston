import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useAiTools() {
  return useSmartQuery({
    queryKey: ["ai-tools"],
    queryFn: commands.getAiTools,
    activeStaleTime: 600_000,
    hiddenStaleTime: Infinity,
  });
}
