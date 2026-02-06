import { create } from "zustand";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "up-to-date"
  | "error";

interface UpdateState {
  status: UpdateStatus;
  version: string | null;
  lastChecked: number;
  setStatus: (status: UpdateStatus, version?: string | null) => void;
  setLastChecked: (time: number) => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  status: "idle",
  version: null,
  lastChecked: 0,
  setStatus: (status, version) => set({ status, version: version ?? null }),
  setLastChecked: (time) => set({ lastChecked: time }),
}));
