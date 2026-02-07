import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useDiagnostics() {
  return useSmartQuery({
    queryKey: ["diagnostics"],
    queryFn: commands.getDiagnostics,
    activeStaleTime: 600_000,
    hiddenStaleTime: Infinity,
  });
}
