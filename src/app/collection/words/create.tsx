import { useState } from 'react';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WordGlyphs } from '@/components/words/word-glyphs';
import { Accent, BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { languages } from '@/data/languages';
import type { GachaCharacter } from '@/data/types';
import { haptics } from '@/lib/haptics';
import { sounds } from '@/lib/sounds';
import { useCollectionStore } from '@/store/collection';
import { useWordsStore } from '@/store/words';

/** 1つのことばに使える文字数の上限 */
const MAX_WORD_LENGTH = 10;

function PaletteTile({
  character,
  remaining,
  totalCopies,
  wordFull,
  onPress,
}: {
  character: GachaCharacter;
  /** いま使える残り枚数。所持数からことばに使った分を引いた値 */
  remaining: number;
  totalCopies: number;
  /** ことばが文字数上限に達していて、これ以上追加できない */
  wordFull: boolean;
  onPress: () => void;
}) {
  const exhausted = remaining <= 0;
  const disabled = exhausted || wordFull;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.tileInner, disabled && styles.tileExhausted]}>
        <ThemedText
          style={[
            styles.tileGlyph,
            character.colorVariant && { color: character.colorVariant.glyphColor },
          ]}>
          {character.glyph}
        </ThemedText>
        {totalCopies > 1 && (
          <View style={[styles.tileBadge, disabled && styles.tileBadgeExhausted]}>
            <ThemedText type="smallBold" style={styles.tileBadgeText}>
              ×{remaining}
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </Pressable>
  );
}

export default function CreateWordScreen() {
  const entries = useCollectionStore((state) => state.entries);
  const addWord = useWordsStore((state) => state.addWord);
  // 組み立て中のことば (文字ID列)
  const [characterIds, setCharacterIds] = useState<string[]>([]);

  // 所持している文字だけをパレットに出す。言語ごとにまとめ、所持ゼロの言語は出さない
  const paletteSections = languages
    .map((language) => ({
      language,
      characters: language.characters.filter((c) => entries[c.id]),
    }))
    .filter((section) => section.characters.length > 0);

  const usedCounts = characterIds.reduce<Record<string, number>>((counts, id) => {
    counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {});
  const wordFull = characterIds.length >= MAX_WORD_LENGTH;

  const appendCharacter = (character: GachaCharacter) => {
    // タイル側の disabled が守っているが、所持数と文字数の上限はここでも保証する
    const remaining = (entries[character.id]?.count ?? 0) - (usedCounts[character.id] ?? 0);
    if (wordFull || remaining <= 0) return;
    haptics.selection();
    setCharacterIds((current) => [...current, character.id]);
  };

  const removeCharacterAt = (index: number) => {
    haptics.selection();
    setCharacterIds((current) => current.filter((_, i) => i !== index));
  };

  const clearWord = () => {
    haptics.selection();
    setCharacterIds([]);
  };

  const saveWord = () => {
    if (characterIds.length === 0) return;
    addWord(characterIds);
    haptics.success();
    sounds.sparkle();
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => pressed && styles.pressed}
              hitSlop={Spacing.two}>
              <ThemedView type="backgroundElement" style={styles.backButton}>
                <ThemedText type="smallBold">← もどる</ThemedText>
              </ThemedView>
            </Pressable>
            <ThemedText type="subtitle">ことばづくり</ThemedText>
          </View>

          <View style={styles.previewCard}>
            {characterIds.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                したの文字をタップしてことばを作ろう!
              </ThemedText>
            ) : (
              <WordGlyphs
                characterIds={characterIds}
                size="large"
                onPressGlyph={removeCharacterAt}
              />
            )}
            {characterIds.length > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {wordFull
                  ? `ことばは ${MAX_WORD_LENGTH} 文字まで!文字をタップするとけせるよ`
                  : `文字をタップするとけせるよ (${characterIds.length}/${MAX_WORD_LENGTH})`}
              </ThemedText>
            )}
          </View>

          <View style={styles.controlRow}>
            <Pressable
              disabled={characterIds.length === 0}
              onPress={clearWord}
              style={({ pressed }) => [
                styles.clearButton,
                characterIds.length === 0 && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ぜんぶけす
              </ThemedText>
            </Pressable>
            <Pressable
              disabled={characterIds.length === 0}
              onPress={saveWord}
              style={({ pressed }) => [
                styles.saveButton,
                characterIds.length === 0 && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.saveButtonText}>
                できた!ほぞんする
              </ThemedText>
            </Pressable>
          </View>

          {paletteSections.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyEmoji}>🎰</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                まだ文字を持っていません
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                まずはガチャをまわして文字を集めよう!
              </ThemedText>
            </View>
          ) : (
            paletteSections.map(({ language, characters }) => (
              <View key={language.id} style={styles.paletteSection}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.paletteTitle}>
                  {language.flag} {language.label}
                </ThemedText>
                <View style={styles.paletteGrid}>
                  {characters.map((character) => {
                    const totalCopies = entries[character.id]?.count ?? 0;
                    const remaining = totalCopies - (usedCounts[character.id] ?? 0);
                    return (
                      <PaletteTile
                        key={character.id}
                        character={character}
                        remaining={remaining}
                        totalCopies={totalCopies}
                        wordFull={wordFull}
                        onPress={() => appendCharacter(character)}
                      />
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    // web はタブバーが画面上部に浮いているため、ヘッダーがその下に隠れないよう余白を広げる
    paddingTop: Platform.select({ web: 80 }) ?? Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  previewCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 120,
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#88888866',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  controlRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  clearButton: {
    borderRadius: Spacing.three,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#88888866',
  },
  saveButton: {
    flex: 1,
    borderRadius: Spacing.three,
    minHeight: 44,
    backgroundColor: Accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Accent.onPrimary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#88888866',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
  },
  emptyEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  paletteSection: {
    gap: Spacing.two,
  },
  paletteTitle: {
    fontFamily: Fonts.rounded,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    width: 56,
    height: 56,
  },
  tileInner: {
    flex: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileExhausted: {
    opacity: 0.35,
  },
  tileGlyph: {
    fontFamily: Fonts.rounded,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: 600,
  },
  tileBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: Accent.primary,
  },
  tileBadgeExhausted: {
    backgroundColor: '#888888',
  },
  tileBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },
});
