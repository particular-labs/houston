import { useEffect, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, X, Calendar, Tag } from "lucide-react";
import { useNavigationStore } from "@/stores/navigation";
import { useChangelogs } from "@/hooks/use-changelogs";
import { cn } from "@/lib/utils";
import type { ChangelogEntry } from "@/lib/changelogs";

interface ChangelogContentProps {
  changelog: ChangelogEntry;
}

function ChangelogContent({ changelog }: ChangelogContentProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(changelog.sections?.map((s) => s.title) || [])
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {changelog.summary}
      </p>

      {/* Highlights */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Highlights
        </h4>
        <ul className="space-y-1.5">
          {changelog.highlights.map((highlight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Sections */}
      {changelog.sections && changelog.sections.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Details
          </h4>
          {changelog.sections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      section.title.includes("Bug") || section.title.includes("Fix")
                        ? "bg-red-400"
                        : section.title.includes("Improvement")
                          ? "bg-blue-400"
                          : section.title.includes("Technical")
                            ? "bg-zinc-400"
                            : "bg-emerald-400"
                    )}
                  />
                  {section.title}
                </span>
                {expandedSections.has(section.title) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  expandedSections.has(section.title)
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                )}
              >
                <ul className="space-y-1 px-3 pb-3 pt-1">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WhatsNewModal() {
  const { whatsNewOpen, whatsNewVersion, setWhatsNewOpen } = useNavigationStore();
  const { data: changelogs } = useChangelogs();

  // Find the specific changelog to display
  const changelog = whatsNewVersion
    ? changelogs?.find((c) => c.version === whatsNewVersion)
    : changelogs?.[0]; // Latest if no specific version

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && whatsNewOpen) {
        setWhatsNewOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [whatsNewOpen, setWhatsNewOpen]);

  if (!whatsNewOpen || !changelog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setWhatsNewOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <button
            onClick={() => setWhatsNewOpen(false)}
            className="absolute right-3 top-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {changelog.title}
              </h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                  <Tag className="h-3 w-3" />
                  v{changelog.version}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {changelog.date}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-5 scrollbar-thin">
          <ChangelogContent changelog={changelog} />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 bg-card/50">
          <button
            onClick={() => setWhatsNewOpen(false)}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
