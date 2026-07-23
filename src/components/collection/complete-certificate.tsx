import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Confetti } from '@/components/gacha/confetti';
import { ThemedText } from '@/components/themed-text';
import { AppImages } from '@/constants/assets';
import { Accent, Fonts, Spacing } from '@/constants/theme';
import { shareCompleteGeneric, shareCompleteToX } from '@/lib/share';

const GOLD_DARK = '#B87E00';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 例: 'ひらがな' */
  setLabel: string;
  totalCount: number;
  totalDraws: number;
  /** コンプリート日 (表示用)。null なら今日 */
  completedAt?: string | null;
};

/** 全文字コンプリート時に表示する賞状。SNS シェアの導線を兼ねる */
export function CompleteCertificate({
  visible,
  onClose,
  setLabel,
  totalCount,
  totalDraws,
  completedAt,
}: Props) {
  const date = completedAt ? new Date(completedAt) : new Date();
  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Confetti />
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.certificate}>
          <View style={styles.certificatePaper} />
          <View style={styles.innerFrame}>
            <ThemedText style={styles.title}>コンプリートしょうじょう</ThemedText>
            <Image source={AppImages.splashIcon} style={styles.icon} />
            <ThemedText style={styles.body}>
              {setLabel} ぜん {totalCount} 文字を{'\n'}すべてあつめたことを証します
            </ThemedText>
            <ThemedText style={styles.detail}>累計 {totalDraws} 回</ThemedText>
            <ThemedText style={styles.detail}>{dateLabel}</ThemedText>
            <ThemedText style={styles.appName}>もじガチャ</ThemedText>
          </View>
          <Image
            source={AppImages.completeCertificateFrame}
            style={styles.certificateFrame}
            contentFit="fill"
            pointerEvents="none"
          />
        </Animated.View>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => shareCompleteToX(setLabel, totalCount, totalDraws)}
            style={({ pressed }) => [styles.button, styles.buttonX, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.buttonLightText}>
              Xでシェア
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => shareCompleteGeneric(setLabel, totalCount, totalDraws)}
            style={({ pressed }) => [styles.button, styles.buttonShare, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.buttonLightText}>
              シェアする
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.button, styles.buttonClose, pressed && styles.pressed]}>
            <ThemedText type="smallBold">とじる</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  certificate: {
    width: 340,
    maxWidth: '100%',
    aspectRatio: 17 / 22,
    paddingTop: 70,
    paddingBottom: 42,
    paddingHorizontal: 34,
  },
  certificatePaper: {
    position: 'absolute',
    top: 24,
    right: 22,
    bottom: 24,
    left: 22,
    backgroundColor: '#FFFDF4',
    borderRadius: Spacing.four,
  },
  certificateFrame: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  innerFrame: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    color: GOLD_DARK,
  },
  icon: {
    width: 64,
    height: 61,
  },
  body: {
    fontFamily: Fonts.rounded,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '600',
    color: '#4A3B18',
    textAlign: 'center',
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A7B4D',
  },
  appName: {
    fontFamily: Fonts.rounded,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#4A3B18',
    marginTop: Spacing.one,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonX: {
    backgroundColor: Accent.xBrand,
  },
  buttonShare: {
    backgroundColor: Accent.primary,
  },
  buttonClose: {
    backgroundColor: '#F0F0F3',
  },
  buttonLightText: {
    color: Accent.onPrimary,
  },
  pressed: {
    opacity: 0.8,
  },
});
