import {
  Monitor,
  Cpu,
  HardDrive,
  Terminal,
  User,
  Home,
  Globe,
} from "lucide-react";
import { useSystemInfo } from "@/hooks/use-system-info";
import { SectionHeader } from "@/components/shared/section-header";
import { CopyButton } from "@/components/shared/copy-button";
import { InfoCardSkeleton } from "@/components/shared/skeleton";
import { IssueLinkBadge } from "@/components/shared/issue-link-badge";
import { useQueryClient } from "@tanstack/react-query";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function SystemSection() {
  const { data: system, isLoading, isFetching } = useSystemInfo();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="System" description="OS, shell, and hardware information" />
        <div className="grid grid-cols-2 gap-4">
          <InfoCardSkeleton />
          <InfoCardSkeleton />
        </div>
      </div>
    );
  }

  if (!system) return null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="System"
        description="OS, shell, and hardware information"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["system-info"] })}
        isRefreshing={isFetching}
      />

      <IssueLinkBadge section="system" />

      <div className="grid grid-cols-2 gap-4">
        {/* OS & Hardware */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Operating System</h3>
          <div className="divide-y divide-border">
            <InfoRow icon={Monitor} label="OS" value={`${system.os_name} ${system.os_version}`} />
            <InfoRow icon={Globe} label="Kernel" value={system.kernel_version} />
            <InfoRow icon={Cpu} label="Architecture" value={system.architecture} />
            <InfoRow icon={Globe} label="Hostname" value={system.hostname} />
          </div>
        </div>

        {/* Shell & User */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Shell & User</h3>
          <div className="divide-y divide-border">
            <InfoRow icon={Terminal} label="Shell" value={system.shell} />
            <InfoRow icon={Terminal} label="Shell Version" value={system.shell_version} />
            <InfoRow icon={User} label="Username" value={system.username} />
            <InfoRow icon={Home} label="Home Directory" value={system.home_dir} />
          </div>
        </div>

        {/* Hardware */}
        <div className="col-span-2 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Hardware</h3>
          <div className="divide-y divide-border">
            <InfoRow icon={Cpu} label="CPU" value={system.cpu_brand} />
            <InfoRow icon={HardDrive} label="Memory" value={system.memory_gb} />
          </div>
        </div>
      </div>
    </div>
  );
}
