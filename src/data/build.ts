import type { GachaCharacter, Rarity } from './types';

/** レアリティごとの抽選重み。大きいほど出やすい。全言語で共通 */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 10,
  rare: 4,
  superRare: 1,
};

/** 色違いの出やすさ。基本文字の重みに対する倍率 */
const COLOR_VARIANT_WEIGHT_RATIO = 0.04;

const COLOR_VARIANT_COLORS = [
  { glyphColor: '#008F7A', glowColor: '#7FFFE5' },
  { glyphColor: '#D93668', glowColor: '#FFC1D0' },
  { glyphColor: '#5E9E00', glowColor: '#D8FF7A' },
  { glyphColor: '#C75A00', glowColor: '#FFD08A' },
  { glyphColor: '#0077CC', glowColor: '#A7F0FF' },
];

/** 基本文字それぞれに色違いバリエーションを加えた抽選プールを作る */
export function withColorVariants(baseCharacters: GachaCharacter[]): GachaCharacter[] {
  const colorVariants: GachaCharacter[] = baseCharacters.map((character, index) => ({
    ...character,
    id: `${character.id}-color`,
    baseId: character.id,
    weight: character.weight * COLOR_VARIANT_WEIGHT_RATIO,
    colorVariant: {
      label: '色違い',
      ...COLOR_VARIANT_COLORS[index % COLOR_VARIANT_COLORS.length],
    },
  }));
  return [...baseCharacters, ...colorVariants];
}
