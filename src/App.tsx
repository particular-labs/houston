import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { createElement, useEffect, useRef } from "react";
import { useNavigationStore, type Section } from "@/stores/navigation";
import { useTheme } from "@/hooks/use-theme";
import { useSetting } from "@/hooks/use-settings";
import { useWhatsNewCheck } from "@/hooks/use-whats-new";
import { useOnboardingCheck } from "@/hooks/use-onboarding";
import { useUpdateChecker } from "@/hooks/use-update-checker";
import { VisibilityContext, useVisibilityState } from "@/hooks/use-visibility";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const sectionShortcuts: Record<string, Section> = {
  "1": "dashboard",
  "2": "system",
  "3": "path",
  "4": "languages",
  "5": "environment",
  "6": "workspaces",
  "7": "containers",
  "8": "packages",
  "9": "tools",
  "0": "settings",
};

function KeyboardShortcuts() {
  const setSection = useNavigationStore((s) => s.setActiveSection);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // Cmd+1-8 for section navigation
        const section = sectionShortcuts[e.key];
        if (section) {
          e.preventDefault();
          setSection(section);
        }
        // Cmd+R for refresh all
        if (e.key === "r") {
          e.preventDefault();
          queryClient.invalidateQueries();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setSection]);

  return null;
}

function StartupSection() {
  const { data: startupSection, isLoading } = useSetting("startup_section");
  const setSection = useNavigationStore((s) => s.setActiveSection);
  const navigated = useRef(false);

  useEffect(() => {
    if (isLoading || navigated.current) return;
    navigated.current = true;

    const section = startupSection as Section | undefined;
    if (section && section !== "dashboard") {
      setSection(section);
    }
  }, [startupSection, isLoading, setSection]);

  return null;
}

function WhatsNewCheck() {
  useWhatsNewCheck();
  return null;
}

function OnboardingCheck() {
  useOnboardingCheck();
  return null;
}

function UpdateChecker() {
  useUpdateChecker();
  return null;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          style:
            theme === "dark"
              ? {
                  background: "oklch(0.17 0.015 260)",
                  border: "1px solid oklch(0.25 0.015 260)",
                  color: "oklch(0.95 0.01 260)",
                }
              : {
                  background: "oklch(0.98 0.005 260)",
                  border: "1px solid oklch(0.88 0.01 260)",
                  color: "oklch(0.15 0.02 260)",
                },
        }}
      />
    </>
  );
}

function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const state = useVisibilityState();
  return createElement(VisibilityContext.Provider, { value: state }, children);
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VisibilityProvider>
        <ThemeProvider>
          <StartupSection />
          <WhatsNewCheck />
          <OnboardingCheck />
          <UpdateChecker />
          <KeyboardShortcuts />
          <AppShell />
        </ThemeProvider>
      </VisibilityProvider>
    </QueryClientProvider>
  );
}
