import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** レバーを回す演出の長さ (ms)。画面側のタイミング制御と共有する */
export const SPIN_DURATION = 1400;

const MINI_CAPSULE_COLORS = ['#FF6B6B', '#4FA8FF', '#FFD93D', '#6BCB77', '#A855F7', '#FF9F45'];

/** ドーム内に積まれたミニカプセルの配置 (ドーム座標系) */
const MINI_CAPSULES = [
  { left: 28, bottom: 10, size: 40 },
  { left: 66, bottom: 6, size: 44 },
  { left: 108, bottom: 12, size: 38 },
  { left: 44, bottom: 42, size: 36 },
  { left: 86, bottom: 44, size: 40 },
  { left: 16, bottom: 48, size: 32 },
];

type Props = {
  spinning: boolean;
};

export function GachaMachine({ spinning }: Props) {
  const handleRotation = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!spinning) return;
    handleRotation.value = 0;
    handleRotation.value = withTiming(720, {
      duration: SPIN_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });
    shake.value = withRepeat(
      withSequence(
        withTiming(-2.5, { duration: 70 }),
        withTiming(2.5, { duration: 70 }),
      ),
      Math.floor(SPIN_DURATION / 140),
      true,
    );
  }, [spinning, handleRotation, shake]);

  const machineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${handleRotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.machine, machineStyle]}>
      <View style={styles.dome}>
        {MINI_CAPSULES.map((capsule, index) => (
          <View
            key={index}
            style={[
              styles.miniCapsule,
              {
                left: capsule.left,
                bottom: capsule.bottom,
                width: capsule.size,
                height: capsule.size,
                borderRadius: capsule.size / 2,
                backgroundColor: MINI_CAPSULE_COLORS[index % MINI_CAPSULE_COLORS.length],
              },
            ]}
          />
        ))}
        <View style={styles.domeHighlight} />
      </View>

      <View style={styles.body}>
        <View style={styles.coinSlot} />
        <Animated.View style={[styles.handle, handleStyle]}>
          <View style={styles.handleBar} />
        </Animated.View>
        <View style={styles.chute} />
      </View>

      <View style={styles.foot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  machine: {
    alignItems: 'center',
  },
  dome: {
    width: 186,
    height: 150,
    borderTopLeftRadius: 93,
    borderTopRightRadius: 93,
    backgroundColor: 'rgba(160, 210, 255, 0.30)',
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: 'rgba(160, 210, 255, 0.65)',
    overflow: 'hidden',
  },
  domeHighlight: {
    position: 'absolute',
    top: 18,
    left: 26,
    width: 44,
    height: 22,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transform: [{ rotate: '-24deg' }],
  },
  miniCapsule: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  body: {
    width: 210,
    height: 150,
    borderRadius: 20,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    paddingTop: 14,
  },
  coinSlot: {
    position: 'absolute',
    top: 18,
    right: 22,
    width: 8,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#8E1B20',
  },
  handle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFF3F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#C63438',
  },
  handleBar: {
    width: 46,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C63438',
  },
  chute: {
    position: 'absolute',
    bottom: 16,
    width: 74,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7E181C',
    borderBottomWidth: 6,
    borderBottomColor: '#5D1114',
  },
  foot: {
    width: 230,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#B93338',
    marginTop: 2,
  },
});
