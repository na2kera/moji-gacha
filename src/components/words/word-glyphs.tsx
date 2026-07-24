import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { characterById } from '@/data/languages';

/** 保存済みのことばを、色違いの色を反映した文字列として組み立てる (シェア文言用) */
export function wordToPlainText(characterIds: string[]): string {
  return characterIds.map((id) => characterById.get(id)?.glyph ?? '').join('');
}

/**
 * 文字ID列をことばとして描画する。色違いはその文字の色で表示される。
 * リスト表示 (medium) とことばづくりのプレビュー (large) で共用する。
 */
export function WordGlyphs({
  characterIds,
  size = 'medium',
}: {
  characterIds: string[];
  size?: 'medium' | 'large';
}) {
  return (
    <View style={styles.row}>
      {characterIds.map((id, index) => {
        const character = characterById.get(id);
        if (!character) return null;
        return (
          <ThemedText
            key={`${id}-${index}`}
            style={[
              size === 'large' ? styles.glyphLarge : styles.glyphMedium,
              character.colorVariant && { color: character.colorVariant.glyphColor },
            ]}>
            {character.glyph}
          </ThemedText>
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
