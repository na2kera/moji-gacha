import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * ハングルの基本字母 (子音14 + 母音10) のレイアウト。
 * '　'(全角スペース) は空セル。
 */
const CONSONANT_SHEET: string[] = [
  'ㄱㄴㄷㄹㅁ',
  'ㅂㅅㅇㅈㅊ',
  'ㅋㅌㅍㅎ　',
];

const VOWEL_SHEET: string[] = [
  'ㅏㅑㅓㅕㅗ',
  'ㅛㅜㅠㅡㅣ',
];

/** 激音のㅋ・ㅍは出にくい超レア。残りの激音とヨ系母音は少しレア */
const SUPER_RARE = new Set(['ㅋ', 'ㅍ']);
const RARE = new Set(['ㅊ', 'ㅌ', 'ㅎ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `ko-${glyph}`;
  return {
    id,
    baseId: id,
    glyph,
    rarity,
    weight: RARITY_WEIGHT[rarity],
  };
}

const FULL_SHEET = [...CONSONANT_SHEET, ...VOWEL_SHEET];

const baseCharacters: GachaCharacter[] = FULL_SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

export const korean: LanguageSet = {
  id: 'korean',
  label: '韓国語',
  flag: '🇰🇷',
  characters: withColorVariants(baseCharacters),
  sheetRows: FULL_SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `ko-${glyph}`)),
  ),
  sheetRowLabels: FULL_SHEET.map(() => null),
  sheetSections: [
    { title: '子音', firstRow: 0, rowCount: CONSONANT_SHEET.length },
    { title: '母音', firstRow: CONSONANT_SHEET.length, rowCount: VOWEL_SHEET.length },
  ],
};
