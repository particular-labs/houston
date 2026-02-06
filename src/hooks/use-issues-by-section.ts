import { useMemo } from "react";
import { useDiagnostics } from "./use-diagnostics";
import { categoryToSection, sectionLabels } from "@/lib/issue-mapping";
import type { Section } from "@/stores/navigation";
import type { DiagnosticItem } from "@/lib/commands";

export interface SectionIssues {
  section: Section;
  label: string;
  items: DiagnosticItem[];
  maxSeverity: "error" | "warning" | "info" | "suggestion";
  count: number;
}

const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 };

export function useIssuesBySection() {
  const { data: report, isLoading, refetch } = useDiagnostics();

  const issuesBySection = useMemo(() => {
    if (!report) return new Map<Section, SectionIssues>();

    const grouped = new Map<Section, DiagnosticItem[]>();
    for (const item of report.items) {
      const section = categoryToSection[item.category] ?? "system";
      const existing = grouped.get(section) ?? [];
      existing.push(item);
      grouped.set(section, existing);
    }

    const result = new Map<Section, SectionIssues>();
    for (const [section, items] of grouped) {
      items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      const maxSeverity = items.length > 0 ? items[0].severity : "info";
      result.set(section, {
        section,
        label: sectionLabels[section],
        items,
        maxSeverity,
        count: items.length,
      });
    }
    return result;
  }, [report]);

  const totalCount = report?.items.length ?? 0;

  return { issuesBySection, totalCount, isLoading, refetch };
}
