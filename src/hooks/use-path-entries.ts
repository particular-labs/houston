import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function usePathEntries() {
  return useSmartQuery({
    queryKey: ["path-entries"],
    queryFn: commands.getPathEntries,
    activeStaleTime: 3_600_000,
    hiddenStaleTime: Infinity,
  });
}
