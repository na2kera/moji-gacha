import type { Rarity } from '@/data/types';

export const RarityColors: Record<Rarity, string> = {
  common: '#4FA8FF',
  rare: '#A855F7',
  superRare: '#F5A80B',
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
