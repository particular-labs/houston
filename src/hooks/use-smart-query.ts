import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useVisibility } from "./use-visibility";

interface SmartQueryOptions<T> extends Omit<UseQueryOptions<T>, "refetchInterval" | "staleTime"> {
  /** Refetch interval when app is visible and active (ms). Set to false/0 to disable. */
  activeInterval?: number | false;
  /** Refetch interval when app is hidden < 5 min (ms). Set to false/0 to disable. */
  hiddenInterval?: number | false;
  /** Refetch interval when app is hidden > 5 min (ms). Set to false/0 to disable. */
  deepIdleInterval?: number | false;
  /** staleTime when app is visible (ms). */
  activeStaleTime?: number;
  /** staleTime when app is hidden (ms). */
  hiddenStaleTime?: number;
}

export function useSmartQuery<T>(options: SmartQueryOptions<T>) {
  const { isVisible, idleMinutes } = useVisibility();

  const {
    activeInterval = false,
    hiddenInterval = false,
    deepIdleInterval = false,
    activeStaleTime,
    hiddenStaleTime,
    ...queryOptions
  } = options;

  // Determine effective refetchInterval
  let refetchInterval: number | false = false;
  if (isVisible) {
    refetchInterval = activeInterval || false;
  } else if (idleMinutes < 5) {
    refetchInterval = hiddenInterval || false;
  } else {
    refetchInterval = deepIdleInterval || false;
  }

  // Determine effective staleTime
  const staleTime = isVisible
    ? (activeStaleTime ?? Infinity)
    : (hiddenStaleTime ?? Infinity);

  return useQuery({
    ...queryOptions,
    staleTime,
    refetchInterval,
  } as UseQueryOptions<T>);
}
