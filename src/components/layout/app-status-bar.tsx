import { useSystemInfo } from "@/hooks/use-system-info";
import { useLanguages } from "@/hooks/use-languages";
import { StatusDot } from "@/components/shared/status-dot";

export function AppStatusBar() {
  const { data: system } = useSystemInfo();
  const { data: languages } = useLanguages();

  const nodeVersion = languages?.find(
    (l) => l.name === "Node.js" && l.installed,
  );
  const rustVersion = languages?.find(
    (l) => l.name === "Rust" && l.installed,
  );

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-background px-3 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        {system && (
          <>
            <div className="flex items-center gap-1.5">
              <StatusDot status="success" />
              <span>
                {system.os_name} {system.os_version}
              </span>
            </div>
            <span className="text-border">|</span>
            <span>{system.architecture}</span>
            <span className="text-border">|</span>
            <span>{system.shell}</span>
          </>
        )}
        {nodeVersion && (
          <>
            <span className="text-border">|</span>
            <span>node {nodeVersion.version}</span>
          </>
        )}
        {rustVersion && (
          <>
            <span className="text-border">|</span>
            <span>rust {rustVersion.version}</span>
          </>
        )}
      </div>
      <span>{timeStr}</span>
    </footer>
  );
}
