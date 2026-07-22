import { useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Confetti } from './confetti';

import { GachaImages } from '@/constants/assets';
import { RarityColors } from '@/constants/rarity';
import type { GachaCharacter } from '@/data/types';

/** カプセルが転がって登場する演出の長さ (ms) */
export const ROLL_DURATION = 1100;
/** 到着後にゆれる演出の長さ (ms) */
export const WOBBLE_DURATION = 640;
/** カプセルが開く演出の長さ (ms) */
export const OPEN_DURATION = 700;
/** 開き始めてから文字が飛び出すまでの間 (ms) */
const GLYPH_DELAY = 360;

const CAPSULE_SIZE = 150;
const CAPSULE_HALF_HEIGHT = CAPSULE_SIZE / 2;
// 上下パーツの素材は開いた口の縁まで描かれているため、
// そのまま並べると半開きに見える。重ねて閉じた見た目にする
const CAPSULE_OVERLAP = 30;
const CAPSULE_HEIGHT = CAPSULE_HALF_HEIGHT * 2 - CAPSULE_OVERLAP;
const ROLL_DISTANCE = 300;

type Props = {
  character: GachaCharacter;
  stage: 'roll' | 'open';
};

export function CapsuleReveal({ character, stage }: Props) {
  const rollX = useSharedValue(-ROLL_DISTANCE);
  const wobble = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const glyphScale = useSharedValue(0);
  const flash = useSharedValue(0);
  const shockwave = useSharedValue(0);
  const glyphShake = useSharedValue(0);
  const confirmAura = useSharedValue(0);

  // 濁音・半濁音は「音が響く」イメージで揺れと衝撃波を加えた特別演出にする
  const hasSoundMark = character.soundMark != null;
  // 超レアは開封前から金色に発光させる「確定演出」(ソシャゲガチャの定番)
  const isSuperRare = character.rarity === 'superRare';

  useEffect(() => {
    if (stage === 'roll') {
      rollX.value = withTiming(0, {
        duration: ROLL_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      if (isSuperRare) {
        // カプセルが到着してから光り始め、開封まで脈動し続ける
        confirmAura.value = withDelay(
          ROLL_DURATION,
          withSequence(
            withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
            withRepeat(
              withSequence(
                withTiming(0.55, { duration: 600, easing: Easing.inOut(Easing.sin) }),
                withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
              ),
              -1,
            ),
          ),
        );
      }
      const wobbleAmp = hasSoundMark ? 13 : 7;
      wobble.value = withDelay(
        ROLL_DURATION,
        withRepeat(
          withSequence(
            withTiming(-wobbleAmp, { duration: 80 }),
            withTiming(wobbleAmp, { duration: 80 }),
          ),
          4,
          true,
        ),
      );
    } else {
      confirmAura.value = withTiming(0, { duration: 300 });
      wobble.value = withTiming(0, { duration: 80 });
      openProgress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      // 開き始めた瞬間に光がはじけ、少し遅れて中から文字が飛び出す
      flash.value = withDelay(
        120,
        withSequence(
          withTiming(1, { duration: 120 }),
          withTiming(0, { duration: 420 }),
        ),
      );
      glyphScale.value = withDelay(
        GLYPH_DELAY,
        withSpring(1, { damping: 10, stiffness: 140 }),
      );
      if (hasSoundMark) {
        shockwave.value = withDelay(
          GLYPH_DELAY,
          withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
        );
        glyphShake.value = withDelay(
          GLYPH_DELAY + 240,
          withRepeat(
            withSequence(
              withTiming(-5, { duration: 45 }),
              withTiming(5, { duration: 45 }),
            ),
            4,
            true,
          ),
        );
      }
    }
  }, [stage, hasSoundMark, isSuperRare, rollX, wobble, openProgress, glyphScale, flash, shockwave, glyphShake, confirmAura]);

  const capsuleStyle = useAnimatedStyle(() => {
    // 移動距離に合わせて回転させ、床を転がってくる見た目にする
    const rollRotation = (rollX.value / CAPSULE_HALF_HEIGHT) * (180 / Math.PI);
    return {
      transform: [
        { translateX: rollX.value },
        { rotate: `${rollRotation + wobble.value}deg` },
      ],
    };
  });

  const topHalfStyle = useAnimatedStyle(() => ({
    opacity: 1 - openProgress.value * 0.9,
    transform: [
      { translateY: openProgress.value * -150 },
      { rotate: `${openProgress.value * -32}deg` },
    ],
  }));

  const bottomHalfStyle = useAnimatedStyle(() => ({
    opacity: 1 - openProgress.value * 0.9,
    transform: [
      { translateY: openProgress.value * 110 },
      { rotate: `${openProgress.value * 20}deg` },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 1 + flash.value * 2.2 }],
  }));

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glyphScale.value }, { translateX: glyphShake.value }],
  }));

  // 内側→外側の順で時間差をつけて広がる 2 本の衝撃波リング
  const shockwaveInnerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shockwave.value, [0, 0.1, 1], [0, 0.9, 0]),
    transform: [{ scale: interpolate(shockwave.value, [0, 1], [0.4, 2.1]) }],
  }));

  const shockwaveOuterStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shockwave.value,
      [0, 0.3, 0.4, 1],
      [0, 0, 0.7, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          shockwave.value,
          [0.3, 1],
          [0.4, 2.7],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const confirmAuraStyle = useAnimatedStyle(() => ({
    opacity: confirmAura.value * 0.95,
    transform: [{ scale: 0.8 + confirmAura.value * 0.35 }],
  }));

  const glowColor = character.colorVariant?.glowColor ?? RarityColors[character.rarity];
  const glyphColor = character.colorVariant?.glyphColor ?? '#FFFFFF';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.flash, flashStyle]} />
      {isSuperRare && stage === 'roll' && (
        <Animated.View style={[styles.confirmAura, confirmAuraStyle]} pointerEvents="none">
          <Image
            source={GachaImages.effects.superRareAura}
            style={styles.confirmAuraImage}
          />
        </Animated.View>
      )}
      {character.rarity === 'superRare' && stage === 'open' && (
        <Image
          source={GachaImages.effects.superRareAura}
          style={styles.superRareAura}
        />
      )}
      {stage === 'open' && <Confetti />}

      {hasSoundMark && stage === 'open' && (
        <>
          <Animated.View
            style={[styles.shockwave, { borderColor: glowColor }, shockwaveInnerStyle]}
          />
          <Animated.View
            style={[styles.shockwave, { borderColor: glowColor }, shockwaveOuterStyle]}
          />
        </>
      )}

      <Animated.View style={[styles.glyphWrapper, glyphStyle]}>
        <View style={[styles.glyphGlow, { backgroundColor: glowColor }]} />
        <Animated.Text style={[styles.glyph, { color: glyphColor }]}>
          {character.glyph}
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.capsule, capsuleStyle]} pointerEvents="none">
        {/* 上パーツの縁で下パーツの口を隠すため、下パーツを先に描く */}
        <Animated.View style={[styles.capsuleHalf, styles.capsuleBottom, bottomHalfStyle]}>
          <Image
            source={GachaImages.capsule.bottom}
            style={styles.capsuleImage}
          />
        </Animated.View>
        <Animated.View style={[styles.capsuleHalf, styles.capsuleTop, topHalfStyle]}>
          <Image
            source={GachaImages.capsule.top[character.rarity]}
            style={styles.capsuleImage}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
  },
  capsule: {
    width: CAPSULE_SIZE,
    height: CAPSULE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleHalf: {
    position: 'absolute',
    width: CAPSULE_SIZE,
    height: CAPSULE_HALF_HEIGHT,
  },
  capsuleTop: {
    top: 0,
  },
  capsuleBottom: {
    bottom: 0,
  },
  capsuleImage: {
    width: CAPSULE_SIZE,
    height: CAPSULE_HALF_HEIGHT,
  },
  shockwave: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
  },
  superRareAura: {
    position: 'absolute',
    width: 300,
    height: 300,
    opacity: 0.9,
  },
  confirmAura: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAuraImage: {
    width: 280,
    height: 280,
  },
  glyphWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.28,
  },
  glyph: {
    fontSize: 96,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
});
