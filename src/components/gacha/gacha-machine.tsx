import { useEffect } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GachaImages } from '@/constants/assets';

/** レバーを回す演出の長さ (ms)。画面側のタイミング制御と共有する */
export const SPIN_DURATION = 1400;

type Props = {
  spinning: boolean;
  languageId: string;
  /** マシン本体タップでも回せるようにする (Pokémon GO 的な直接操作感) */
  onPress?: () => void;
};

type MachineLanguageId = keyof typeof GachaImages.machine.body;

export function GachaMachine({ spinning, languageId, onPress }: Props) {
  const handleRotation = useSharedValue(0);
  const shake = useSharedValue(0);
  const breathe = useSharedValue(1);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (!spinning) {
      // 回転中の揺れが残っていたら中央に戻す
      cancelAnimation(shake);
      shake.value = withTiming(0, { duration: 120 });
      // 待機中: ゆっくり呼吸するように伸縮して「生きている」感を出す
      // (Duolingo のマスコット的な常時アニメ)
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
      return () => {
        cancelAnimation(breathe);
        breathe.value = 1;
      };
    }

    handleRotation.value = 0;
    handleRotation.value = withTiming(720, {
      duration: SPIN_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });
    // 回転中は小さく揺れて「動いている」感を出す。高速で大きく振ると
    // ガタガタしてうるさいので、振幅・周期ともに控えめにする (#42)
    shake.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 110, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.5, { duration: 110, easing: Easing.inOut(Easing.sin) }),
      ),
      Math.floor(SPIN_DURATION / 220),
      true,
    );
  }, [spinning, handleRotation, shake, breathe]);

  const machineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { scale: breathe.value * pressScale.value },
    ],
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${handleRotation.value}deg` }],
  }));
  const machineBody =
    GachaImages.machine.body[languageId as MachineLanguageId] ??
    GachaImages.machine.body.japanese;

  return (
    <Pressable
      onPress={onPress}
      disabled={onPress == null || spinning}
      onPressIn={() => {
        pressScale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 140 });
      }}
      accessibilityRole="button"
      accessibilityLabel="ガチャマシンをまわす">
      <Animated.View style={[styles.machine, machineStyle]}>
        <Image
          source={machineBody}
          style={styles.machineBody}
        />
        <Animated.View style={[styles.handle, handleStyle]}>
          <Image
            source={GachaImages.machine.handle}
            style={styles.handleImage}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
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
