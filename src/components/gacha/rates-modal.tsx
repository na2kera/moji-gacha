import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { Spacing } from '@/constants/theme';
import type { GachaCharacter, Rarity } from '@/data/types';
import { LUCKY_WEIGHT_MULTIPLIER } from '@/lib/lucky';

type Props = {
  visible: boolean;
  onClose: () => void;
  characters: readonly GachaCharacter[];
  /** 今日のラッキー文字。排出率アップの注記に使う */
  luckyGlyph?: string;
};

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'superRare'];

type RarityRateSummary = {
  rarity: Rarity;
  count: number;
  percent: number;
};

/** レアリティごとの合計排出率を集計する */
export function summarizeRates(characters: readonly GachaCharacter[]): RarityRateSummary[] {
  const totalWeight = characters.reduce((sum, c) => sum + c.weight, 0);
  return RARITY_ORDER.map((rarity) => {
    const group = characters.filter((c) => c.rarity === rarity);
    const weight = group.reduce((sum, c) => sum + c.weight, 0);
    return {
      rarity,
      count: group.length,
      percent: totalWeight === 0 ? 0 : (weight / totalWeight) * 100,
    };
  });
}

export function RatesModal({ visible, onClose, characters, luckyGlyph }: Props) {
  const summaries = summarizeRates(characters);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(event) => event.stopPropagation()}>
          <ThemedView style={styles.card}>
            <ThemedText type="smallBold" style={styles.title}>
              排出率
            </ThemedText>

            {summaries.map(({ rarity, count, percent }) => (
              <View key={rarity} style={styles.row}>
                <View style={[styles.rarityDot, { backgroundColor: RarityColors[rarity] }]} />
                <ThemedText type="smallBold" style={{ color: RarityColors[rarity] }}>
                  {'★'.repeat(RarityStars[rarity])}
                </ThemedText>
                <ThemedText type="small" style={styles.rarityLabel}>
                  {RarityLabels[rarity]} ({count}種)
                </ThemedText>
                <ThemedText type="smallBold">{percent.toFixed(1)}%</ThemedText>
              </View>
            ))}

            {luckyGlyph && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                きょうのラッキー文字「{luckyGlyph}」は排出率 {LUCKY_WEIGHT_MULTIPLIER} 倍!
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              同じレアリティの中では、どの文字も同じ確率で出ます。文字ごとの排出率は図鑑の詳細画面で見られます。
            </ThemedText>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText type="smallBold" style={styles.closeButtonText}>
                とじる
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 20, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: 320,
    maxWidth: '100%',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rarityLabel: {
    flex: 1,
  },
  note: {
    marginTop: Spacing.one,
  },
  closeButton: {
    marginTop: Spacing.two,
    borderRadius: Spacing.three,
    minHeight: 44,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
  },
});
