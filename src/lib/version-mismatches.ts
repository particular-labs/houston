import type { VersionFile, LanguageInfo } from "./commands";

export interface VersionMismatchInfo {
  file: VersionFile;
  systemVersion: string;
  matches: boolean;
}

export interface ProjectMismatches {
  projectPath: string;
  mismatches: VersionMismatchInfo[];
  hasMismatch: boolean;
}

export function computeProjectMismatches(
  versionFiles: VersionFile[],
  languages: LanguageInfo[],
): VersionMismatchInfo[] {
  return versionFiles.map((vf) => {
    const lang = languages.find((l) =>
      l.name.toLowerCase().includes(vf.language),
    );
    const systemVersion = lang?.version || "not installed";
    const matches = !!lang?.installed && systemVersion.includes(vf.expected_version);
    return { file: vf, systemVersion, matches };
  });
}

export interface AllMismatchesResult {
  byProject: Map<string, ProjectMismatches>;
  totalCount: number;
}

export function computeAllMismatches(
  projects: { path: string; version_files: VersionFile[] }[] | undefined,
  languages: LanguageInfo[] | undefined,
): AllMismatchesResult {
  if (!projects || !languages) return { byProject: new Map(), totalCount: 0 };

  const byProject = new Map<string, ProjectMismatches>();
  let totalCount = 0;

  for (const project of projects) {
    if (!project.version_files?.length) continue;
    const mismatches = computeProjectMismatches(project.version_files, languages);
    const hasMismatch = mismatches.some((m) => !m.matches);
    if (hasMismatch) totalCount++;
    byProject.set(project.path, {
      projectPath: project.path,
      mismatches,
      hasMismatch,
    });
  }

  return { byProject, totalCount };
}
