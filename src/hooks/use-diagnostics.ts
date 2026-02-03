import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useDiagnostics() {
  return useQuery({
    queryKey: ["diagnostics"],
    queryFn: commands.getDiagnostics,
    staleTime: 120_000,
  });
}
