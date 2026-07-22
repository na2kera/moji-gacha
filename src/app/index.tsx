import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapsuleReveal, OPEN_DURATION, ROLL_DURATION, WOBBLE_DURATION } from '@/components/gacha/capsule-reveal';
import { GachaMachine, SPIN_DURATION } from '@/components/gacha/gacha-machine';
import { RatesModal } from '@/components/gacha/rates-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppImages, GachaImages } from '@/constants/assets';
import { RarityCardBackgrounds, RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { characterById, japanese } from '@/data/japanese';
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

/** 図鑑(五十音表)のマス数。色違いは同じマスに入るので基本文字のみ数える */
const SHEET_SLOT_COUNT = japanese.characters.filter((c) => c.id === c.baseId).length;

/** 立体ボタンの「厚み」。押下時にこの分だけ沈む */
const BUTTON_DEPTH = 6;

/**
 * Duolingo式の立体CTAボタン。下辺に濃色の厚みがあり、押すと沈む。
 * 待機中はゆっくり脈動して「押して!」を伝える。
 */
function SpinButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const pressed = useSharedValue(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (disabled) {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 150 });
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [disabled, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(pressed.value ? BUTTON_DEPTH : 0, { duration: 70 }) },
    ],
  }));

  return (
    <Animated.View style={[styles.spinButtonBase, disabled && styles.spinButtonDisabled, pulseStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          pressed.value = true;
        }}
        onPressOut={() => {
          pressed.value = false;
        }}>
        <Animated.View style={[styles.spinButtonFace, faceStyle]}>
          <ThemedText type="subtitle" style={styles.spinButtonText}>
            {label}
          </ThemedText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

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
  // 図鑑のマス単位の進捗。色違いは基本文字と同じマスとして数える
  const obtainedCount = useCollectionStore((state) => {
    const ownedBaseIds = new Set<string>();
    for (const id of Object.keys(state.entries)) {
      const character = characterById.get(id);
      if (character) ownedBaseIds.add(character.baseId);
    }
    return ownedBaseIds.size;
  });
  const progress = SHEET_SLOT_COUNT === 0 ? 0 : obtainedCount / SHEET_SLOT_COUNT;
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

        <Pressable
          onPress={() => router.push('/collection')}
          style={({ pressed }) => [pressed && styles.progressChipPressed]}>
          <ThemedView type="backgroundElement" style={styles.progressChip}>
            <ThemedText type="smallBold">
              ずかん {obtainedCount} / {SHEET_SLOT_COUNT}
            </ThemedText>
            <View style={styles.progressChipTrack}>
              <View style={[styles.progressChipFill, { width: `${progress * 100}%` }]} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              あつめた
            </ThemedText>
          </ThemedView>
        </Pressable>

        <View style={styles.machineArea}>
          <GachaMachine spinning={phase === 'spinning'} onPress={phase === 'idle' ? spin : undefined} />
        </View>

        <SpinButton
          label={phase === 'spinning' ? 'まわしています…' : 'ガチャをまわす'}
          disabled={phase !== 'idle'}
          onPress={spin}
        />
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
            <Animated.View
              entering={ZoomIn.springify().damping(12)}
              style={[
                styles.resultCard,
                {
                  backgroundColor: RarityCardBackgrounds[result.character.rarity],
                  borderColor: RarityColors[result.character.rarity],
                },
                result.character.rarity === 'superRare' && styles.resultCardSuperRare,
              ]}>
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
    backgroundColor: Accent.primary,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  languageBadgeText: {
    color: Accent.onPrimary,
  },
  progressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  progressChipPressed: {
    opacity: 0.7,
  },
  progressChipTrack: {
    width: 72,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(96, 100, 108, 0.25)',
    overflow: 'hidden',
  },
  progressChipFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Accent.primary,
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
  spinButtonBase: {
    alignSelf: 'stretch',
    backgroundColor: Accent.primaryDark,
    borderRadius: Spacing.four,
  },
  spinButtonFace: {
    backgroundColor: Accent.primary,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginBottom: BUTTON_DEPTH,
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonPressed: {
    opacity: 0.8,
  },
  spinButtonText: {
    color: Accent.onPrimary,
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.four,
  },
  resultCardSuperRare: {
    borderWidth: 4,
    shadowColor: RarityColors.superRare,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 16,
  },
  newBadge: {
    backgroundColor: Accent.primary,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  newBadgeText: {
    color: Accent.onPrimary,
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
    backgroundColor: Accent.xBrand,
  },
  shareButtonXText: {
    color: Accent.onXBrand,
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
    backgroundColor: Accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
