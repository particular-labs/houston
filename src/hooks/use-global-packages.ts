import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useGlobalPackages() {
  return useSmartQuery({
    queryKey: ["global-packages"],
    queryFn: commands.getPackages,
    activeStaleTime: 600_000,
    hiddenStaleTime: Infinity,
  });
}
