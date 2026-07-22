import { RARITY_WEIGHT, withColorVariants } from './build';
import type { GachaCharacter, LanguageSet, Rarity, SheetSection } from './types';

/**
 * 常用漢字のサブセットをテーマ別にまとめたレイアウト。
 * '　'(全角スペース) は空セル。
 */
const SECTIONS: { title: string; rows: string[] }[] = [
  { title: '数字', rows: ['一二三四五', '六七八九十'] },
  { title: '自然', rows: ['日月山川雨', '水火木金土'] },
  { title: 'からだ', rows: ['人口目耳手'] },
  { title: 'いきもの', rows: ['犬猫鳥魚虫'] },
  { title: 'スペシャル', rows: ['愛夢星龍福'] },
];

/** 縁起物の 龍・福 は超レア。きらびやかな文字は少しレア */
const SUPER_RARE = new Set(['龍', '福']);
const RARE = new Set(['金', '雨', '虫', '愛', '夢', '星']);

function rarityOf(glyph: string): Rarity {
  if (SUPER_RARE.has(glyph)) return 'superRare';
  if (RARE.has(glyph)) return 'rare';
  return 'common';
}

function toCharacter(glyph: string): GachaCharacter {
  const rarity = rarityOf(glyph);
  const id = `zh-${glyph}`;
  return {
    id,
    baseId: id,
    glyph,
    rarity,
    weight: RARITY_WEIGHT[rarity],
  };
}

const FULL_SHEET = SECTIONS.flatMap((section) => section.rows);

const baseCharacters: GachaCharacter[] = FULL_SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

const sheetSections: SheetSection[] = SECTIONS.reduce<SheetSection[]>((sections, section) => {
  const firstRow = sections.reduce((sum, s) => sum + s.rowCount, 0);
  sections.push({ title: section.title, firstRow, rowCount: section.rows.length });
  return sections;
}, []);

export const chinese: LanguageSet = {
  id: 'chinese',
  label: '中国語',
  flag: '🇨🇳',
  characters: withColorVariants(baseCharacters),
  sheetRows: FULL_SHEET.map((row) =>
    [...row].map((glyph) => (glyph === '　' ? null : `zh-${glyph}`)),
  ),
  sheetRowLabels: FULL_SHEET.map(() => null),
  sheetSections,
};
