import { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapsuleReveal, OPEN_DURATION, ROLL_DURATION, WOBBLE_DURATION } from '@/components/gacha/capsule-reveal';
import { GachaMachine, SPIN_DURATION } from '@/components/gacha/gacha-machine';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GachaImages } from '@/constants/assets';
import { RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { japanese } from '@/data/japanese';
import type { GachaCharacter } from '@/data/types';
import { drawCharacter } from '@/lib/gacha';
import { haptics } from '@/lib/haptics';
import { useCollectionStore } from '@/store/collection';

type Phase = 'idle' | 'spinning' | 'rolling' | 'opening' | 'result';

type DrawResult = {
  character: GachaCharacter;
  isNew: boolean;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function GachaScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<DrawResult | null>(null);
  const busyRef = useRef(false);
  const colorScheme = useColorScheme();
  const backgroundImage = GachaImages.background[colorScheme === 'dark' ? 'dark' : 'light'];

  const recordDraw = useCollectionStore((state) => state.recordDraw);
  const totalDraws = useCollectionStore((state) => state.totalDraws);
  const resultCount = useCollectionStore((state) =>
    result ? (state.entries[result.character.id]?.count ?? 0) : 0,
  );

  const spin = async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    const character = drawCharacter(japanese.characters);
    // isNew は開封直前の recordDraw で確定させる。ここでは落下演出用に文字だけ保持する
    setResult({ character, isNew: false });
    setPhase('spinning');

    const tick = setInterval(() => haptics.selection(), 150);
    await delay(SPIN_DURATION);
    clearInterval(tick);

    setPhase('rolling');
    await delay(ROLL_DURATION);
    haptics.heavy();
    await delay(WOBBLE_DURATION);

    const { isNew } = recordDraw(character.id);
    setResult({ character, isNew });
    setPhase('opening');
    haptics.success();
    await delay(OPEN_DURATION + 500);

    setPhase('result');
    busyRef.current = false;
  };

  const close = () => {
    if (busyRef.current) return;
    setPhase('idle');
    setResult(null);
  };

  const spinAgain = () => {
    if (busyRef.current) return;
    setPhase('idle');
    setResult(null);
    void spin();
  };

  const overlayVisible = phase === 'rolling' || phase === 'opening' || phase === 'result';

  return (
    <ThemedView style={styles.container}>
      <Image
        source={backgroundImage}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">もじガチャ</ThemedText>
          <View style={styles.languageBadge}>
            <ThemedText type="smallBold" style={styles.languageBadgeText}>
              {japanese.label}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          これまでに {totalDraws} 回まわしました
        </ThemedText>

        <View style={styles.machineArea}>
          <GachaMachine spinning={phase === 'spinning'} />
        </View>

        <Pressable
          onPress={spin}
          disabled={phase !== 'idle'}
          style={({ pressed }) => [
            styles.spinButton,
            phase !== 'idle' && styles.spinButtonDisabled,
            pressed && styles.spinButtonPressed,
          ]}>
          <ThemedText type="subtitle" style={styles.spinButtonText}>
            {phase === 'spinning' ? 'まわしています…' : 'ガチャをまわす'}
          </ThemedText>
        </Pressable>
      </SafeAreaView>

      {overlayVisible && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
          {result && (
            <CapsuleReveal
              character={result.character}
              stage={phase === 'rolling' ? 'roll' : 'open'}
            />
          )}
          {phase === 'result' && result && (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.resultCard}>
              {result.isNew && (
                <View style={styles.newBadge}>
                  <ThemedText type="smallBold" style={styles.newBadgeText}>
                    NEW!
                  </ThemedText>
                </View>
              )}
              <ThemedText
                type="smallBold"
                style={{ color: RarityColors[result.character.rarity] }}>
                {'★'.repeat(RarityStars[result.character.rarity])}{' '}
                {RarityLabels[result.character.rarity]}
              </ThemedText>
              {result.character.colorVariant && (
                <View
                  style={[
                    styles.variantBadge,
                    { backgroundColor: result.character.colorVariant.glyphColor },
                  ]}>
                  <ThemedText type="smallBold" style={styles.variantBadgeText}>
                    {result.character.colorVariant.label}
                  </ThemedText>
                </View>
              )}
              <ThemedText
                style={[
                  styles.resultGlyph,
                  result.character.colorVariant && {
                    color: result.character.colorVariant.glyphColor,
                  },
                ]}>
                {result.character.glyph}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {result.isNew ? 'はじめてゲット!' : `${resultCount} 個目`}
              </ThemedText>

              <View style={styles.resultButtons}>
                <Pressable onPress={close} style={styles.secondaryButton}>
                  <ThemedText type="smallBold">とじる</ThemedText>
                </Pressable>
                <Pressable onPress={spinAgain} style={styles.primaryButton}>
                  <ThemedText type="smallBold" style={styles.spinButtonText}>
                    もう1回まわす
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.56,
    pointerEvents: 'none',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  languageBadge: {
    backgroundColor: '#E5484D',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  languageBadgeText: {
    color: '#FFFFFF',
  },
  machineArea: {
    flex: 1,
    justifyContent: 'center',
  },
  spinButton: {
    alignSelf: 'stretch',
    backgroundColor: '#E5484D',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonPressed: {
    opacity: 0.8,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 28,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  resultCard: {
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.four,
  },
  newBadge: {
    backgroundColor: '#E5484D',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  newBadgeText: {
    color: '#FFFFFF',
  },
  variantBadge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  variantBadgeText: {
    color: '#FFFFFF',
  },
  resultGlyph: {
    fontSize: 84,
    lineHeight: 100,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  resultButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  secondaryButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
    backgroundColor: '#F0F0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
