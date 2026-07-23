import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * アラビア文字28字を伝統的な字母順 (ヒジャー順) に並べたレイアウト。
 * '　'(全角スペース) は空セル。各文字は独立形で表示する。
 */
const SHEET: string[] = [
  'ابتثج',
  'حخدذر',
  'زسشصض',
  'طظعغف',
  'قكلمن',
  'هوي　　',
];

/** アラビア語特有の音のض・ظは超レア。使用頻度の低い強調音などは少しレア */
const SUPER_RARE = new Set(['ض', 'ظ']);
const RARE = new Set(['ث', 'ذ', 'خ', 'ص', 'ط', 'غ', 'ق']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `ar-${glyph}`;
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

export const arabic: LanguageSet = {
  id: 'arabic',
  label: 'アラビア語',
  flag: '🇸🇦',
  characters: withColorVariants(baseCharacters),
  sheetRows: SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `ar-${glyph}`)),
  ),
  sheetRowLabels: SHEET.map(() => null),
  sheetSections: [{ title: 'アルファベット', firstRow: 0, rowCount: SHEET.length }],
};
