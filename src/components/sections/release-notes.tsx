import { useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useChangelogs } from "@/hooks/use-changelogs";
import { useNavigationStore } from "@/stores/navigation";
import { cn } from "@/lib/utils";
import type { ChangelogEntry } from "@/lib/changelogs";

const ITEMS_PER_PAGE = 5;

interface ReleaseCardProps {
  changelog: ChangelogEntry;
  isLatest?: boolean;
}

function ReleaseCard({ changelog, isLatest }: ReleaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const setWhatsNewOpen = useNavigationStore((s) => s.setWhatsNewOpen);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden transition-all",
        isLatest ? "border-primary/50" : "border-border"
      )}
    >
      {/* Header - Always visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  isLatest
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Tag className="h-3 w-3" />
                v{changelog.version}
              </span>
              {isLatest && (
                <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                  Latest
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground">{changelog.title}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {changelog.date}
            </div>
          </div>
          <button
            onClick={() => setWhatsNewOpen(true, changelog.version)}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Summary */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {changelog.summary}
        </p>

        {/* Expand/Collapse for highlights */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide highlights
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show highlights ({changelog.highlights.length})
            </>
          )}
        </button>
      </div>

      {/* Expandable highlights */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 border-t border-border",
          expanded ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <ul className="p-4 space-y-2">
          {changelog.highlights.map((highlight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReleaseNotesSection() {
  const { data: changelogs, isLoading } = useChangelogs();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((changelogs?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleChangelogs = changelogs?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading release notes...
        </div>
      </div>
    );
  }

  if (!changelogs || changelogs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No release notes available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Release Notes</h2>
          <span className="text-sm text-muted-foreground">
            ({changelogs.length} releases)
          </span>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Release cards */}
      <div className="space-y-3">
        {visibleChangelogs.map((changelog, index) => (
          <ReleaseCard
            key={changelog.version}
            changelog={changelog}
            isLatest={currentPage === 1 && index === 0}
          />
        ))}
      </div>

      {/* Bottom pagination for mobile */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "h-8 w-8 rounded-md text-sm font-medium transition-colors",
                page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground"
              )}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
