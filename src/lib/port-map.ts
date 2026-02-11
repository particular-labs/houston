import type { DevServerReport, DockerStatus } from "./commands";

export interface PortEntry {
  port: number;
  source: string;
  type: "dev-server" | "docker";
  framework?: string;
}

export interface PortMapResult {
  entries: PortEntry[];
  totalPorts: number;
  conflicts: number[];
  hasConflicts: boolean;
}

export function aggregatePorts(
  devServers: DevServerReport | null | undefined,
  dockerStatus: DockerStatus | null | undefined,
): PortMapResult {
  const entries: PortEntry[] = [];
  const portCounts = new Map<number, number>();

  for (const server of devServers?.servers ?? []) {
    if (server.port > 0) {
      entries.push({
        port: server.port,
        source: server.project_path ?? server.process_name,
        type: "dev-server",
        framework: server.framework ?? undefined,
      });
      portCounts.set(server.port, (portCounts.get(server.port) ?? 0) + 1);
    }
  }

  for (const container of dockerStatus?.containers ?? []) {
    for (const p of container.ports) {
      if (p.host_port) {
        entries.push({
          port: p.host_port,
          source: container.name,
          type: "docker",
        });
        portCounts.set(p.host_port, (portCounts.get(p.host_port) ?? 0) + 1);
      }
    }
  }

  const conflicts = [...portCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([port]) => port);

  return {
    entries: entries.sort((a, b) => a.port - b.port),
    totalPorts: entries.length,
    conflicts,
    hasConflicts: conflicts.length > 0,
  };
}
