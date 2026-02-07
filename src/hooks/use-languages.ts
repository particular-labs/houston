import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useLanguages() {
  return useSmartQuery({
    queryKey: ["languages"],
    queryFn: commands.getLanguages,
    activeStaleTime: 600_000,
    hiddenStaleTime: Infinity,
  });
}
