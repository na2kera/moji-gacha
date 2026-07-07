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

const COLOR_VARIANT_WEIGHT_RATIO = 0.04;
const COLOR_VARIANT_COLORS = [
  { glyphColor: '#008F7A', glowColor: '#7FFFE5' },
  { glyphColor: '#D93668', glowColor: '#FFC1D0' },
  { glyphColor: '#5E9E00', glowColor: '#D8FF7A' },
  { glyphColor: '#C75A00', glowColor: '#FFD08A' },
  { glyphColor: '#0077CC', glowColor: '#A7F0FF' },
];

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
  const id = `ja-${glyph}`;
  return { id, baseId: id, glyph, rarity, weight: RARITY_WEIGHT[rarity] };
}

const baseCharacters: GachaCharacter[] = SHEET.flatMap((row) =>
  [...row].filter((glyph) => glyph !== '　').map(toCharacter),
);

const colorVariantCharacters: GachaCharacter[] = baseCharacters.map((character, index) => ({
  ...character,
  id: `${character.id}-color`,
  baseId: character.id,
  weight: character.weight * COLOR_VARIANT_WEIGHT_RATIO,
  colorVariant: {
    label: '色違い',
    ...COLOR_VARIANT_COLORS[index % COLOR_VARIANT_COLORS.length],
  },
}));

const characters = [...baseCharacters, ...colorVariantCharacters];

export const japanese: LanguageSet = {
  id: 'japanese',
  label: '日本語',
  characters,
  sheetRows: SHEET.map((row) => [...row].map((glyph) => (glyph === '　' ? null : `ja-${glyph}`))),
};

export const characterById = new Map(characters.map((c) => [c.id, c]));

/** baseId → 色違いバリエーションの一覧 (基本文字自身は含まない) */
export const variantsByBaseId = characters.reduce((map, character) => {
  if (character.id === character.baseId) return map;
  const variants = map.get(character.baseId) ?? [];
  variants.push(character);
  map.set(character.baseId, variants);
  return map;
}, new Map<string, GachaCharacter[]>());
