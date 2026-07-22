import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { Accent, BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { characterById, japanese, variantsByBaseId } from '@/data/japanese';
import type { GachaCharacter } from '@/data/types';
import { haptics } from '@/lib/haptics';
import { shareGeneric, shareToX } from '@/lib/share';
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

/** 駄菓子屋の値札のような点線リーダー付きの1行 */
function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.specLeader}>
        ・・・・・・・・・・・・・・・・・・・・・・・・・・・・・・・・
      </ThemedText>
      <ThemedText style={styles.specValue}>{value}</ThemedText>
    </View>
  );
}

/** 獲得済みを示す朱色の判子 */
function GetStamp() {
  return (
    <View style={styles.stamp}>
      <ThemedText style={styles.stampText}>ゲット</ThemedText>
    </View>
  );
}

function VariantRow({
  variant,
  selected,
  onToggle,
}: {
  variant: GachaCharacter;
  selected: boolean;
  onToggle: () => void;
}) {
  const entry = useCollectionStore((state) => state.entries[variant.id]);
  const glowColor = variant.colorVariant?.glowColor;

  return (
    <Pressable
      disabled={!entry}
      onPress={onToggle}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.variantRow,
          entry && glowColor && { borderColor: glowColor },
          selected && glowColor && { backgroundColor: `${glowColor}22` },
        ]}>
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
          {entry && (
            <ThemedText type="small" themeColor="textSecondary">
              {selected ? 'タップでもとにもどす' : 'タップでみてみる'}
            </ThemedText>
          )}
        </View>
        {entry && <GetStamp />}
      </ThemedView>
    </Pressable>
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
  // 色違いをタップで見比べる (null は基本の姿)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const entry = useCollectionStore((state) =>
    character ? state.entries[character.id] : undefined,
  );
  const variants = character ? (variantsByBaseId.get(character.id) ?? []) : [];
  const ownedVariantCount = useCollectionStore(
    (state) => variants.filter((variant) => state.entries[variant.id]).length,
  );

  const displayed =
    (selectedVariantId && variants.find((v) => v.id === selectedVariantId)) || character;
  const displayedEntry = useCollectionStore((state) =>
    displayed ? state.entries[displayed.id] : undefined,
  );

  const totalWeight = useMemo(
    () => japanese.characters.reduce((sum, c) => sum + c.weight, 0),
    [],
  );
  const dropRate = displayed ? (displayed.weight / totalWeight) * 100 : 0;

  function toggleVariant(variantId: string) {
    haptics.selection();
    setSelectedVariantId((current) => (current === variantId ? null : variantId));
  }

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

          {character && entry && displayed ? (
            <>
              <FadeInUp delay={0}>
                <CharacterHero character={displayed} />
              </FadeInUp>

              <FadeInUp delay={200}>
                <ThemedView type="backgroundElement" style={styles.specCard}>
                  <View style={styles.specTitleRow}>
                    <View style={styles.specTitleLine} />
                    <ThemedText type="smallBold" style={styles.specTitle}>
                      きろく
                    </ThemedText>
                    <View style={styles.specTitleLine} />
                  </View>
                  <SpecRow label="獲得数" value={`×${(displayedEntry ?? entry).count}`} />
                  <SpecRow
                    label="初獲得"
                    value={formatShortDate((displayedEntry ?? entry).firstObtainedAt)}
                  />
                  <SpecRow label="排出率" value={formatRate(dropRate)} />
                </ThemedView>
              </FadeInUp>

              <FadeInUp delay={300} style={styles.shareRow}>
                <Pressable
                  onPress={() => shareToX(displayed)}
                  style={({ pressed }) => [
                    styles.shareButton,
                    styles.shareButtonX,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.shareButtonXText}>
                    Xでシェア
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => shareGeneric(displayed)}
                  style={({ pressed }) => [
                    styles.shareButton,
                    styles.shareButtonGeneric,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.shareButtonGenericText}>
                    シェアする
                  </ThemedText>
                </Pressable>
              </FadeInUp>

              {variants.length > 0 && (
                <FadeInUp delay={400} style={styles.variantSection}>
                  <View style={styles.variantHeader}>
                    <ThemedText type="smallBold">色違いコレクション</ThemedText>
                    <View
                      style={[
                        styles.variantCountBadge,
                        { borderColor: RarityColors[character.rarity] },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={[
                          styles.variantCountText,
                          { color: RarityColors[character.rarity] },
                        ]}>
                        {ownedVariantCount} / {variants.length}
                      </ThemedText>
                    </View>
                  </View>
                  {variants.map((variant, index) => (
                    <FadeInUp key={variant.id} delay={500 + index * 90}>
                      <VariantRow
                        variant={variant}
                        selected={variant.id === selectedVariantId}
                        onToggle={() => toggleVariant(variant.id)}
                      />
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
  specCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  specTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  specTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#88888855',
  },
  specTitle: {
    fontFamily: Fonts.rounded,
    letterSpacing: 4,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  specLeader: {
    flex: 1,
    fontSize: 9,
    lineHeight: 20,
    letterSpacing: 2,
    opacity: 0.5,
  },
  specValue: {
    fontFamily: Fonts.rounded,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  shareRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shareButton: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonX: {
    backgroundColor: Accent.xBrand,
  },
  shareButtonXText: {
    color: Accent.onXBrand,
  },
  shareButtonGeneric: {
    backgroundColor: Accent.primary,
  },
  shareButtonGenericText: {
    color: Accent.onPrimary,
  },
  stamp: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: Accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.9,
  },
  stampText: {
    color: Accent.primary,
    fontFamily: Fonts.rounded,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
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
    borderWidth: 1.5,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  variantCountText: {
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
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
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#88888866',
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.five,
  },
  lockedHeroGlyph: {
    fontSize: 72,
    lineHeight: 88,
    fontWeight: '700',
  },
});
