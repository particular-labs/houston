import { useState, useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wrench,
} from "lucide-react";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { commands } from "@/lib/commands";
import type { DiagnosticItem } from "@/lib/commands";
import { StatusDot } from "@/components/shared/status-dot";
import { useQueryClient } from "@tanstack/react-query";

interface DiagnosticsBannerProps {
  categories: string[];
}

const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 } as const;

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

function DiagnosticCard({
  item,
  isFixin,
  onFix,
}: {
  item: DiagnosticItem;
  isFixin: boolean;
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
          <pre className="mt-1 rounded bg-muted/50 p-1.5 font-mono text-[10px] text-muted-foreground">
            {item.details}
          </pre>
        )}
      </div>
      {item.fix_id && item.fix_label && (
        <button
          onClick={() => onFix(item.fix_id!)}
          disabled={isFixin}
          className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {isFixin ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            item.fix_label
          )}
        </button>
      )}
    </div>
  );
}

export function DiagnosticsBanner({ categories }: DiagnosticsBannerProps) {
  const { data: report } = useDiagnostics();
  const queryClient = useQueryClient();
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());

  const items = useMemo(() => {
    if (!report) return [];
    return report.items
      .filter((item) => categories.includes(item.category))
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [report, categories]);

  const hasErrors = items.some((i) => i.severity === "error");
  const [expanded, setExpanded] = useState<boolean | null>(null);

  // Auto-expand when errors are present, but let user override
  const isExpanded = expanded ?? hasErrors;

  if (items.length === 0) {
    return null;
  }

  const topSeverity = items[0]?.severity ?? "info";
  const TopIcon = severityIcon[topSeverity] ?? Info;
  const fixableItems = items.filter((i) => i.fix_id);

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

  const handleFixAll = async () => {
    for (const item of fixableItems) {
      if (item.fix_id && !fixingIds.has(item.fix_id)) {
        await handleFix(item.fix_id);
      }
    }
  };

  return (
    <div
      className={`rounded-lg border ${severityBorder[topSeverity]} ${severityBg[topSeverity]} p-3`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!isExpanded)}
        className="flex w-full items-center gap-2"
        aria-expanded={isExpanded}
      >
        <TopIcon className={`h-4 w-4 ${severityText[topSeverity]}`} />
        <span className={`text-xs font-medium ${severityText[topSeverity]}`}>
          {items.length} issue{items.length !== 1 ? "s" : ""} found
        </span>
        <div className="ml-auto flex items-center gap-2">
          {fixableItems.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleFixAll();
              }}
              className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-accent"
            >
              <Wrench className="h-3 w-3" />
              Fix all
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 space-y-0.5 border-t border-border/50 pt-2">
          {items.map((item) => (
            <DiagnosticCard
              key={item.id}
              item={item}
              isFixin={fixingIds.has(item.fix_id ?? "")}
              onFix={handleFix}
            />
          ))}
        </div>
      )}
    </div>
  );
}
