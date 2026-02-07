import { commands } from "@/lib/commands";
import { useSmartQuery } from "./use-smart-query";

export function useIssueCount() {
  const { data: count = 0, ...rest } = useSmartQuery({
    queryKey: ["issue-count"],
    queryFn: commands.getIssueCount,
    activeStaleTime: 120_000,
    hiddenStaleTime: 600_000,
    activeInterval: 120_000,
    hiddenInterval: false,
    deepIdleInterval: false,
  });

  return { count, ...rest };
}
