import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * ギリシャ文字24字 (小文字) のレイアウト。'　'(全角スペース) は空セル。
 * ラテン文字と紛らわしい大文字ではなく、形が独特な小文字を採用。
 */
const SHEET: string[] = [
  'αβγδε',
  'ζηθικ',
  'λμνξο',
  'πρστυ',
  'φχψω　',
];

/** ギリシャ語の文章で最も出現頻度が低いψ・ξは超レア。低頻度の文字は少しレア */
const SUPER_RARE = new Set(['ψ', 'ξ']);
const RARE = new Set(['ζ', 'θ', 'φ', 'χ', 'ω']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `el-${glyph}`;
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

export const greek: LanguageSet = {
  id: 'greek',
  label: 'ギリシャ語',
  flag: '🇬🇷',
  characters: withColorVariants(baseCharacters),
  sheetRows: SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `el-${glyph}`)),
  ),
  sheetRowLabels: SHEET.map(() => null),
  sheetSections: [{ title: 'アルファベット', firstRow: 0, rowCount: SHEET.length }],
};
