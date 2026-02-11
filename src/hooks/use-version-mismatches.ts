import { useMemo } from "react";
import { useProjects } from "./use-workspaces";
import { useLanguages } from "./use-languages";
import { computeAllMismatches } from "@/lib/version-mismatches";

export function useVersionMismatches() {
  const { data: projects } = useProjects();
  const { data: languages } = useLanguages();
  return useMemo(
    () => computeAllMismatches(projects, languages),
    [projects, languages],
  );
}
