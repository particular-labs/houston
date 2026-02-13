import type { AiToolInfo, SettingPair } from "./commands";

export type ToolCategory = "terminal" | "editor" | "ai_tool";

/**
 * Filter installed tools by category.
 */
export function filterToolsByCategory(
  tools: AiToolInfo[] | undefined,
  category: ToolCategory
): AiToolInfo[] {
  if (!tools) return [];
  return tools.filter((t) => t.installed && t.categories.includes(category));
}

/**
 * Derive a display label for a tool setting.
 * Returns the tool name if set, or the fallback label if "auto" or empty.
 */
export function getToolLabel(
  settingValue: string | undefined,
  fallbackLabel: string
): string {
  if (!settingValue || settingValue === "auto") return fallbackLabel;
  return settingValue;
}
