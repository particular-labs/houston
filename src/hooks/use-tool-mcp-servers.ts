import { useQuery } from "@tanstack/react-query";
import { commands } from "@/lib/commands";
import type { McpServer } from "@/lib/commands";

export function useToolMcpServers(toolName: string | null) {
  return useQuery<McpServer[]>({
    queryKey: ["tool-mcp-servers", toolName],
    queryFn: () => commands.getToolMcpServers(toolName!),
    enabled: !!toolName,
    staleTime: 30_000,
  });
}
