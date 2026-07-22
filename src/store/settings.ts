import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_LANGUAGE_ID } from '@/data/languages';

type SettingsState = {
  /** 効果音のON/OFF */
  soundEnabled: boolean;
  toggleSound: () => void;
  /** 選択中のガチャ言語 (LanguageSet の id) */
  languageId: string;
  setLanguageId: (languageId: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      languageId: DEFAULT_LANGUAGE_ID,
      setLanguageId: (languageId) => set({ languageId }),
    }),
    {
      name: 'moji-gacha-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
