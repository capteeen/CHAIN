import { create } from 'zustand';

export const useUi = create<{ launchOpen: boolean; setLaunch: (v: boolean) => void; toast?: string; say: (t: string) => void }>((set) => ({
  launchOpen: false,
  setLaunch: (v) => set({ launchOpen: v }),
  toast: undefined,
  say: (t) => {
    set({ toast: t });
    setTimeout(() => set((s) => (s.toast === t ? { toast: undefined } : s)), 2400);
  },
}));
