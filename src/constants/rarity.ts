import type { Rarity } from '@/data/types';

export const RarityColors: Record<Rarity, string> = {
  common: '#4FA8FF',
  rare: '#A855F7',
  superRare: '#F5A80B',
};

/** 結果カードなどをレアリティ色で「染める」ときの淡い背景色 */
export const RarityCardBackgrounds: Record<Rarity, string> = {
  common: '#EDF6FF',
  rare: '#F8F0FE',
  superRare: '#FFF8E1',
};

export const RarityLabels: Record<Rarity, string> = {
  common: 'ノーマル',
  rare: 'レア',
  superRare: '超レア',
};

export const RarityStars: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  superRare: 3,
};
