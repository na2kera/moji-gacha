import type { GachaCharacter } from '@/data/types';

/**
 * 重み付きランダム抽選。weight が大きい文字ほど出やすい。
 */
export function drawCharacter(
  characters: readonly GachaCharacter[],
  random: () => number = Math.random,
): GachaCharacter {
  if (characters.length === 0) {
    throw new Error('drawCharacter: characters is empty');
  }
  const totalWeight = characters.reduce((sum, c) => sum + c.weight, 0);
  let remaining = random() * totalWeight;
  for (const character of characters) {
    remaining -= character.weight;
    if (remaining < 0) return character;
  }
  return characters[characters.length - 1];
}
