import { useEffect, useMemo, type ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CharacterHero } from '@/components/collection/character-hero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RarityColors } from '@/constants/rarity';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { characterById, japanese, variantsByBaseId } from '@/data/japanese';
import type { GachaCharacter } from '@/data/types';
import { useCollectionStore } from '@/store/collection';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP');
}

function formatRate(rate: number) {
  return `${rate < 1 ? rate.toFixed(2) : rate.toFixed(1)}%`;
}

/** 下からふわっと現れる登場演出。delay をずらして順番に見せる */
function FadeInUp({
  delay,
  style,
  children,
}: {
  delay: number;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statCard}>
      <ThemedText style={styles.statEmoji}>{emoji}</ThemedText>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function VariantRow({ variant }: { variant: GachaCharacter }) {
  const entry = useCollectionStore((state) => state.entries[variant.id]);
  const glowColor = variant.colorVariant?.glowColor;

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.variantRow, entry && glowColor && { borderColor: glowColor }]}>
      <View
        style={[
          styles.variantGlyphBox,
          entry && glowColor && { backgroundColor: `${glowColor}40` },
        ]}>
        {entry ? (
          <ThemedText
            type="subtitle"
            style={[styles.variantGlyph, { color: variant.colorVariant?.glyphColor }]}>
            {variant.glyph}
          </ThemedText>
        ) : (
          <ThemedText type="subtitle" themeColor="textSecondary" style={styles.lockedGlyph}>
            ?
          </ThemedText>
        )}
      </View>
      <View style={styles.variantInfo}>
        <ThemedText type="smallBold">{variant.colorVariant?.label ?? '色違い'}</ThemedText>
        {entry ? (
          <ThemedText type="small" themeColor="textSecondary">
            ×{entry.count} / {formatDate(entry.firstObtainedAt)} に初獲得
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            まだ出ていない…
          </ThemedText>
        )}
      </View>
      {entry && (
        <ThemedText type="smallBold" style={{ color: variant.colorVariant?.glyphColor }}>
          GET!
        </ThemedText>
      )}
    </ThemedView>
  );
}

/** 未獲得のときにゆっくり明滅する「?」 */
function LockedGlyph() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.35,
  }));

  return (
    <Animated.View style={style}>
      <ThemedText themeColor="textSecondary" style={styles.lockedHeroGlyph}>
        ?
      </ThemedText>
    </Animated.View>
  );
}

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = id ? characterById.get(id) : undefined;
  const entry = useCollectionStore((state) =>
    character ? state.entries[character.id] : undefined,
  );
  const variants = character ? (variantsByBaseId.get(character.id) ?? []) : [];
  const ownedVariantCount = useCollectionStore(
    (state) => variants.filter((variant) => state.entries[variant.id]).length,
  );

  const totalWeight = useMemo(
    () => japanese.characters.reduce((sum, c) => sum + c.weight, 0),
    [],
  );
  const dropRate = character ? (character.weight / totalWeight) * 100 : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => pressed && styles.pressed}
              hitSlop={Spacing.two}>
              <ThemedView type="backgroundElement" style={styles.backButton}>
                <ThemedText type="smallBold">← もどる</ThemedText>
              </ThemedView>
            </Pressable>
          </View>

          {character && entry ? (
            <>
              <FadeInUp delay={0}>
                <CharacterHero character={character} />
              </FadeInUp>

              <FadeInUp delay={200} style={styles.statRow}>
                <StatCard emoji="🎯" value={`×${entry.count}`} label="獲得数" />
                <StatCard emoji="📅" value={formatShortDate(entry.firstObtainedAt)} label="初獲得" />
                <StatCard emoji="🎲" value={formatRate(dropRate)} label="排出率" />
              </FadeInUp>

              {variants.length > 0 && (
                <FadeInUp delay={350} style={styles.variantSection}>
                  <View style={styles.variantHeader}>
                    <ThemedText type="smallBold">色違いコレクション</ThemedText>
                    <View
                      style={[
                        styles.variantCountBadge,
                        { backgroundColor: RarityColors[character.rarity] },
                      ]}>
                      <ThemedText type="smallBold" style={styles.variantCountText}>
                        {ownedVariantCount} / {variants.length}
                      </ThemedText>
                    </View>
                  </View>
                  {variants.map((variant, index) => (
                    <FadeInUp key={variant.id} delay={450 + index * 90}>
                      <VariantRow variant={variant} />
                    </FadeInUp>
                  ))}
                </FadeInUp>
              )}
            </>
          ) : (
            <FadeInUp delay={0}>
              <ThemedView type="backgroundElement" style={styles.lockedCard}>
                <LockedGlyph />
                <ThemedText type="small" themeColor="textSecondary">
                  まだ獲得していません
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ガチャを回せば出会えるかも…？
                </ThemedText>
              </ThemedView>
            </FadeInUp>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    // web はタブバーが画面上部に浮いているため、もどるボタンがその下に隠れないよう余白を広げる
    paddingTop: Platform.select({ web: 80 }) ?? Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  statEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  statValue: {
    fontSize: 15,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  variantSection: {
    gap: Spacing.two,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  variantCountBadge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  variantCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: Spacing.three,
  },
  variantGlyphBox: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantGlyph: {
    fontSize: 36,
    lineHeight: 44,
  },
  variantInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  lockedGlyph: {
    opacity: 0.4,
  },
  lockedCard: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.five,
  },
  lockedHeroGlyph: {
    fontSize: 72,
    lineHeight: 88,
    fontWeight: '700',
  },
});
