import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorBanner({
  message = "Something went wrong",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/25 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
