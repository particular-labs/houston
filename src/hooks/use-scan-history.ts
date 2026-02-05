import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useScanHistory(scanner: string, limit?: number) {
  return useQuery({
    queryKey: ["scan-history", scanner, limit],
    queryFn: () => commands.getScanHistory(scanner, limit),
    staleTime: 30_000,
  });
}

export function useLatestScan(scanner: string) {
  return useQuery({
    queryKey: ["latest-scan", scanner],
    queryFn: () => commands.getLatestScan(scanner),
    staleTime: 30_000,
  });
}
