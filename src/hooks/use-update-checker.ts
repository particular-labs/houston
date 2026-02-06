import { useEffect, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { useUpdateStore } from "@/stores/update";

const CHECK_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour (dev mode)
const MIN_CHECK_GAP = 5 * 60 * 1000; // 5 minutes minimum between checks

export function useUpdateChecker() {
  const { lastChecked, setStatus, setLastChecked } = useUpdateStore();
  const isCheckingRef = useRef(false);
  const lastCheckedRef = useRef(lastChecked);

  // Keep ref in sync with store
  useEffect(() => {
    lastCheckedRef.current = lastChecked;
  }, [lastChecked]);

  const checkForUpdates = async () => {
    // Use ref to prevent concurrent checks (avoids state dependency)
    if (isCheckingRef.current) return;
    if (Date.now() - lastCheckedRef.current < MIN_CHECK_GAP) return;

    isCheckingRef.current = true;
    setStatus("checking");
    setLastChecked(Date.now());

    try {
      const update = await check();
      if (update?.available) {
        setStatus("available", update.version);
      } else {
        setStatus("up-to-date");
      }
    } catch {
      setStatus("error");
    } finally {
      isCheckingRef.current = false;
    }
  };

  // Check on mount
  useEffect(() => {
    checkForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only on mount

  // Window focus check
  useEffect(() => {
    const handleFocus = () => checkForUpdates();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - stable function via ref

  // Periodic check (6 hours)
  useEffect(() => {
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - never recreate interval
}
