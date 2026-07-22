import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SettingsState = {
  /** 効果音のON/OFF */
  soundEnabled: boolean;
  toggleSound: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: 'moji-gacha-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
