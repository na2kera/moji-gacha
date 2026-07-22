import { useEffect, useMemo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GachaImages } from '@/constants/assets';
import { RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { Fonts, Spacing } from '@/constants/theme';
import { languageOfCharacter } from '@/data/languages';
import type { GachaCharacter } from '@/data/types';
import { haptics } from '@/lib/haptics';

const SPARKLE_COUNT = 10;

/** その言語の文字表での通し番号と行ラベル。図鑑の採番として表示する */
function sheetPositionOf(baseId: string): { no: number; rowLabel: string | null } | undefined {
  const language = languageOfCharacter.get(baseId);
  if (!language) return undefined;
  let no = 0;
  for (let rowIndex = 0; rowIndex < language.sheetRows.length; rowIndex++) {
    for (const cellId of language.sheetRows[rowIndex]) {
      if (!cellId) continue;
      no += 1;
      if (cellId === baseId) return { no, rowLabel: language.sheetRowLabels[rowIndex] };
    }
  }
  return undefined;
}

type SparkleSpec = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  delay: number;
  duration: number;
  drift: number;
};

function createSparkles(): SparkleSpec[] {
  return Array.from({ length: SPARKLE_COUNT }, () => ({
    left: `${6 + Math.random() * 86}%`,
    top: `${8 + Math.random() * 78}%`,
    size: 10 + Math.random() * 10,
    delay: Math.random() * 2400,
    duration: 1600 + Math.random() * 1400,
    drift: 10 + Math.random() * 14,
  }));
}

function Sparkle({ spec, color }: { spec: SparkleSpec; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [progress, spec]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [
      { translateY: -spec.drift * progress.value },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.4, 1, 0.5]) },
      { rotate: `${progress.value * 90}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        { left: spec.left, top: spec.top, fontSize: spec.size, color },
        style,
      ]}>
      ✦
    </Animated.Text>
  );
}

function Star({ index, color }: { index: number; color: string }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(500 + index * 160, withSpring(1, { damping: 9, stiffness: 200 }));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.Text style={[styles.star, { color }, style]}>★</Animated.Text>;
}

type Props = {
  character: GachaCharacter;
};

/** 詳細画面の主役。グロー・キラキラ・登場アニメーション付きで文字を大きく見せる */
export function CharacterHero({ character }: Props) {
  const rarityColor = RarityColors[character.rarity];
  const glowColor = character.colorVariant?.glowColor ?? rarityColor;
  const sparkles = useMemo(() => createSparkles(), []);
  const position = useMemo(() => sheetPositionOf(character.baseId), [character.baseId]);

  const glyphIn = useSharedValue(0);
  const pressBounce = useSharedValue(1);
  const glowPulse = useSharedValue(0);
  const auraRotate = useSharedValue(0);

  // 初回マウント時と色違い切り替え時に、文字がバネで飛び出す
  useEffect(() => {
    glyphIn.value = 0;
    glyphIn.value = withDelay(150, withSpring(1, { damping: 11, stiffness: 130 }));
  }, [glyphIn, character.id]);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    auraRotate.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [glowPulse, auraRotate]);

  const onPressGlyph = () => {
    haptics.light();
    pressBounce.value = withSequence(
      withSpring(1.18, { damping: 6, stiffness: 260 }),
      withSpring(1, { damping: 9, stiffness: 180 }),
    );
  };

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glyphIn.value * pressBounce.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + glowPulse.value * 0.2,
    transform: [{ scale: 1 + glowPulse.value * 0.12 }],
  }));

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${auraRotate.value}deg` }],
  }));

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.card, { borderColor: rarityColor }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${rarityColor}14` }]} />

      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardNo}>
          No.{String(position?.no ?? 0).padStart(2, '0')}
        </ThemedText>
        {position?.rowLabel != null && (
          <ThemedText themeColor="textSecondary" style={styles.rowLabel}>
            {position.rowLabel}
          </ThemedText>
        )}
      </View>

      <View style={styles.stage}>
        {character.rarity === 'superRare' && (
          <Animated.View style={[styles.aura, auraStyle]} pointerEvents="none">
            <Image source={GachaImages.effects.superRareAura} style={styles.auraImage} />
          </Animated.View>
        )}
        <Animated.View
          style={[styles.glow, { backgroundColor: glowColor }, glowStyle]}
          pointerEvents="none"
        />
        <Pressable onPress={onPressGlyph} hitSlop={Spacing.three}>
          <Animated.View style={glyphStyle}>
            <ThemedText
              style={[styles.glyph, character.colorVariant && { color: character.colorVariant.glyphColor }]}>
              {character.glyph}
            </ThemedText>
          </Animated.View>
        </Pressable>
      </View>

      {character.colorVariant && (
        <View style={[styles.variantChip, { backgroundColor: `${glowColor}33` }]}>
          <ThemedText type="smallBold" style={{ color: character.colorVariant.glyphColor }}>
            ✦ {character.colorVariant.label}
          </ThemedText>
        </View>
      )}

      <View style={styles.starRow}>
        {Array.from({ length: RarityStars[character.rarity] }, (_, i) => (
          <Star key={i} index={i} color={rarityColor} />
        ))}
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {sparkles.map((spec, index) => (
          <Sparkle key={index} spec={spec} color={glowColor} />
        ))}
      </View>

      <View style={[styles.ribbon, { backgroundColor: rarityColor }]} pointerEvents="none">
        <ThemedText style={styles.ribbonText}>{RarityLabels[character.rarity]}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 2,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    overflow: 'hidden',
  },
  cardHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardNo: {
    fontFamily: Fonts.rounded,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  rowLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  ribbon: {
    position: 'absolute',
    top: 18,
    right: -36,
    width: 140,
    alignItems: 'center',
    paddingVertical: 3,
    transform: [{ rotate: '45deg' }],
  },
  ribbonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  stage: {
    height: 190,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraImage: {
    width: 260,
    height: 260,
    opacity: 0.8,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  glyph: {
    fontFamily: Fonts.rounded,
    fontSize: 96,
    lineHeight: 120,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  variantChip: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  starRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  star: {
    fontSize: 26,
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sparkle: {
    position: 'absolute',
  },
});
