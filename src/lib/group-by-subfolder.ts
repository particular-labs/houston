import type { ProjectInfo } from "@/lib/commands";

/**
 * Groups projects by their first path segment relative to a root path.
 * Returns sorted [category, projects][] entries.
 */
export function groupBySubfolder(
  projects: ProjectInfo[],
  rootPath: string,
): [string, ProjectInfo[]][] {
  const categoryMap = new Map<string, ProjectInfo[]>();

  for (const project of projects) {
    let relative = project.path;
    if (relative.startsWith(rootPath)) {
      relative = relative.slice(rootPath.length);
      if (relative.startsWith("/") || relative.startsWith("\\")) {
        relative = relative.slice(1);
      }
    }

    const sep = relative.indexOf("/");
    const backSep = relative.indexOf("\\");
    let firstSeg: string;
    if (sep === -1 && backSep === -1) {
      firstSeg = relative;
    } else if (sep === -1) {
      firstSeg = relative.slice(0, backSep);
    } else if (backSep === -1) {
      firstSeg = relative.slice(0, sep);
    } else {
      firstSeg = relative.slice(0, Math.min(sep, backSep));
    }

    const category = firstSeg || "root";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(project);
  }

  return Array.from(categoryMap.entries()).sort((a, b) =>
    a[0].toLowerCase().localeCompare(b[0].toLowerCase()),
  );
}
