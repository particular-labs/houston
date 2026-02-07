import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

interface VisibilityState {
  isVisible: boolean;
  idleMinutes: number;
}

const VisibilityContext = createContext<VisibilityState>({
  isVisible: true,
  idleMinutes: 0,
});

export function useVisibility() {
  return useContext(VisibilityContext);
}

export { VisibilityContext };

export function useVisibilityState(): VisibilityState {
  const [isVisible, setIsVisible] = useState(
    () => document.visibilityState === "visible",
  );
  const [idleMinutes, setIdleMinutes] = useState(0);
  const hiddenSince = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateIdle = useCallback(() => {
    if (hiddenSince.current !== null) {
      const elapsed = (Date.now() - hiddenSince.current) / 60_000;
      setIdleMinutes(elapsed);
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);

      if (visible) {
        hiddenSince.current = null;
        setIdleMinutes(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        hiddenSince.current = Date.now();
        intervalRef.current = setInterval(updateIdle, 30_000);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // Listen for Tauri focus/blur events
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      const unlisteners: (() => void)[] = [];
      listen("tauri://focus", () => {
        setIsVisible(true);
        hiddenSince.current = null;
        setIdleMinutes(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }).then((u) => unlisteners.push(u));

      listen("tauri://blur", () => {
        // Only mark as not visible if the document is also hidden
        // (blur can fire when switching to a different window but app is still visible)
        if (document.visibilityState === "hidden") {
          setIsVisible(false);
          hiddenSince.current = Date.now();
          intervalRef.current = setInterval(updateIdle, 30_000);
        }
      }).then((u) => unlisteners.push(u));

      unlisten = () => unlisteners.forEach((u) => u());
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unlisten?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [updateIdle]);

  return { isVisible, idleMinutes };
}
