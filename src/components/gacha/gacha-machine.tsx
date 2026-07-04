import { useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
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
      <Image
        source={require('@/assets/images/gacha/gacha-machine-body.png')}
        style={styles.machineBody}
      />
      <Animated.View style={[styles.handle, handleStyle]}>
        <Image
          source={require('@/assets/images/gacha/gacha-machine-handle.png')}
          style={styles.handleImage}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  machine: {
    width: 230,
    height: 312,
  },
  machineBody: {
    width: 230,
    height: 312,
  },
  handle: {
    position: 'absolute',
    top: 174,
    left: 128,
    width: 74,
    height: 74,
  },
  handleImage: {
    width: 74,
    height: 74,
  },
});
