import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { characterById, variantsByBaseId } from '@/data/japanese';
import type { GachaCharacter } from '@/data/types';
import { useCollectionStore } from '@/store/collection';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function VariantRow({ variant }: { variant: GachaCharacter }) {
  const entry = useCollectionStore((state) => state.entries[variant.id]);

  return (
    <ThemedView type="backgroundElement" style={styles.variantRow}>
      <View style={styles.variantGlyphBox}>
        {entry ? (
          <ThemedText
            type="subtitle"
            style={[styles.variantGlyph, { color: variant.colorVariant?.glyphColor }]}>
            {variant.glyph}
          </ThemedText>
        ) : (
          <ThemedText type="subtitle" themeColor="textSecondary" style={styles.lockedGlyph}>
            ?
          </ThemedText>
        )}
      </View>
      <View style={styles.variantInfo}>
        <ThemedText type="smallBold">{variant.colorVariant?.label ?? '色違い'}</ThemedText>
        {entry ? (
          <ThemedText type="small" themeColor="textSecondary">
            ×{entry.count} / {formatDate(entry.firstObtainedAt)} に初獲得
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            未獲得
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

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
            <>
              <ThemedView
                type="backgroundElement"
                style={[styles.glyphCard, { borderColor: RarityColors[character.rarity] }]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: RarityColors[character.rarity] }}>
                  {'★'.repeat(RarityStars[character.rarity])} {RarityLabels[character.rarity]}
                </ThemedText>
                <ThemedText style={styles.glyph}>{character.glyph}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ×{entry.count} / {formatDate(entry.firstObtainedAt)} に初獲得
                </ThemedText>
              </ThemedView>

              {variants.length > 0 && (
                <View style={styles.variantSection}>
                  <ThemedText type="smallBold">色違い</ThemedText>
                  {variants.map((variant) => (
                    <VariantRow key={variant.id} variant={variant} />
                  ))}
                </View>
              )}
            </>
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
  glyph: {
    fontSize: 84,
    lineHeight: 100,
    fontWeight: '700',
  },
  lockedGlyph: {
    opacity: 0.4,
  },
  variantSection: {
    gap: Spacing.two,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  variantGlyphBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantGlyph: {
    fontSize: 36,
    lineHeight: 44,
  },
  variantInfo: {
    flex: 1,
    gap: Spacing.half,
  },
});
