import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { languages } from '@/data/languages';
import type { LanguageSet } from '@/data/types';
import type { SwitchDirection } from '@/hooks/use-language';

type Props = {
  language: LanguageSet;
  onSwitch: (direction: SwitchDirection) => void;
  /** ガチャ演出中など、切り替えできないタイミングで true */
  disabled?: boolean;
};

/**
 * ヘッダー用の言語切替バッジ。矢印タップ・バッジタップで隣の言語に切り替える。
 * 画面自体の横スワイプでも切り替わることをドットで示す。
 */
export function LanguageSwitcher({ language, onSwitch, disabled }: Props) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onSwitch(-1)}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="前の言語にする"
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.chevron}>
            ‹
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onSwitch(1)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`言語をかえる (いまは${language.label})`}
          style={({ pressed }) => [styles.badge, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.badgeText}>
            {language.flag} {language.label}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onSwitch(1)}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="次の言語にする"
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.chevron}>
            ›
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.dots}>
        {languages.map((item) => (
          <View
            key={item.id}
            style={[styles.dot, item.id === language.id && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  chevron: {
    fontSize: 18,
    lineHeight: 22,
  },
  badge: {
    backgroundColor: Accent.primary,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  badgeText: {
    color: Accent.onPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(128, 128, 136, 0.4)',
  },
  dotActive: {
    backgroundColor: Accent.primary,
  },
});
