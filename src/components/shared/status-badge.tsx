import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  success: "bg-success/15 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  error: "bg-destructive/15 text-destructive border-destructive/25",
  info: "bg-primary/15 text-primary border-primary/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
