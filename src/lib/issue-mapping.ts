import type { Section } from "@/stores/navigation";

export const categoryToSection: Record<string, Section> = {
  brew: "system",
  packages: "packages",
  path: "path",
  binaries: "path",
  shell: "environment",
  environment: "environment",
  windows: "system",
  linux: "system",
};

export const sectionLabels: Record<Section, string> = {
  dashboard: "Dashboard",
  system: "System",
  path: "PATH",
  languages: "Languages",
  environment: "Environment",
  workspaces: "Projects",
  containers: "Containers",
  packages: "Packages",
  tools: "Tools",
  settings: "Settings",
  issues: "Issues",
};

// Snarky comments - keyed by category
export const snarkyComments: Record<string, string[]> = {
  brew: [
    "Homebrew having a moment? It happens to the best of us.",
    "Your brew is more broken than my coffee maker.",
    "Have you tried turning Homebrew off and on again?",
  ],
  path: [
    "Your PATH is giving 'choose your own adventure' vibes.",
    "So many directories, so little time.",
    "PATH issues: because life wasn't complicated enough.",
  ],
  binaries: [
    "Some binaries have gone AWOL. Time to file a missing persons report.",
    "Your binaries are playing hide and seek. They're winning.",
  ],
  shell: [
    "Your shell config is more tangled than headphone cables.",
    "Shell shocked? We'll help you recover.",
  ],
  environment: [
    "Your environment variables are having an identity crisis.",
    "ENV vars: where debugging dreams go to die.",
  ],
  packages: [
    "Package management: it's not you, it's npm. (It's always npm.)",
    "Your packages are more outdated than my jokes.",
    "Dependency hell called. They want their packages back.",
  ],
  windows: [
    "Windows development: an exercise in patience.",
    "Have you tried rebooting? No, really.",
  ],
  linux: [
    "Linux: where the fix is always 'just recompile the kernel'.",
    "Have you tried checking the man pages?",
  ],
};

export function getSnarkyComment(category: string): string | null {
  const comments = snarkyComments[category];
  if (!comments || comments.length === 0) return null;
  return comments[Math.floor(Math.random() * comments.length)];
}
