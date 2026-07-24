import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SavedWord = {
  id: string;
  /** 使った文字のID列。並び順がそのまま表示順になる */
  characterIds: string[];
  /** ISO 8601 */
  createdAt: string;
};

type WordsState = {
  /** 新しい順に並んだマイことば一覧 */
  words: SavedWord[];
  addWord: (characterIds: string[]) => void;
  removeWord: (id: string) => void;
};

function newWordId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useWordsStore = create<WordsState>()(
  persist(
    (set) => ({
      words: [],
      addWord: (characterIds) =>
        set((state) => ({
          words: [
            { id: newWordId(), characterIds, createdAt: new Date().toISOString() },
            ...state.words,
          ],
        })),
      removeWord: (id) =>
        set((state) => ({ words: state.words.filter((word) => word.id !== id) })),
    }),
    {
      name: 'moji-gacha-words',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
