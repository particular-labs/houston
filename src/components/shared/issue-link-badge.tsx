import { AlertTriangle, ArrowRight } from "lucide-react";
import { useIssuesBySection } from "@/hooks/use-issues-by-section";
import { useNavigationStore, type Section } from "@/stores/navigation";
import { cn } from "@/lib/utils";

interface IssueLinkBadgeProps {
  section: Section;
  className?: string;
}

export function IssueLinkBadge({ section, className }: IssueLinkBadgeProps) {
  const { issuesBySection } = useIssuesBySection();
  const navigateToIssues = useNavigationStore((s) => s.navigateToIssues);

  const sectionIssues = issuesBySection.get(section);
  if (!sectionIssues || sectionIssues.count === 0) {
    return null;
  }

  const { count, maxSeverity } = sectionIssues;
  const isError = maxSeverity === "error";
  const isWarning = maxSeverity === "warning";

  return (
    <button
      onClick={() => navigateToIssues(section)}
      className={cn(
        "group flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
        isError
          ? "border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : isWarning
            ? "border-warning/25 bg-warning/5 text-warning hover:bg-warning/10"
            : "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="font-medium">
        {count} issue{count !== 1 ? "s" : ""} found
      </span>
      <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}
