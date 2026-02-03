import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: commands.getLanguages,
    staleTime: 120_000,
  });
}
