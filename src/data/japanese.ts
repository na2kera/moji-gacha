import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * 五十音表のレイアウト。'　'(全角スペース) は空セル。
 */
const SHEET: string[] = [
  'あいうえお',
  'かきくけこ',
  'さしすせそ',
  'たちつてと',
  'なにぬねの',
  'はひふへほ',
  'まみむめも',
  'や　ゆ　よ',
  'らりるれろ',
  'わ　　　を',
  'ん　　　　',
];

/** 出にくい文字。実際のガチャガチャで「なかなか出ない」体験を作る */
const SUPER_RARE = new Set(['ぬ', 'を', 'ん']);
const RARE = new Set(['ね', 'む', 'へ', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ']);

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 10,
  rare: 4,
  superRare: 1,
};

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  return { id: `ja-${glyph}`, glyph, rarity, weight: RARITY_WEIGHT[rarity] };
}

const characters: GachaCharacter[] = SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

export const japanese: LanguageSet = {
  id: 'japanese',
  label: '日本語',
  characters,
  sheetRows: SHEET.map((row) => [...row].map((glyph) => (glyph === '　' ? null : `ja-${glyph}`))),
};
