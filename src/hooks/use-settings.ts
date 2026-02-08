import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commands, SettingPair } from "@/lib/commands";
import { toast } from "sonner";

let settingsToastTimer: ReturnType<typeof setTimeout> | null = null;

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: commands.getSettings,
    staleTime: 60_000,
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ["setting", key],
    queryFn: () => commands.getSetting(key),
    staleTime: 60_000,
  });
}

export function useSetSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      commands.setSetting(key, value),
    onSuccess: (_data, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["setting", key] });
      // Debounced toast to avoid spam on rapid changes
      if (settingsToastTimer) clearTimeout(settingsToastTimer);
      settingsToastTimer = setTimeout(() => {
        toast.success("Settings saved");
        settingsToastTimer = null;
      }, 800);
    },
  });
}

// Helper to get a setting value from the full settings list
export function getSettingValue(
  settings: SettingPair[] | undefined,
  key: string,
  defaultValue: string = ""
): string {
  if (!settings) return defaultValue;
  const setting = settings.find((s) => s.key === key);
  return setting?.value ?? defaultValue;
}
