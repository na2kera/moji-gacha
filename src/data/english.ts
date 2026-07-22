import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * アルファベット表のレイアウト。'　'(全角スペース) は空セル。
 */
const SHEET: string[] = [
  'ABCDE',
  'FGHIJ',
  'KLMNO',
  'PQRST',
  'UVWXY',
  'Z　　　　',
];

/**
 * 英文の出現頻度ベースのレアリティ。
 * E, T, A などは出やすく、J, Q, X, Z は超レア。
 */
const SUPER_RARE = new Set(['J', 'Q', 'X', 'Z']);
const RARE = new Set(['B', 'F', 'G', 'K', 'P', 'V', 'W', 'Y']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `en-${glyph}`;
  return {
    id,
    baseId: id,
    glyph,
    rarity,
    weight: RARITY_WEIGHT[rarity],
  };
}

const baseCharacters: GachaCharacter[] = SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

export const english: LanguageSet = {
  id: 'english',
  label: '英語',
  flag: '🇺🇸',
  characters: withColorVariants(baseCharacters),
  sheetRows: SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `en-${glyph}`)),
  ),
  sheetRowLabels: SHEET.map(() => null),
  sheetSections: [{ title: 'アルファベット', firstRow: 0, rowCount: SHEET.length }],
};
