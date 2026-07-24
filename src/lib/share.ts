import { Alert, Linking, Platform, Share } from 'react-native';

import { RarityLabels, RarityStars } from '@/constants/rarity';
import type { GachaCharacter } from '@/data/types';

const HASHTAG = '#もじガチャ';

type WebNavigator = {
  share?: (data: { text?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

/** X (Twitter) の投稿画面を開く */
async function openTweet(text: string): Promise<void> {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  await Linking.openURL(url);
}

/** OS 標準の共有シート (web は Web Share API / クリップボード) でテキストをシェアする */
async function shareText(text: string): Promise<void> {
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

/** ことばづくりのシェア文言を組み立てる */
export function buildWordShareText(word: string): string {
  return `集めた文字で「${word}」ということばを作った!\n${HASHTAG}`;
}

/** X (Twitter) の投稿画面を開く */
export async function shareToX(character: GachaCharacter): Promise<void> {
  await openTweet(buildShareText(character));
}

/** コンプリート賞状を X (Twitter) でシェアする */
export async function shareCompleteToX(setLabel: string, totalCount: number, totalDraws: number): Promise<void> {
  await openTweet(buildCompleteShareText(setLabel, totalCount, totalDraws));
}

/** 作ったことばを X (Twitter) でシェアする */
export async function shareWordToX(word: string): Promise<void> {
  await openTweet(buildWordShareText(word));
}

/** コンプリート賞状を OS 標準の共有シートでシェアする */
export async function shareCompleteGeneric(setLabel: string, totalCount: number, totalDraws: number): Promise<void> {
  await shareText(buildCompleteShareText(setLabel, totalCount, totalDraws));
}

/** 作ったことばを OS 標準の共有シートでシェアする */
export async function shareWordGeneric(word: string): Promise<void> {
  await shareText(buildWordShareText(word));
}

/** OS 標準の共有シート (LINE, Instagram など汎用 SNS) を開く */
export async function shareGeneric(character: GachaCharacter): Promise<void> {
  await shareText(buildShareText(character));
}
