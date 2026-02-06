import { useEffect, useRef } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useQueryClient } from "@tanstack/react-query";
import { useSetting, useSetSetting } from "@/hooks/use-settings";
import { useNavigationStore } from "@/stores/navigation";
import { syncChangelogsToDb, getChangelogFromDb } from "@/lib/changelogs";

export function useWhatsNewCheck() {
  const { data: lastSeenVersion, isLoading } = useSetting("last_seen_version");
  const setSetting = useSetSetting();
  const setWhatsNewOpen = useNavigationStore((s) => s.setWhatsNewOpen);
  const queryClient = useQueryClient();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (isLoading || checkedRef.current) return;
    checkedRef.current = true;

    async function checkVersion() {
      try {
        // Sync static changelogs to DB on every startup
        await syncChangelogsToDb();

        // Invalidate changelogs query to pick up synced data
        queryClient.invalidateQueries({ queryKey: ["changelogs"] });

        const currentVersion = await getVersion();

        // First launch: set version without showing modal
        if (lastSeenVersion === null || lastSeenVersion === undefined) {
          setSetting.mutate({ key: "last_seen_version", value: currentVersion });
          return;
        }

        // Same version: nothing to do
        if (lastSeenVersion === currentVersion) {
          return;
        }

        // Different version: check if we have a changelog entry in DB
        const changelog = await getChangelogFromDb(currentVersion);
        if (changelog) {
          setWhatsNewOpen(true);
        }

        // Update stored version regardless
        setSetting.mutate({ key: "last_seen_version", value: currentVersion });
      } catch (error) {
        console.error("Failed to check version for What's New:", error);
      }
    }

    checkVersion();
  }, [lastSeenVersion, isLoading, setSetting, setWhatsNewOpen, queryClient]);
}
