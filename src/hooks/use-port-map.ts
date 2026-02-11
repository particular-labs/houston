import { useMemo } from "react";
import { useDevServers } from "./use-dev-servers";
import { useDockerStatusCached } from "./use-docker";
import { aggregatePorts } from "@/lib/port-map";

export function usePortMap() {
  const { data: devServers } = useDevServers();
  const { data: dockerStatus } = useDockerStatusCached();
  return useMemo(
    () => aggregatePorts(devServers, dockerStatus),
    [devServers, dockerStatus],
  );
}
