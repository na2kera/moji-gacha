import { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapsuleReveal, OPEN_DURATION, ROLL_DURATION, WOBBLE_DURATION } from '@/components/gacha/capsule-reveal';
import { GachaMachine, SPIN_DURATION } from '@/components/gacha/gacha-machine';
import { RatesModal } from '@/components/gacha/rates-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppImages, GachaImages } from '@/constants/assets';
import { RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { japanese } from '@/data/japanese';
import type { GachaCharacter } from '@/data/types';
import { drawCharacter } from '@/lib/gacha';
import { haptics } from '@/lib/haptics';
import { applyLuckyBoost, getLuckyCharacter, localDateKey, LUCKY_WEIGHT_MULTIPLIER } from '@/lib/lucky';
import { shareGeneric, shareToX } from '@/lib/share';
import { sounds } from '@/lib/sounds';
import { useCollectionStore } from '@/store/collection';
import { useSettingsStore } from '@/store/settings';

type Phase = 'idle' | 'spinning' | 'rolling' | 'opening' | 'result';

type DrawResult = {
  character: GachaCharacter;
  isNew: boolean;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function GachaScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<DrawResult | null>(null);
  const [ratesVisible, setRatesVisible] = useState(false);
  const busyRef = useRef(false);
  const colorScheme = useColorScheme();
  const backgroundImage = GachaImages.background[colorScheme === 'dark' ? 'dark' : 'light'];

  const recordDraw = useCollectionStore((state) => state.recordDraw);
  const totalDraws = useCollectionStore((state) => state.totalDraws);
  const streakDays = useCollectionStore((state) => state.streakDays);
  const resultCount = useCollectionStore((state) =>
    result ? (state.entries[result.character.id]?.count ?? 0) : 0,
  );
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const toggleSound = useSettingsStore((state) => state.toggleSound);

  // 毎日変わるラッキー文字。この文字 (色違い含む) は排出率アップ
  const luckyCharacter = getLuckyCharacter(japanese.characters, localDateKey());

  const spin = async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    const character = drawCharacter(applyLuckyBoost(japanese.characters, luckyCharacter.baseId));
    // isNew は開封直前の recordDraw で確定させる。ここでは落下演出用に文字だけ保持する
    setResult({ character, isNew: false });
    setPhase('spinning');
    sounds.spin();

    const tick = setInterval(() => haptics.selection(), 150);
    await delay(SPIN_DURATION);
    clearInterval(tick);

    setPhase('rolling');
    await delay(ROLL_DURATION);
    haptics.heavy();
    sounds.drop();
    await delay(WOBBLE_DURATION);

    const { isNew } = recordDraw(character.id);
    setResult({ character, isNew });
    setPhase('opening');
    haptics.success();
    sounds.pop();
    if (character.rarity === 'superRare') {
      sounds.sparkle();
    }
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
          <Image source={AppImages.splashIcon} style={styles.headerIcon} />
          <ThemedText type="subtitle">もじガチャ</ThemedText>
          <View style={styles.languageBadge}>
            <ThemedText type="smallBold" style={styles.languageBadgeText}>
              {japanese.label}
            </ThemedText>
          </View>
          <Pressable
            onPress={toggleSound}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={soundEnabled ? '効果音をオフにする' : '効果音をオンにする'}
            style={({ pressed }) => [styles.soundToggle, pressed && styles.spinButtonPressed]}>
            <ThemedText style={styles.soundToggleIcon}>{soundEnabled ? '🔊' : '🔇'}</ThemedText>
          </Pressable>
        </View>
        <View style={styles.statusRow}>
          <ThemedText type="small" themeColor="textSecondary">
            これまでに {totalDraws} 回まわしました
          </ThemedText>
          {streakDays >= 2 && (
            <View style={styles.streakChip}>
              <ThemedText type="smallBold" style={styles.streakChipText}>
                🔥 {streakDays}日連続
              </ThemedText>
            </View>
          )}
        </View>
        <View style={styles.statusRow}>
          <View style={styles.luckyChip}>
            <ThemedText type="smallBold" style={styles.luckyChipText}>
              ✨ きょうのラッキー文字「{luckyCharacter.glyph}」 排出率{LUCKY_WEIGHT_MULTIPLIER}倍!
            </ThemedText>
          </View>
          <Pressable onPress={() => setRatesVisible(true)} hitSlop={8}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.ratesLink}>
              排出率
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.machineArea}>
          <GachaMachine spinning={phase === 'spinning'} onPress={phase === 'idle' ? spin : undefined} />
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
              {result.character.baseId === luckyCharacter.baseId && (
                <View style={styles.luckyBadge}>
                  <ThemedText type="smallBold" style={styles.luckyBadgeText}>
                    ✨ ラッキー文字ゲット!
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

              <View style={styles.shareButtons}>
                <Pressable
                  onPress={() => shareToX(result.character)}
                  style={({ pressed }) => [
                    styles.shareButton,
                    styles.shareButtonX,
                    pressed && styles.spinButtonPressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.shareButtonXText}>
                    Xでシェア
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => shareGeneric(result.character)}
                  style={({ pressed }) => [
                    styles.shareButton,
                    styles.secondaryButton,
                    pressed && styles.spinButtonPressed,
                  ]}>
                  <ThemedText type="smallBold">シェアする</ThemedText>
                </Pressable>
              </View>

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

      <RatesModal
        visible={ratesVisible}
        onClose={() => setRatesVisible(false)}
        characters={japanese.characters}
        luckyGlyph={luckyCharacter.glyph}
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
  headerIcon: {
    height: 42,
    width: 44,
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
  soundToggle: {
    marginLeft: Spacing.one,
  },
  soundToggleIcon: {
    fontSize: 20,
    lineHeight: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  streakChip: {
    backgroundColor: '#FFF1E0',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  streakChipText: {
    color: '#C75A00',
    fontSize: 12,
    lineHeight: 18,
  },
  luckyChip: {
    backgroundColor: '#FFF7D6',
    borderColor: '#F5A80B',
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  luckyChipText: {
    color: '#B87E00',
    fontSize: 12,
    lineHeight: 18,
  },
  ratesLink: {
    textDecorationLine: 'underline',
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
  luckyBadge: {
    backgroundColor: '#FFF7D6',
    borderColor: '#F5A80B',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  luckyBadgeText: {
    color: '#B87E00',
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
  shareButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  shareButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonX: {
    backgroundColor: '#000000',
  },
  shareButtonXText: {
    color: '#FFFFFF',
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
