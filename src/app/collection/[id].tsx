import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CharacterShowcase } from '@/components/collection/character-showcase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { characterById, variantsByBaseId } from '@/data/japanese';
import { useCollectionStore } from '@/store/collection';

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = id ? characterById.get(id) : undefined;
  const entry = useCollectionStore((state) =>
    character ? state.entries[character.id] : undefined,
  );
  const variants = character ? (variantsByBaseId.get(character.id) ?? []) : [];

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
          </View>

          {character && entry ? (
            <CharacterShowcase baseCharacter={character} variants={variants} />
          ) : (
            <ThemedView type="backgroundElement" style={styles.glyphCard}>
              <ThemedText type="subtitle" themeColor="textSecondary" style={styles.lockedGlyph}>
                ?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                まだ獲得していません
              </ThemedText>
            </ThemedView>
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
    // web はタブバーが画面上部に浮いているため、もどるボタンがその下に隠れないよう余白を広げる
    paddingTop: Platform.select({ web: 80 }) ?? Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  glyphCard: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.four,
  },
  lockedGlyph: {
    opacity: 0.4,
  },
});
