import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localDateKey, previousDateKey } from '@/lib/lucky';

export type CollectionEntry = {
  count: number;
  /** ISO 8601 */
  firstObtainedAt: string;
};

type CollectionState = {
  /** 文字ID → 獲得情報 */
  entries: Record<string, CollectionEntry>;
  totalDraws: number;
  /** 最後にガチャをまわした日 (localDateKey 形式)。ストリーク判定に使う */
  lastDrawDate: string | null;
  /** 連続でまわした日数 */
  streakDays: number;
  /** 演出済みの図鑑マイルストーン (0 | 25 | 50 | 75 | 100)。二重演出を防ぐ */
  celebratedMilestone: number;
  /** ガチャ結果を記録し、初獲得かどうかを返す */
  recordDraw: (characterId: string) => { isNew: boolean };
  setCelebratedMilestone: (milestone: number) => void;
  reset: () => void;
};

/** 前回プレイ日からの経過でストリークを更新する */
function nextStreak(lastDrawDate: string | null, streakDays: number, today: string): number {
  if (lastDrawDate === today) return Math.max(streakDays, 1);
  if (lastDrawDate === previousDateKey(today)) return streakDays + 1;
  return 1;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      entries: {},
      totalDraws: 0,
      lastDrawDate: null,
      streakDays: 0,
      celebratedMilestone: 0,
      recordDraw: (characterId) => {
        const existing = get().entries[characterId];
        const isNew = existing == null;
        const today = localDateKey();
        set((state) => ({
          totalDraws: state.totalDraws + 1,
          streakDays: nextStreak(state.lastDrawDate, state.streakDays, today),
          lastDrawDate: today,
          entries: {
            ...state.entries,
            [characterId]: isNew
              ? { count: 1, firstObtainedAt: new Date().toISOString() }
              : { ...existing, count: existing.count + 1 },
          },
        }));
        return { isNew };
      },
      setCelebratedMilestone: (milestone) => set({ celebratedMilestone: milestone }),
      reset: () =>
        set({
          entries: {},
          totalDraws: 0,
          lastDrawDate: null,
          streakDays: 0,
          celebratedMilestone: 0,
        }),
    }),
    {
      name: 'moji-gacha-collection',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
