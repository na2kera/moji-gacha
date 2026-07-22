import { useEffect } from 'react';
import { type DimensionValue, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RarityColors } from '@/constants/rarity';
import type { Rarity } from '@/data/types';

type RevealPhase = 'rolling' | 'opening' | 'result';

type Props = {
  phase: RevealPhase;
  rarity: Rarity;
};

const RAYS = Array.from({ length: 12 }, (_, index) => index * 15);
const SPARKLES = [
  { left: '10%', top: '20%', size: 8, delay: 100 },
  { left: '22%', top: '35%', size: 5, delay: 720 },
  { left: '16%', top: '65%', size: 7, delay: 1300 },
  { left: '29%', top: '76%', size: 4, delay: 430 },
  { left: '38%', top: '15%', size: 5, delay: 1650 },
  { left: '62%', top: '18%', size: 7, delay: 980 },
  { left: '72%', top: '31%', size: 4, delay: 280 },
  { left: '87%', top: '23%', size: 6, delay: 1450 },
  { left: '81%', top: '57%', size: 8, delay: 610 },
  { left: '91%', top: '72%', size: 4, delay: 1880 },
  { left: '68%', top: '80%', size: 6, delay: 1180 },
  { left: '45%', top: '86%', size: 4, delay: 40 },
] as const;

function withAlpha(hex: string, alpha: number) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function Sparkle({
  color,
  delay,
  left,
  size,
  top,
}: {
  color: string;
  delay: number;
  left: DimensionValue;
  size: number;
  top: DimensionValue;
}) {
  const twinkle = useSharedValue(0);

  useEffect(() => {
    twinkle.value = withRepeat(
      withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1150, easing: Easing.in(Easing.quad) }),
        ),
      ),
      -1,
    );
    return () => cancelAnimation(twinkle);
  }, [delay, twinkle]);

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(twinkle.value, [0, 0.4, 1], [0.12, 0.95, 0.2]),
    transform: [
      { translateY: interpolate(twinkle.value, [0, 1], [5, -7]) },
      { rotate: '45deg' },
      { scale: interpolate(twinkle.value, [0, 0.45, 1], [0.55, 1.25, 0.7]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          backgroundColor: color,
          height: size,
          left,
          top,
          width: size,
        },
        sparkleStyle,
      ]}
    />
  );
}

/**
 * カプセル排出から結果表示までをつなぐ「小さな舞台」の背景演出。
 * レアリティ色を照明色として使い、前景のカプセル・文字を邪魔しない明度に抑える。
 */
export function RevealBackdrop({ phase, rarity }: Props) {
  const rotation = useSharedValue(0);
  const breath = useSharedValue(0);
  const burst = useSharedValue(0);
  const resultGlow = useSharedValue(0);
  const color = RarityColors[rarity];

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false,
    );
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(breath);
    };
  }, [breath, rotation]);

  useEffect(() => {
    if (phase === 'rolling') {
      burst.value = withTiming(0, { duration: 180 });
      resultGlow.value = withTiming(0, { duration: 180 });
      return;
    }

    if (phase === 'opening') {
      burst.value = 0;
      burst.value = withSequence(
        withDelay(100, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })),
        withTiming(0.36, { duration: 780, easing: Easing.out(Easing.quad) }),
      );
      resultGlow.value = withDelay(360, withTiming(1, { duration: 700 }));
      return;
    }

    burst.value = withTiming(0.22, { duration: 300 });
    resultGlow.value = withTiming(1, { duration: 450 });
  }, [burst, phase, resultGlow]);

  const rayFieldStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + burst.value * 0.32,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: 0.88 + burst.value * 0.24 + breath.value * 0.025 },
    ],
  }));

  const spotlightStyle = useAnimatedStyle(() => ({
    opacity: 0.34 + breath.value * 0.1 + resultGlow.value * 0.12,
    transform: [{ scale: 0.96 + breath.value * 0.04 + burst.value * 0.12 }],
  }));

  const floorGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + breath.value * 0.12 + burst.value * 0.25,
    transform: [{ scaleX: 0.94 + breath.value * 0.08 + burst.value * 0.14 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.25, 1], [0, 0.28, 0.8]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.72, 1.22]) }],
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.night} />
      <Animated.View
        style={[
          styles.spotlightOuter,
          { backgroundColor: withAlpha(color, 0.06) },
          spotlightStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.spotlightMiddle,
          { backgroundColor: withAlpha(color, 0.08) },
          spotlightStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.spotlightInner,
          {
            backgroundColor: withAlpha(color, 0.12),
            shadowColor: color,
          },
          spotlightStyle,
        ]}
      />

      <Animated.View style={[styles.rayField, rayFieldStyle]}>
        {RAYS.map((angle, index) => (
          <View
            key={angle}
            style={[
              styles.ray,
              {
                backgroundColor: index % 2 === 0 ? color : '#FFFFFF',
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.burstRing,
          { borderColor: withAlpha(color, 0.8) },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.floorGlow,
          { backgroundColor: withAlpha(color, 0.72) },
          floorGlowStyle,
        ]}
      />
      <View style={styles.floorShadow} />

      {SPARKLES.map((sparkle) => (
        <Sparkle key={`${sparkle.left}-${sparkle.top}`} color={color} {...sparkle} />
      ))}

      <View style={[styles.frameLine, styles.frameLineTop, { backgroundColor: color }]} />
      <View style={[styles.frameLine, styles.frameLineBottom, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  night: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080B18',
  },
  spotlightOuter: {
    position: 'absolute',
    width: 680,
    height: 880,
    borderRadius: 340,
  },
  spotlightMiddle: {
    position: 'absolute',
    width: 540,
    height: 740,
    borderRadius: 270,
  },
  spotlightInner: {
    position: 'absolute',
    width: 360,
    height: 560,
    borderRadius: 180,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 70,
  },
  rayField: {
    position: 'absolute',
    width: 560,
    height: 560,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 10,
    height: 520,
    borderRadius: 6,
    opacity: 0.5,
  },
  burstRing: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 2,
  },
  floorGlow: {
    position: 'absolute',
    width: 360,
    height: 72,
    borderRadius: 180,
    marginTop: 248,
  },
  floorShadow: {
    position: 'absolute',
    width: 270,
    height: 42,
    borderRadius: 135,
    marginTop: 262,
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  frameLine: {
    position: 'absolute',
    width: 104,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  frameLineTop: {
    top: 38,
    right: -26,
    transform: [{ rotate: '45deg' }],
  },
  frameLineBottom: {
    bottom: 38,
    left: -26,
    transform: [{ rotate: '45deg' }],
  },
});
