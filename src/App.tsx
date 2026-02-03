import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { useEffect } from "react";
import { useNavigationStore, type Section } from "@/stores/navigation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
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
  "7": "packages",
  "8": "tools",
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardShortcuts />
      <AppShell />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.17 0.015 260)",
            border: "1px solid oklch(0.25 0.015 260)",
            color: "oklch(0.95 0.01 260)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
