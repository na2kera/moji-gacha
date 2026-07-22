import { useMemo, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import type { SwitchDirection } from '@/hooks/use-language';

/** スワイプと判定する最小の横移動量 (px) */
const SWIPE_THRESHOLD = 56;

type Props = {
  /** ガチャ演出中など、切り替えできないタイミングで false */
  enabled?: boolean;
  onSwipe: (direction: SwitchDirection) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * 横スワイプで言語を切り替えるためのラッパー。
 * 縦スクロールと共存できるよう、横方向にしっかり動いたときだけ反応する。
 */
export function LanguageSwipe({ enabled = true, onSwipe, style, children }: Props) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-24, 24])
        .failOffsetY([-16, 16])
        .runOnJS(true)
        .onEnd((event) => {
          if (event.translationX <= -SWIPE_THRESHOLD) {
            onSwipe(1);
          } else if (event.translationX >= SWIPE_THRESHOLD) {
            onSwipe(-1);
          }
        }),
    [enabled, onSwipe],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={style} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}
