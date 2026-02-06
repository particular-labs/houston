import { useState, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  Wrench,
  MessageSquareQuote,
} from "lucide-react";
import { useIssuesBySection, type SectionIssues } from "@/hooks/use-issues-by-section";
import { useSettings, getSettingValue } from "@/hooks/use-settings";
import { getSnarkyComment, sectionLabels } from "@/lib/issue-mapping";
import { commands, type DiagnosticItem } from "@/lib/commands";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusDot } from "@/components/shared/status-dot";
import { useNavigationStore, type Section } from "@/stores/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const severityIcon: Record<string, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  suggestion: Lightbulb,
};

const severityStatus: Record<string, "error" | "warning" | "info" | "neutral"> = {
  error: "error",
  warning: "warning",
  info: "info",
  suggestion: "neutral",
};

const severityBorder: Record<string, string> = {
  error: "border-destructive/25",
  warning: "border-warning/25",
  info: "border-primary/25",
  suggestion: "border-muted-foreground/25",
};

const severityBg: Record<string, string> = {
  error: "bg-destructive/5",
  warning: "bg-warning/5",
  info: "bg-primary/5",
  suggestion: "bg-muted/50",
};

const severityText: Record<string, string> = {
  error: "text-destructive",
  warning: "text-warning",
  info: "text-primary",
  suggestion: "text-muted-foreground",
};

function IssueCard({
  item,
  isFixing,
  onFix,
}: {
  item: DiagnosticItem;
  isFixing: boolean;
  onFix: (fixId: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex items-start gap-2 py-1.5">
      <StatusDot status={severityStatus[item.severity] ?? "neutral"} className="mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{item.title}</span>
          {item.details && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              {showDetails ? "hide" : "details"}
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{item.description}</p>
        {showDetails && item.details && (
          <pre className="mt-1 rounded bg-muted/50 p-1.5 font-mono text-[10px] text-muted-foreground overflow-x-auto">
            {item.details}
          </pre>
        )}
      </div>
      {item.fix_id && item.fix_label && (
        <button
          onClick={() => onFix(item.fix_id!)}
          disabled={isFixing}
          className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {isFixing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            item.fix_label
          )}
        </button>
      )}
    </div>
  );
}

function SectionGroup({
  sectionIssues,
  snarkyEnabled,
  fixingIds,
  onFix,
  onNavigate,
  defaultExpanded = false,
}: {
  sectionIssues: SectionIssues;
  snarkyEnabled: boolean;
  fixingIds: Set<string>;
  onFix: (fixId: string) => void;
  onNavigate: (section: Section) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const TopIcon = severityIcon[sectionIssues.maxSeverity] ?? Info;
  const fixableItems = sectionIssues.items.filter((i) => i.fix_id);

  // Generate snarky comment for the most common category in this section
  const snarkyComment = useMemo(() => {
    if (!snarkyEnabled) return null;
    // Find the most common category in this section's items
    const categoryCounts = new Map<string, number>();
    for (const item of sectionIssues.items) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
    }
    let topCategory = "";
    let topCount = 0;
    for (const [cat, count] of categoryCounts) {
      if (count > topCount) {
        topCategory = cat;
        topCount = count;
      }
    }
    return getSnarkyComment(topCategory);
  }, [sectionIssues.items, snarkyEnabled]);

  const handleFixAll = async () => {
    for (const item of fixableItems) {
      if (item.fix_id && !fixingIds.has(item.fix_id)) {
        onFix(item.fix_id);
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        severityBorder[sectionIssues.maxSeverity],
        severityBg[sectionIssues.maxSeverity]
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2"
        >
          <TopIcon className={cn("h-4 w-4", severityText[sectionIssues.maxSeverity])} />
          <span className={cn("text-sm font-medium", severityText[sectionIssues.maxSeverity])}>
            {sectionIssues.label}
          </span>
          <span className="rounded-full bg-background/50 px-1.5 text-[10px] font-medium text-muted-foreground">
            {sectionIssues.count}
          </span>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {fixableItems.length > 1 && (
            <button
              onClick={handleFixAll}
              className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-accent"
            >
              <Wrench className="h-3 w-3" />
              Fix all
            </button>
          )}
          <button
            onClick={() => onNavigate(sectionIssues.section)}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Go to section
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Snarky comment */}
      {snarkyComment && expanded && (
        <div className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground/80 italic">
          <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {snarkyComment}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 space-y-0.5 border-t border-border/50 pt-2">
          {sectionIssues.items.map((item) => (
            <IssueCard
              key={item.id}
              item={item}
              isFixing={fixingIds.has(item.fix_id ?? "")}
              onFix={onFix}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="rounded-full bg-success/10 p-4">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h3 className="mt-4 text-lg font-medium">All Clear!</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        No issues detected in your development environment.
      </p>
    </div>
  );
}

export function IssuesSection() {
  const { issuesBySection, totalCount, isLoading, refetch } = useIssuesBySection();
  const { data: settings } = useSettings();
  const snarkyEnabled = getSettingValue(settings, "snarky_comments", "true") === "true";
  const setSection = useNavigationStore((s) => s.setActiveSection);
  const issuesExpandedSection = useNavigationStore((s) => s.issuesExpandedSection);
  const queryClient = useQueryClient();
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());

  const handleFix = async (fixId: string) => {
    setFixingIds((prev) => new Set(prev).add(fixId));
    try {
      const result = await commands.runDiagnosticFix(fixId);
      if (!result.success) {
        console.error("Fix failed:", result.message, result.output);
      }
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
    } catch (e) {
      console.error("Fix error:", e);
    } finally {
      setFixingIds((prev) => {
        const next = new Set(prev);
        next.delete(fixId);
        return next;
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Sort sections by severity (errors first)
  const sortedSections = useMemo(() => {
    const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 };
    return Array.from(issuesBySection.values()).sort(
      (a, b) => severityOrder[a.maxSeverity] - severityOrder[b.maxSeverity]
    );
  }, [issuesBySection]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Issues"
        description={
          totalCount > 0
            ? `${totalCount} issue${totalCount !== 1 ? "s" : ""} found across your environment`
            : "Monitor and resolve environment issues"
        }
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      {totalCount === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {sortedSections.map((sectionIssues) => (
            <SectionGroup
              key={sectionIssues.section}
              sectionIssues={sectionIssues}
              snarkyEnabled={snarkyEnabled}
              fixingIds={fixingIds}
              onFix={handleFix}
              onNavigate={setSection}
              defaultExpanded={
                issuesExpandedSection === sectionIssues.section ||
                sectionIssues.maxSeverity === "error"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
