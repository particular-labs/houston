import { useEffect } from "react";
import { useSetting } from "./use-settings";

export type Theme = "dark" | "light";

export function useTheme() {
  const { data: theme, isLoading } = useSetting("theme");

  useEffect(() => {
    if (isLoading) return;

    const effectiveTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [theme, isLoading]);

  return {
    theme: (theme === "light" ? "light" : "dark") as Theme,
    isLoading,
  };
}
