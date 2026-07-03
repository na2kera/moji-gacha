import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Confetti } from './confetti';

import { RarityColors } from '@/constants/rarity';
import type { GachaCharacter } from '@/data/types';

/** カプセルが落ちてくる演出の長さ (ms) */
export const DROP_DURATION = 900;
/** 着地後にゆれる演出の長さ (ms) */
export const WOBBLE_DURATION = 640;
/** カプセルが開く演出の長さ (ms) */
export const OPEN_DURATION = 700;

const CAPSULE_SIZE = 150;

type Props = {
  character: GachaCharacter;
  stage: 'drop' | 'open';
};

export function CapsuleReveal({ character, stage }: Props) {
  const dropY = useSharedValue(-460);
  const wobble = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const glyphScale = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (stage === 'drop') {
      dropY.value = withTiming(0, {
        duration: DROP_DURATION,
        easing: Easing.bounce,
      });
      wobble.value = withDelay(
        DROP_DURATION,
        withRepeat(
          withSequence(
            withTiming(-7, { duration: 80 }),
            withTiming(7, { duration: 80 }),
          ),
          4,
          true,
        ),
      );
    } else {
      wobble.value = withTiming(0, { duration: 80 });
      flash.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 420 }),
      );
      openProgress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      glyphScale.value = withDelay(
        160,
        withSpring(1, { damping: 10, stiffness: 140 }),
      );
    }
  }, [stage, dropY, wobble, openProgress, glyphScale, flash]);

  const capsuleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dropY.value }, { rotate: `${wobble.value}deg` }],
  }));

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
    transform: [{ scale: glyphScale.value }],
  }));

  const rarityColor = RarityColors[character.rarity];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.flash, flashStyle]} />
      {stage === 'open' && <Confetti />}

      <Animated.View style={[styles.glyphWrapper, glyphStyle]}>
        <View style={[styles.glyphGlow, { backgroundColor: rarityColor }]} />
        <Animated.Text style={styles.glyph}>{character.glyph}</Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.capsule, capsuleStyle]} pointerEvents="none">
        <Animated.View
          style={[styles.capsuleHalf, styles.capsuleTop, { backgroundColor: rarityColor }, topHalfStyle]}
        />
        <Animated.View style={[styles.capsuleHalf, styles.capsuleBottom, bottomHalfStyle]} />
        <View style={styles.capsuleSeam} />
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
    height: CAPSULE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleHalf: {
    position: 'absolute',
    width: CAPSULE_SIZE,
    height: CAPSULE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  capsuleTop: {
    top: 0,
    borderTopLeftRadius: CAPSULE_SIZE / 2,
    borderTopRightRadius: CAPSULE_SIZE / 2,
    borderBottomWidth: 0,
  },
  capsuleBottom: {
    bottom: 0,
    backgroundColor: '#FFF8F0',
    borderBottomLeftRadius: CAPSULE_SIZE / 2,
    borderBottomRightRadius: CAPSULE_SIZE / 2,
    borderTopWidth: 0,
  },
  capsuleSeam: {
    position: 'absolute',
    width: CAPSULE_SIZE,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
