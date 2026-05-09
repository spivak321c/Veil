import { create } from "zustand";

export interface UmbraStore {
  client: any | null; // using any since @umbra-privacy/sdk types might need explicit imports
  isInitializing: boolean;
  error: string | null;
  setClient: (client: any | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useUmbraStore = create<UmbraStore>((set) => ({
  client: null,
  isInitializing: false,
  error: null,
  setClient: (client) => set({ client }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setError: (error) => set({ error }),
  reset: () => set({ client: null, isInitializing: false, error: null }),
}));
