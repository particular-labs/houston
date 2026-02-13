import { describe, test, expect } from "vitest";
import { filterToolsByCategory, getToolLabel } from "../tool-filters";
import type { AiToolInfo } from "../commands";

const makeTool = (
  overrides: Partial<AiToolInfo> & Pick<AiToolInfo, "name" | "categories">
): AiToolInfo => ({
  binary: "",
  installed: true,
  version: null,
  latest_version: null,
  update_available: false,
  install_method: "self_managed",
  package_name: "",
  binary_path: null,
  install_hint: "",
  tool_type: "app",
  app_name: null,
  app_installed: false,
  app_path: null,
  app_version: null,
  config_dir: null,
  has_ai: false,
  ai_features: [],
  ...overrides,
});

const sampleTools: AiToolInfo[] = [
  makeTool({ name: "Terminal", categories: ["terminal"] }),
  makeTool({ name: "iTerm2", categories: ["terminal"] }),
  makeTool({ name: "Warp", categories: ["terminal"] }),
  makeTool({ name: "VS Code", categories: ["editor"] }),
  makeTool({ name: "Cursor", categories: ["editor", "ai_tool"] }),
  makeTool({ name: "Windsurf", categories: ["editor", "ai_tool"] }),
  makeTool({ name: "Claude Code", categories: ["ai_tool"] }),
  makeTool({ name: "Aider", categories: ["ai_tool"], installed: false }),
  makeTool({ name: "Zed", categories: ["editor"], installed: false }),
];

describe("filterToolsByCategory", () => {
  test("returns only installed terminals", () => {
    const result = filterToolsByCategory(sampleTools, "terminal");
    expect(result.map((t) => t.name)).toEqual(["Terminal", "iTerm2", "Warp"]);
  });

  test("returns only installed editors", () => {
    const result = filterToolsByCategory(sampleTools, "editor");
    expect(result.map((t) => t.name)).toEqual(["VS Code", "Cursor", "Windsurf"]);
  });

  test("returns only installed AI tools", () => {
    const result = filterToolsByCategory(sampleTools, "ai_tool");
    expect(result.map((t) => t.name)).toEqual(["Cursor", "Windsurf", "Claude Code"]);
  });

  test("excludes uninstalled tools", () => {
    const result = filterToolsByCategory(sampleTools, "editor");
    expect(result.find((t) => t.name === "Zed")).toBeUndefined();
  });

  test("includes tools with multiple categories in each relevant category", () => {
    const editors = filterToolsByCategory(sampleTools, "editor");
    const aiTools = filterToolsByCategory(sampleTools, "ai_tool");
    // Cursor has both "editor" and "ai_tool"
    expect(editors.find((t) => t.name === "Cursor")).toBeDefined();
    expect(aiTools.find((t) => t.name === "Cursor")).toBeDefined();
  });

  test("returns empty array for undefined tools", () => {
    expect(filterToolsByCategory(undefined, "terminal")).toEqual([]);
  });

  test("returns empty array when no tools match category", () => {
    const tools = [makeTool({ name: "Claude Code", categories: ["ai_tool"] })];
    expect(filterToolsByCategory(tools, "terminal")).toEqual([]);
  });

  test("returns empty array when all matching tools are uninstalled", () => {
    const tools = [
      makeTool({ name: "Aider", categories: ["ai_tool"], installed: false }),
      makeTool({ name: "Gemini CLI", categories: ["ai_tool"], installed: false }),
    ];
    expect(filterToolsByCategory(tools, "ai_tool")).toEqual([]);
  });
});

describe("getToolLabel", () => {
  test("returns fallback for 'auto'", () => {
    expect(getToolLabel("auto", "AI Tool")).toBe("AI Tool");
  });

  test("returns fallback for undefined", () => {
    expect(getToolLabel(undefined, "Terminal")).toBe("Terminal");
  });

  test("returns fallback for empty string", () => {
    expect(getToolLabel("", "Editor")).toBe("Editor");
  });

  test("returns tool name when set", () => {
    expect(getToolLabel("Warp", "Terminal")).toBe("Warp");
  });

  test("returns tool name for multi-word names", () => {
    expect(getToolLabel("Claude Code", "AI Tool")).toBe("Claude Code");
  });
});
