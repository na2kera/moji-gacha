import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity } from './types';

/**
 * カナダラ表 (반절표) のレイアウト。
 * 行 = 基本子音14 (ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ)、
 * 列 = 基本母音6 (ㅏㅓㅗㅜㅡㅣ) の音節文字。
 */
const SHEET: string[] = [
  '가거고구그기',
  '나너노누느니',
  '다더도두드디',
  '라러로루르리',
  '마머모무므미',
  '바버보부브비',
  '사서소수스시',
  '아어오우으이',
  '자저조주즈지',
  '차처초추츠치',
  '카커코쿠크키',
  '타터토투트티',
  '파퍼포푸프피',
  '하허호후흐히',
];

/** 激音 (ㅊㅋㅌㅍ) とㅎの行は出にくい。その中でもㅡ段は超レア */
const ASPIRATED_ROWS = SHEET.slice(9);
const RARE = new Set(ASPIRATED_ROWS.flatMap((row) => [...row]));
const SUPER_RARE = new Set(ASPIRATED_ROWS.map((row) => [...row][4]));

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

const baseCharacters: GachaCharacter[] = SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

export const korean: LanguageSet = {
  id: 'korean',
  label: '韓国語',
  flag: '🇰🇷',
  characters: withColorVariants(baseCharacters),
  sheetRows: SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `ko-${glyph}`)),
  ),
  sheetRowLabels: SHEET.map(() => null),
  sheetSections: [{ title: 'カナダラ表', firstRow: 0, rowCount: SHEET.length }],
};
