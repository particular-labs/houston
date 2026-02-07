import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useSystemInfo() {
  return useSmartQuery({
    queryKey: ["system-info"],
    queryFn: commands.getSystemInfo,
    activeStaleTime: 3_600_000,
    hiddenStaleTime: Infinity,
  });
}
