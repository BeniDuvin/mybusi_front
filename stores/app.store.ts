import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AppStore {
  selectedDepotId: string | null;
  setSelectedDepotId: (depotId: string | null) => Promise<void>;
  hydrateSelectedDepotId: () => Promise<void>;
  
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedDepotId: null,
  setSelectedDepotId: async (depotId) => {
    set({ selectedDepotId: depotId });
    if (depotId) await SecureStore.setItemAsync('selectedDepotId', depotId);
    else await SecureStore.deleteItemAsync('selectedDepotId');
  },
  hydrateSelectedDepotId: async () => {
    const depotId = await SecureStore.getItemAsync('selectedDepotId');
    if (depotId) set({ selectedDepotId: depotId });
  },
  
  isOffline: false,
  setIsOffline: (isOffline) => set({ isOffline }),
}));
