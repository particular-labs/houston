import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useAppStats() {
  return useQuery({
    queryKey: ["app-stats"],
    queryFn: commands.getAppStats,
    refetchInterval: 5000,
  });
}
