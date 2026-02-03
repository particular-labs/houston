import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function usePathEntries() {
  return useQuery({
    queryKey: ["path-entries"],
    queryFn: commands.getPathEntries,
    staleTime: 60_000,
  });
}
