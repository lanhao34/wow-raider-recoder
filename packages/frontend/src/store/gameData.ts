import { create } from 'zustand';
import { gameDataApi } from '../api';

interface GameDataState {
  raids: any[];
  loaded: boolean;
  loadRaids: () => Promise<void>;
}

export const useGameDataStore = create<GameDataState>((set) => ({
  raids: [],
  loaded: false,
  loadRaids: async () => {
    try {
      const rawRaids = await gameDataApi.getRaids();
      const raids = rawRaids.map((raid: any) => ({
        ...raid,
        name: raid.nameZh || raid.name,
        bosses: raid.bosses?.map((boss: any) => ({
          ...boss,
          name: boss.nameZh || boss.name,
          loot: boss.loot?.map((item: any) => ({
            ...item,
            name: item.nameZh || item.name,
          })) || []
        })) || []
      }));
      set({ raids, loaded: true });
    } catch (e) {
      console.error('Failed to load raids from backend', e);
      // Fallback behavior could be added here
      set({ loaded: true });
    }
  }
}));
