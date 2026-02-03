import { useCallback, useState } from "react";

export function useCollapsibleSections() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (key: string) => !collapsed.has(key),
    [collapsed],
  );

  return { toggle, isExpanded };
}
