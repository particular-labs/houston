import { useEffect, useRef } from "react";
import { useSetting, useSetSetting } from "@/hooks/use-settings";
import { useNavigationStore } from "@/stores/navigation";

export function useOnboardingCheck() {
  const { data: hasSeenOnboarding, isLoading } = useSetting("has_seen_onboarding");
  const setSetting = useSetSetting();
  const setOnboardingOpen = useNavigationStore((s) => s.setOnboardingOpen);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (isLoading || checkedRef.current) return;
    checkedRef.current = true;

    // First launch: show onboarding modal
    if (hasSeenOnboarding === null || hasSeenOnboarding === undefined) {
      setOnboardingOpen(true);
      setSetting.mutate({ key: "has_seen_onboarding", value: "true" });
    }
  }, [hasSeenOnboarding, isLoading, setSetting, setOnboardingOpen]);
}
