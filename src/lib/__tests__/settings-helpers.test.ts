import { describe, test, expect } from "vitest";
import { getSettingValue } from "@/hooks/use-settings";
import type { SettingPair } from "../commands";

const settings: SettingPair[] = [
  { key: "theme", value: "dark" },
  { key: "default_terminal", value: "Warp" },
  { key: "default_editor", value: "auto" },
  { key: "default_ai_tool", value: "Claude Code" },
  { key: "auto_scan_on_startup", value: "true" },
  { key: "snarky_comments", value: "false" },
];

describe("getSettingValue", () => {
  test("returns value for existing key", () => {
    expect(getSettingValue(settings, "theme")).toBe("dark");
  });

  test("returns default_terminal setting", () => {
    expect(getSettingValue(settings, "default_terminal")).toBe("Warp");
  });

  test("returns default_ai_tool setting", () => {
    expect(getSettingValue(settings, "default_ai_tool")).toBe("Claude Code");
  });

  test("returns default value for missing key", () => {
    expect(getSettingValue(settings, "nonexistent", "fallback")).toBe("fallback");
  });

  test("returns empty string default when key missing and no default provided", () => {
    expect(getSettingValue(settings, "nonexistent")).toBe("");
  });

  test("returns default value for undefined settings array", () => {
    expect(getSettingValue(undefined, "theme", "light")).toBe("light");
  });

  test("returns actual value even when default is provided", () => {
    expect(getSettingValue(settings, "theme", "light")).toBe("dark");
  });

  test("handles boolean-like string values", () => {
    expect(getSettingValue(settings, "auto_scan_on_startup", "false")).toBe("true");
    expect(getSettingValue(settings, "snarky_comments", "true")).toBe("false");
  });
});
