import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useEnvVars() {
  return useQuery({
    queryKey: ["env-vars"],
    queryFn: commands.getEnvVars,
    staleTime: 60_000,
  });
}
