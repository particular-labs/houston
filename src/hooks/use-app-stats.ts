import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useAppStats() {
  return useSmartQuery({
    queryKey: ["app-stats"],
    queryFn: commands.getAppStats,
    activeInterval: 10_000,
    hiddenInterval: false,
    deepIdleInterval: false,
    activeStaleTime: 5_000,
    hiddenStaleTime: Infinity,
  });
}
