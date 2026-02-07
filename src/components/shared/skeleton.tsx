import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

// --- Context-specific skeletons ---

/** Skeleton for detail view headers with icon, title, badges, and action buttons */
export function DetailHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="space-y-2">
          {/* Title + badge row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Subtitle */}
          <Skeleton className="h-4 w-56" />
          {/* Detail text */}
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

/** Skeleton for info cards with title and key-value pairs */
export function InfoCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Skeleton className="mb-3 h-4 w-24" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for log/terminal output areas */
export function LogViewerSkeleton({ lines = 8 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/30">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      {/* Log content */}
      <div className="p-4 space-y-1.5 font-mono text-xs bg-black/20">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3.5 bg-muted/50"
            style={{ width: `${Math.random() * 40 + 50}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Full detail view skeleton - back button, header, info cards grid */
export function DetailViewSkeleton({
  cards = 3,
  showLogs = false,
}: {
  cards?: number;
  showLogs?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header */}
      <DetailHeaderSkeleton />

      {/* Info cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <InfoCardSkeleton key={i} rows={4} />
        ))}
      </div>

      {/* Optional logs section */}
      {showLogs && <LogViewerSkeleton />}
    </div>
  );
}

/** Skeleton for container cards in list view */
export function ContainerCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for project cards in workspaces */
export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-full max-w-xs" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton for tool cards */
export function ToolCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

/** Skeleton for dashboard stat cards */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
