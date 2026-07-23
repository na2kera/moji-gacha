import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * タイ文字の子音44字を伝統的な順 (ก ไก่ の順) に並べたレイアウト。
 * '　'(全角スペース) は空セル。
 */
const SHEET: string[] = [
  'กขฃคฅ',
  'ฆงจฉช',
  'ซฌญฎฏ',
  'ฐฑฒณด',
  'ตถทธน',
  'บปผฝพ',
  'ฟภมยร',
  'ลวศษส',
  'หฬอฮ　',
];

/** 現代タイ語で使われなくなったฃ・ฅは超レア。サンスクリット由来などの低頻度文字は少しレア */
const SUPER_RARE = new Set(['ฃ', 'ฅ']);
const RARE = new Set(['ฆ', 'ฌ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ศ', 'ษ', 'ฬ', 'ฮ']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `th-${glyph}`;
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

export const thai: LanguageSet = {
  id: 'thai',
  label: 'タイ語',
  flag: '🇹🇭',
  characters: withColorVariants(baseCharacters),
  sheetRows: SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `th-${glyph}`)),
  ),
  sheetRowLabels: SHEET.map(() => null),
  sheetSections: [{ title: '子音', firstRow: 0, rowCount: SHEET.length }],
};
