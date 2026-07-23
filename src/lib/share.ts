import { Alert, Linking, Platform, Share } from 'react-native';

import { RarityLabels, RarityStars } from '@/constants/rarity';
import type { GachaCharacter } from '@/data/types';

const HASHTAG = '#もじガチャ';

type WebNavigator = {
  share?: (data: { text?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

/** シェア文言を組み立てる (例: 「あ」(★ ノーマル) をゲットした！) */
export function buildShareText(character: GachaCharacter): string {
  const stars = '★'.repeat(RarityStars[character.rarity]);
  const rarityLabel = character.colorVariant
    ? `${RarityLabels[character.rarity]}・${character.colorVariant.label}`
    : RarityLabels[character.rarity];

  return `「${character.glyph}」(${stars} ${rarityLabel}) をゲットした！\n${HASHTAG}`;
}

/** コンプリート時のシェア文言を組み立てる */
export function buildCompleteShareText(setLabel: string, totalCount: number, totalDraws: number): string {
  return `${setLabel} ${totalCount}文字コンプリート!🏆\n${totalDraws} 回まわして全部集めました!\n${HASHTAG}`;
}

/** X (Twitter) の投稿画面を開く */
export async function shareToX(character: GachaCharacter): Promise<void> {
  const text = buildShareText(character);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  await Linking.openURL(url);
}

/** コンプリート賞状を X (Twitter) でシェアする */
export async function shareCompleteToX(setLabel: string, totalCount: number, totalDraws: number): Promise<void> {
  const text = buildCompleteShareText(setLabel, totalCount, totalDraws);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  await Linking.openURL(url);
}

/** コンプリート賞状を OS 標準の共有シートでシェアする */
export async function shareCompleteGeneric(setLabel: string, totalCount: number, totalDraws: number): Promise<void> {
  const text = buildCompleteShareText(setLabel, totalCount, totalDraws);

  if (Platform.OS === 'web') {
    const nav: WebNavigator | undefined = (globalThis as { navigator?: WebNavigator }).navigator;
    if (nav?.share) {
      await nav.share({ text });
      return;
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      Alert.alert('コピーしました', 'シェア文をクリップボードにコピーしました。');
      return;
    }
    return;
  }

  await Share.share({ message: text });
}

/** OS 標準の共有シート (LINE, Instagram など汎用 SNS) を開く */
export async function shareGeneric(character: GachaCharacter): Promise<void> {
  const text = buildShareText(character);

  if (Platform.OS === 'web') {
    const nav: WebNavigator | undefined = (globalThis as { navigator?: WebNavigator }).navigator;
    if (nav?.share) {
      await nav.share({ text });
      return;
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      Alert.alert('コピーしました', 'シェア文をクリップボードにコピーしました。');
      return;
    }
    return;
  }

  await Share.share({ message: text });
}
