import { describe, test, expect } from "vitest";
import { aggregatePorts } from "../port-map";
import type { DevServerReport, DockerStatus } from "../commands";

const makeDevReport = (
  servers: { port: number; project_path: string; framework?: string }[],
): DevServerReport => ({
  servers: servers.map((s) => ({
    pid: 1,
    port: s.port,
    process_name: "node",
    framework: s.framework ?? null,
    project_path: s.project_path,
    uptime_secs: 100,
  })),
  scanned_at: "",
});

const makeDockerStatus = (
  containers: { name: string; host_port: number }[],
): DockerStatus => ({
  available: true,
  version: "27.0.0",
  containers: containers.map((c) => ({
    id: "abc",
    name: c.name,
    image: "test",
    status: "running",
    state_detail: "Up",
    created: "",
    ports: [{ host_port: c.host_port, container_port: c.host_port, protocol: "tcp" }],
    cpu_percent: 0,
    memory_bytes: 0,
    memory_limit: 0,
    service_name: "",
    category: "",
    icon: "",
    compose_project: null,
    compose_service: null,
  })),
  compose_projects: [],
  total_running: containers.length,
  total_stopped: 0,
  scanned_at: "",
});

describe("aggregatePorts", () => {
  test("aggregates dev server ports", () => {
    const result = aggregatePorts(
      makeDevReport([{ port: 3000, project_path: "/app", framework: "Next.js" }]),
      null,
    );
    expect(result.totalPorts).toBe(1);
    expect(result.entries[0].port).toBe(3000);
    expect(result.entries[0].type).toBe("dev-server");
    expect(result.entries[0].framework).toBe("Next.js");
  });

  test("aggregates docker ports", () => {
    const result = aggregatePorts(
      null,
      makeDockerStatus([{ name: "postgres", host_port: 5432 }]),
    );
    expect(result.totalPorts).toBe(1);
    expect(result.entries[0].port).toBe(5432);
    expect(result.entries[0].type).toBe("docker");
  });

  test("detects port conflicts", () => {
    const result = aggregatePorts(
      makeDevReport([{ port: 3000, project_path: "/app" }]),
      makeDockerStatus([{ name: "api", host_port: 3000 }]),
    );
    expect(result.totalPorts).toBe(2);
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toEqual([3000]);
  });

  test("returns empty when no ports active", () => {
    const result = aggregatePorts(null, null);
    expect(result.totalPorts).toBe(0);
    expect(result.entries).toHaveLength(0);
    expect(result.hasConflicts).toBe(false);
  });

  test("sorts entries by port number", () => {
    const result = aggregatePorts(
      makeDevReport([
        { port: 8080, project_path: "/b" },
        { port: 3000, project_path: "/a" },
      ]),
      makeDockerStatus([{ name: "db", host_port: 5432 }]),
    );
    expect(result.entries.map((e) => e.port)).toEqual([3000, 5432, 8080]);
  });
});
