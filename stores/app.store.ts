import { create } from 'zustand';

interface AppStore {
  selectedDepotId: string | null;
  setSelectedDepotId: (depotId: string | null) => void;
  
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedDepotId: null,
  setSelectedDepotId: (depotId) => set({ selectedDepotId: depotId }),
  
  isOffline: false,
  setIsOffline: (isOffline) => set({ isOffline }),
}));
