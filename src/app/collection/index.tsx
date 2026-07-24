import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompleteCertificate } from '@/components/collection/complete-certificate';
import { Confetti } from '@/components/gacha/confetti';
import { LanguageSwipe } from '@/components/language-swipe';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RarityColors } from '@/constants/rarity';
import { Accent, BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { characterById, variantsByBaseId } from '@/data/languages';
import type { GachaCharacter } from '@/data/types';
import { useLanguage, type SwitchDirection } from '@/hooks/use-language';
import { haptics } from '@/lib/haptics';
import { sounds } from '@/lib/sounds';
import { useCollectionStore } from '@/store/collection';

/** 図鑑進捗の節目 (%)。到達するとその場でお祝いする */
const MILESTONES = [25, 50, 75, 100] as const;

function SheetCell({ character }: { character: GachaCharacter | null }) {
  const entries = useCollectionStore((state) => state.entries);
  const collection = (() => {
    if (!character) {
      return { ownedCount: 0, totalCopies: 0, colorVariant: undefined };
    }

    const characters = [character, ...(variantsByBaseId.get(character.id) ?? [])];
    return characters.reduce<{
      ownedCount: number;
      totalCopies: number;
      colorVariant: GachaCharacter['colorVariant'];
    }>(
      (summary, current) => {
        const entry = entries[current.id];
        if (!entry) return summary;

        return {
          ownedCount: summary.ownedCount + 1,
          totalCopies: summary.totalCopies + entry.count,
          colorVariant: summary.colorVariant ?? current.colorVariant,
        };
      },
      { ownedCount: 0, totalCopies: 0, colorVariant: undefined },
    );
  })();

  if (!character) {
    return <View style={styles.cell} />;
  }

  if (collection.ownedCount === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.cell, styles.cellLocked]}>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.lockedGlyph}>
          ?
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/collection/[id]', params: { id: character.id } })
      }
      style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.cellInner,
          styles.cellObtained,
          { borderColor: RarityColors[character.rarity] },
        ]}>
        <ThemedText
          type="subtitle"
          style={[
            styles.cellGlyph,
            collection.colorVariant && { color: collection.colorVariant.glyphColor },
          ]}>
          {character.glyph}
        </ThemedText>
        {collection.colorVariant && (
          <View
            style={[
              styles.variantMarker,
              { backgroundColor: collection.colorVariant.glyphColor },
            ]}
          />
        )}
        {collection.totalCopies > 1 && (
          <View style={[styles.countBadge, { backgroundColor: RarityColors[character.rarity] }]}>
            <ThemedText type="smallBold" style={styles.countBadgeText}>
              ×{collection.totalCopies}
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </Pressable>
  );
}

