import { cn } from "@/lib/utils";

type Status = "success" | "warning" | "error" | "info" | "neutral";

interface StatusDotProps {
  status: Status;
  className?: string;
  pulse?: boolean;
}

const statusColors: Record<Status, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-primary",
  neutral: "bg-muted-foreground",
};

export function StatusDot({ status, className, pulse }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        statusColors[status],
        pulse && "animate-pulse",
        className,
      )}
      role="status"
      aria-label={`Status: ${status}`}
    />
  );
}
