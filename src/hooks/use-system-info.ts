import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useSystemInfo() {
  return useQuery({
    queryKey: ["system-info"],
    queryFn: commands.getSystemInfo,
    staleTime: 300_000,
  });
}
