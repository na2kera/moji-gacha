import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#FF6B6B', '#4FA8FF', '#FFD93D', '#6BCB77', '#A855F7', '#FF9F45'];
const PARTICLE_COUNT = 26;

type ParticleSpec = {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  spin: number;
};

function createParticles(): ParticleSpec[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4,
    distance: 110 + Math.random() * 130,
    size: 8 + Math.random() * 8,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 120,
    duration: 700 + Math.random() * 500,
    spin: (Math.random() - 0.5) * 720,
  }));
}

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withTiming(1, { duration: spec.duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, spec]);

  const style = useAnimatedStyle(() => {
    const distance = spec.distance * progress.value;
    // 後半は落下しながらフェードアウト
    const gravity = interpolate(progress.value, [0, 0.5, 1], [0, 10, 70]);
    return {
      opacity: interpolate(progress.value, [0, 0.7, 1], [1, 1, 0]),
      transform: [
        { translateX: Math.cos(spec.angle) * distance },
        { translateY: Math.sin(spec.angle) * distance + gravity },
        { rotate: `${spec.spin * progress.value}deg` },
        { scale: interpolate(progress.value, [0, 0.15, 1], [0, 1, 0.8]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: spec.size,
          height: spec.size * 0.6,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

/** カプセル開封時に中心から弾ける紙吹雪 */
export function Confetti() {
  const particles = useMemo(() => createParticles(), []);
  return (
    <Animated.View pointerEvents="none" style={styles.container}>
      {particles.map((spec, index) => (
        <Particle key={index} spec={spec} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});
