import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { characterById } from '@/data/languages';

/** 文字ID列を glyph の連結文字列にする (シェア文言用。色の情報は含まれない) */
export function wordToPlainText(characterIds: string[]): string {
  return characterIds.map((id) => characterById.get(id)?.glyph ?? '').join('');
}

/**
 * 文字ID列をことばとして描画する。色違いはその文字の色で表示される。
 * リスト表示 (medium) とことばづくりのプレビュー (large + onPressGlyph) で共用する。
 */
export function WordGlyphs({
  characterIds,
  size = 'medium',
  onPressGlyph,
}: {
  characterIds: string[];
  size?: 'medium' | 'large';
  /** 指定すると各文字がタップできるようになる (index はことば内の位置) */
  onPressGlyph?: (index: number) => void;
}) {
  return (
    <View style={styles.row}>
      {characterIds.map((id, index) => {
        const character = characterById.get(id);
        if (!character) return null;
        const glyph = (
          <ThemedText
            style={[
              size === 'large' ? styles.glyphLarge : styles.glyphMedium,
              character.colorVariant && { color: character.colorVariant.glyphColor },
            ]}>
            {character.glyph}
          </ThemedText>
        );
        if (!onPressGlyph) {
          return <View key={`${id}-${index}`}>{glyph}</View>;
        }
        return (
          <Pressable
            key={`${id}-${index}`}
            onPress={() => onPressGlyph(index)}
            style={({ pressed }) => pressed && styles.pressed}>
            {glyph}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  glyphMedium: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 40,
    fontWeight: 600,
  },
  glyphLarge: {
    fontFamily: Fonts.rounded,
    fontSize: 40,
    lineHeight: 56,
    fontWeight: 600,
  },
});
