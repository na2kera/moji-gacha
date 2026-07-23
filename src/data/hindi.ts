import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * デーヴァナーガリー文字のレイアウト。母音11 + 子音33。
 * 子音は調音位置ごとの伝統的な5字組 (五十音の並び順の起源) で並べる。
 * '　'(全角スペース) は空セル。
 */
const VOWEL_SHEET: string[] = [
  'अआइईउ',
  'ऊऋएऐओ',
  'औ　　　　',
];

const CONSONANT_SHEET: string[] = [
  'कखगघङ',
  'चछजझञ',
  'टठडढण',
  'तथदधन',
  'पफबभम',
  'यरलव　',
  'शषसह　',
];

/** ほぼ使われない母音ऋと、単独で書かれることが稀な鼻音ङ・ञは超レア。帯気音などは少しレア */
const SUPER_RARE = new Set(['ऋ', 'ङ', 'ञ']);
const RARE = new Set(['ऊ', 'ऐ', 'औ', 'घ', 'झ', 'ठ', 'ढ', 'ध', 'भ', 'ष']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `hi-${glyph}`;
  return {
    id,
    baseId: id,
    glyph,
    rarity,
    weight: RARITY_WEIGHT[rarity],
  };
}

const FULL_SHEET = [...VOWEL_SHEET, ...CONSONANT_SHEET];

const baseCharacters: GachaCharacter[] = FULL_SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

export const hindi: LanguageSet = {
  id: 'hindi',
  label: 'ヒンディー語',
  flag: '🇮🇳',
  characters: withColorVariants(baseCharacters),
  sheetRows: FULL_SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `hi-${glyph}`)),
  ),
  sheetRowLabels: FULL_SHEET.map(() => null),
  sheetSections: [
    { title: '母音', firstRow: 0, rowCount: VOWEL_SHEET.length },
    { title: '子音', firstRow: VOWEL_SHEET.length, rowCount: CONSONANT_SHEET.length },
  ],
};
