import { RARITY_WEIGHT, withColorVariants } from './build';
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

/** 濁音の行 */
const DAKUTEN_SHEET: string[] = [
  'がぎぐげご',
  'ざじずぜぞ',
  'だぢづでど',
  'ばびぶべぼ',
];

/** 半濁音の行 */
const HANDAKUTEN_SHEET: string[] = [
  'ぱぴぷぺぽ',
];

const DAKUTEN = new Set(DAKUTEN_SHEET.flatMap((row) => [...row]));
const HANDAKUTEN = new Set(HANDAKUTEN_SHEET.flatMap((row) => [...row]));

/** 出にくい文字。実際のガチャガチャで「なかなか出ない」体験を作る */
const SUPER_RARE = new Set(['ぬ', 'を', 'ん', 'ぢ', 'づ']);
const RARE = new Set(['ね', 'む', 'へ', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  // 濁音・半濁音は通常の五十音より少し出にくい
  if (DAKUTEN.has(glyph) || HANDAKUTEN.has(glyph)) return 'rare';
  return 'common';
}

function soundMarkOf(glyph: string): GachaCharacter['soundMark'] {
  if (DAKUTEN.has(glyph)) return 'dakuten';
  if (HANDAKUTEN.has(glyph)) return 'handakuten';
  return undefined;
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const soundMark = soundMarkOf(glyph);
  const id = `ja-${glyph}`;
  return {
    id,
    baseId: id,
    glyph,
    rarity,
    ...(soundMark && { soundMark }),
    weight: RARITY_WEIGHT[rarity],
  };
}

const FULL_SHEET = [...SHEET, ...DAKUTEN_SHEET, ...HANDAKUTEN_SHEET];

const baseCharacters: GachaCharacter[] = FULL_SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

export const japanese: LanguageSet = {
  id: 'japanese',
  label: '日本語',
  flag: '🇯🇵',
  characters: withColorVariants(baseCharacters),
  sheetRows: FULL_SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `ja-${glyph}`)),
  ),
  // 行ラベル (あ行/か行…が行…)。1文字だけの行(ん)はその文字自身をラベルにする
  sheetRowLabels: FULL_SHEET.map((row) => {
    const glyphs = [...row].filter((glyph) => glyph !== '　');
    return glyphs.length > 1 ? `${glyphs[0]}行` : glyphs[0];
  }),
  sheetSections: [
    { title: '清音', firstRow: 0, rowCount: SHEET.length },
    { title: '濁音', firstRow: SHEET.length, rowCount: DAKUTEN_SHEET.length },
    {
      title: '半濁音',
      firstRow: SHEET.length + DAKUTEN_SHEET.length,
      rowCount: HANDAKUTEN_SHEET.length,
    },
  ],
};
