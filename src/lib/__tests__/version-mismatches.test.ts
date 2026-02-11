import { describe, test, expect } from "vitest";
import {
  computeProjectMismatches,
  computeAllMismatches,
} from "../version-mismatches";
import type { VersionFile, LanguageInfo } from "../commands";

const makeLang = (name: string, version: string, installed = true): LanguageInfo => ({
  name,
  version,
  binary_path: "",
  manager: "",
  installed,
  icon: "",
});

const makeVf = (name: string, expected: string, language: string): VersionFile => ({
  name,
  expected_version: expected,
  language,
});

describe("computeProjectMismatches", () => {
  test("matches when system version includes expected", () => {
    const result = computeProjectMismatches(
      [makeVf(".nvmrc", "20", "node")],
      [makeLang("Node.js", "20.11.0")],
    );
    expect(result).toHaveLength(1);
    expect(result[0].matches).toBe(true);
    expect(result[0].systemVersion).toBe("20.11.0");
  });

  test("detects mismatch when versions differ", () => {
    const result = computeProjectMismatches(
      [makeVf(".nvmrc", "18", "node")],
      [makeLang("Node.js", "20.11.0")],
    );
    expect(result).toHaveLength(1);
    expect(result[0].matches).toBe(false);
  });

  test("handles not installed language", () => {
    const result = computeProjectMismatches(
      [makeVf(".ruby-version", "3.2", "ruby")],
      [makeLang("Node.js", "20.11.0")],
    );
    expect(result).toHaveLength(1);
    expect(result[0].matches).toBe(false);
    expect(result[0].systemVersion).toBe("not installed");
  });

  test("returns empty for no version files", () => {
    const result = computeProjectMismatches([], [makeLang("Node.js", "20.11.0")]);
    expect(result).toHaveLength(0);
  });
});

describe("computeAllMismatches", () => {
  test("counts total mismatched projects correctly", () => {
    const projects = [
      { path: "/a", version_files: [makeVf(".nvmrc", "18", "node")] },
      { path: "/b", version_files: [makeVf(".nvmrc", "20", "node")] },
      { path: "/c", version_files: [] },
    ];
    const languages = [makeLang("Node.js", "20.11.0")];
    const result = computeAllMismatches(projects, languages);
    expect(result.totalCount).toBe(1); // only /a mismatches
    expect(result.byProject.get("/a")?.hasMismatch).toBe(true);
    expect(result.byProject.get("/b")?.hasMismatch).toBe(false);
    expect(result.byProject.has("/c")).toBe(false); // skipped — no version files
  });

  test("returns empty when inputs are undefined", () => {
    const result = computeAllMismatches(undefined, undefined);
    expect(result.totalCount).toBe(0);
    expect(result.byProject.size).toBe(0);
  });
});
