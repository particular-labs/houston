import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useGlobalPackages() {
  return useQuery({
    queryKey: ["global-packages"],
    queryFn: commands.getPackages,
    staleTime: 300_000,
  });
}