export default function CollectionScreen() {
  const { language, switchLanguage } = useLanguage();

  const obtainedCount = useCollectionStore(
    (state) => language.characters.filter((c) => state.entries[c.id]).length,
  );
  // この言語でまわした回数 (獲得数の合計)
  const languageDraws = useCollectionStore((state) =>
    language.characters.reduce((sum, c) => sum + (state.entries[c.id]?.count ?? 0), 0),
  );
  const celebratedMilestone = useCollectionStore(
    (state) => state.celebratedMilestones[language.id] ?? 0,
  );
  const setCelebratedMilestone = useCollectionStore((state) => state.setCelebratedMilestone);
  const completedAt = useCollectionStore((state) => {
    // 全文字が揃っている場合のみ、最後の1文字を獲得した日 (=コンプリート日) を返す
    let latest: string | null = null;
    for (const c of language.characters) {
      const obtained = state.entries[c.id]?.firstObtainedAt;
      if (!obtained) return null;
      if (latest == null || obtained > latest) latest = obtained;
    }
    return latest;
  });
  const totalCount = language.characters.length;
  const progress = totalCount === 0 ? 0 : obtainedCount / totalCount;
  const isComplete = totalCount > 0 && obtainedCount === totalCount;

  const [celebration, setCelebration] = useState<number | null>(null);
  const [certificateVisible, setCertificateVisible] = useState(false);

  // 言語切り替え時のシートのスライド演出。entering アニメーションは途中で
  // キャンセルされると transform が残って表示がずれることがあるため、
  // 常設ビューへの translateX で行う (必ず 0 に収束する)
  const { width: screenWidth } = useWindowDimensions();
  const slideX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const handleSwitchLanguage = (direction: SwitchDirection) => {
    haptics.selection();
    // 新しい言語のシートが切り替え方向の画面外からスライドインしてくる
    // (イベントハンドラ内での shared value 書き込みは Reanimated の正規のパターン)
    // eslint-disable-next-line react-hooks/immutability
    slideX.value = direction * screenWidth;
    slideX.value = withSpring(0, { damping: 18, overshootClamping: true });
    switchLanguage(direction);
  };


  // 言語が切り替わったら、進行中の演出は打ち切る (レンダー中の状態調整パターン)
  const [prevLanguageId, setPrevLanguageId] = useState(language.id);
  if (prevLanguageId !== language.id) {
    setPrevLanguageId(language.id);
    setCelebration(null);
    setCertificateVisible(false);
  }

  // 未演出のマイルストーンに到達していたら、その場でお祝いする
  const progressPercent = progress * 100;
  const reachedMilestone = MILESTONES.filter((m) => progressPercent >= m).at(-1) ?? 0;

  useEffect(() => {
    if (reachedMilestone <= celebratedMilestone) return;
    setCelebratedMilestone(language.id, reachedMilestone);
    // 画面表示が落ち着いてから演出を始める
    const showTimer = setTimeout(() => {
      haptics.success();
      sounds.sparkle();
      if (reachedMilestone === 100) {
        // コンプリートは賞状で盛大に
        setCertificateVisible(true);
      } else {
        setCelebration(reachedMilestone);
      }
    }, 350);
    const hideTimer = setTimeout(() => setCelebration(null), 3000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [reachedMilestone, celebratedMilestone, setCelebratedMilestone, language.id]);

  // 行ラベル (あ行/か行…) を持つ言語だけラベル列を出す
  const hasRowLabels = language.sheetRowLabels.some((label) => label != null);

  return (
    <ThemedView style={styles.container}>
      <LanguageSwipe onSwipe={handleSwitchLanguage} style={styles.swipeArea}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="subtitle">コレクション</ThemedText>
              <LanguageSwitcher language={language} onSwitch={handleSwitchLanguage} />
            </View>

            <Pressable
              onPress={() => {
                haptics.selection();
                router.push('/collection/words');
              }}
              style={({ pressed }) => [styles.wordsButton, pressed && styles.cellPressed]}>
              <ThemedText type="smallBold" style={styles.wordsButtonText}>
                ✏️ ことばづくり
              </ThemedText>
            </Pressable>

            <Animated.View style={[styles.languageBlock, slideStyle]}>
              <View style={styles.progressRow}>
                <ThemedText type="smallBold">
                  {obtainedCount} / {totalCount}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  累計 {languageDraws} 回
                </ThemedText>
              </View>
              <ThemedView type="backgroundElement" style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                {MILESTONES.filter((m) => m < 100).map((m) => (
                  <View
                    key={m}
                    style={[
                      styles.milestoneTick,
                      { left: `${m}%` },
                      progressPercent >= m && styles.milestoneTickReached,
                    ]}
                  />
                ))}
              </ThemedView>

              {isComplete && (
                <Pressable
                  onPress={() => setCertificateVisible(true)}
                  style={({ pressed }) => [
                    styles.certificateButton,
                    pressed && styles.cellPressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.certificateButtonText}>
                    🏆 コンプリート賞状を見る
                  </ThemedText>
                </Pressable>
              )}

              {language.sheetSections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.sectionTitle}>
                    {section.title}
                  </ThemedText>
                  <View style={styles.sheet}>
                    {language.sheetRows
                      .slice(section.firstRow, section.firstRow + section.rowCount)
                      .map((row, index) => {
                        const rowIndex = section.firstRow + index;
                        return (
                          <View key={rowIndex} style={styles.row}>
                            {hasRowLabels && (
                              <View style={styles.rowLabel}>
                                <ThemedText
                                  type="small"
                                  themeColor="textSecondary"
                                  style={styles.rowLabelText}>
                                  {language.sheetRowLabels[rowIndex]}
                                </ThemedText>
                              </View>
                            )}
                            {row.map((characterId, cellIndex) => (
                              <SheetCell
                                key={cellIndex}
                                character={
                                  characterId ? (characterById.get(characterId) ?? null) : null
                                }
                              />
                            ))}
                          </View>
                        );
                      })}
                  </View>
                </View>
              ))}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LanguageSwipe>

      {celebration != null && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          pointerEvents="none"
          style={styles.celebrationOverlay}>
          <Confetti />
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.celebrationCard}>
            <ThemedText style={styles.celebrationEmoji}>🎉</ThemedText>
            <ThemedText type="subtitle" style={styles.celebrationText}>
              {celebration}% たっせい!
            </ThemedText>
          </Animated.View>
        </Animated.View>
      )}

      <CompleteCertificate
        visible={certificateVisible}
        onClose={() => setCertificateVisible(false)}
        setLabel={language.label}
        totalCount={totalCount}
        totalDraws={languageDraws}
        completedAt={completedAt}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  swipeArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    // web はタブバーが画面上部に浮いているため、ヘッダーがその下に隠れないよう余白を広げる
    paddingTop: Platform.select({ web: 80 }) ?? Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  languageBlock: {
    gap: Spacing.three,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Accent.primary,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.rounded,
  },
  milestoneTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  milestoneTickReached: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  wordsButton: {
    borderRadius: Spacing.three,
    minHeight: 44,
    backgroundColor: Accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordsButtonText: {
    color: Accent.onPrimary,
  },
  certificateButton: {
    borderRadius: Spacing.three,
    minHeight: 44,
    backgroundColor: RarityColors.superRare,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certificateButtonText: {
    color: '#FFFFFF',
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 20, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCard: {
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  celebrationEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  celebrationText: {
    color: '#B87E00',
  },
  sheet: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowLabel: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabelText: {
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInner: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPressed: {
    opacity: 0.7,
  },
  cellLocked: {
    opacity: 0.6,
  },
  lockedGlyph: {
    opacity: 0.4,
  },
  cellObtained: {
    borderWidth: 2,
  },
  cellGlyph: {
    fontSize: 28,
    lineHeight: 36,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },
  variantMarker: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
