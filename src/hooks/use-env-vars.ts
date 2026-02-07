import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useEnvVars() {
  return useSmartQuery({
    queryKey: ["env-vars"],
    queryFn: commands.getEnvVars,
    activeStaleTime: 3_600_000,
    hiddenStaleTime: Infinity,
  });
}
