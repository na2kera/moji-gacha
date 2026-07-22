import type { GachaCharacter } from '@/data/types';

/** ラッキー文字の排出重み倍率 */
export const LUCKY_WEIGHT_MULTIPLIER = 5;

/** ローカル時刻での日付キー (例: '2026-07-21')。デイリー要素の基準に使う */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 前日の日付キー。ストリーク判定に使う */
export function previousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

/** 文字列から決定論的なハッシュ値を作る (FNV-1a) */
function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * 「今日のラッキー文字」を日付から決定論的に選ぶ。
 * 全員が同じ日に同じ文字になるので、SNSで「今日は◯◯の日」と話題を共有できる。
 * 色違いは対象外 (基本文字のみ)。
 */
export function getLuckyCharacter(
  characters: readonly GachaCharacter[],
  dateKey: string = localDateKey(),
): GachaCharacter {
  const baseCharacters = characters.filter((c) => c.id === c.baseId);
  const pool = baseCharacters.length > 0 ? baseCharacters : characters;
  return pool[hashString(`moji-gacha-lucky-${dateKey}`) % pool.length];
}

/** ラッキー文字 (色違い含む同一グループ) の重みをブーストした抽選プールを返す */
export function applyLuckyBoost(
  characters: readonly GachaCharacter[],
  luckyBaseId: string,
): GachaCharacter[] {
  return characters.map((c) =>
    c.baseId === luckyBaseId ? { ...c, weight: c.weight * LUCKY_WEIGHT_MULTIPLIER } : c,
  );
}
