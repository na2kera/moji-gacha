import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CollectionEntry = {
  count: number;
  /** ISO 8601 */
  firstObtainedAt: string;
};

type CollectionState = {
  /** 文字ID → 獲得情報 */
  entries: Record<string, CollectionEntry>;
  totalDraws: number;
  /** ガチャ結果を記録し、初獲得かどうかを返す */
  recordDraw: (characterId: string) => { isNew: boolean };
  reset: () => void;
};

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      entries: {},
      totalDraws: 0,
      recordDraw: (characterId) => {
        const existing = get().entries[characterId];
        const isNew = existing == null;
        set((state) => ({
          totalDraws: state.totalDraws + 1,
          entries: {
            ...state.entries,
            [characterId]: isNew
              ? { count: 1, firstObtainedAt: new Date().toISOString() }
              : { ...existing, count: existing.count + 1 },
          },
        }));
        return { isNew };
      },
      reset: () => set({ entries: {}, totalDraws: 0 }),
    }),
    {
      name: 'moji-gacha-collection',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
