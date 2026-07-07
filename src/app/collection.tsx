import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RarityColors } from '@/constants/rarity';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { japanese } from '@/data/japanese';
import type { GachaCharacter } from '@/data/types';
import { useCollectionStore } from '@/store/collection';

const characterById = new Map(japanese.characters.map((c) => [c.id, c]));
const variantsByBaseId = japanese.characters.reduce((map, character) => {
  if (character.id === character.baseId) return map;
  const variants = map.get(character.baseId) ?? [];
  variants.push(character);
  map.set(character.baseId, variants);
  return map;
}, new Map<string, GachaCharacter[]>());

function SheetCell({ character }: { character: GachaCharacter | null }) {
  const entries = useCollectionStore((state) => state.entries);
  const collection = (() => {
    if (!character) {
      return { ownedCount: 0, totalCopies: 0, colorVariant: undefined };
    }

    const characters = [character, ...(variantsByBaseId.get(character.id) ?? [])];
    return characters.reduce<{
      ownedCount: number;
      totalCopies: number;
      colorVariant: GachaCharacter['colorVariant'];
    }>(
      (summary, current) => {
        const entry = entries[current.id];
        if (!entry) return summary;

        return {
          ownedCount: summary.ownedCount + 1,
          totalCopies: summary.totalCopies + entry.count,
          colorVariant: summary.colorVariant ?? current.colorVariant,
        };
      },
      { ownedCount: 0, totalCopies: 0, colorVariant: undefined },
    );
  })();

  if (!character) {
    return <View style={styles.cell} />;
  }

  if (collection.ownedCount === 0) {
    return (
      <ThemedView type="backgroundElement" style={[styles.cell, styles.cellLocked]}>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.lockedGlyph}>
          ?
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.cell, styles.cellObtained, { borderColor: RarityColors[character.rarity] }]}>
      <ThemedText
        type="subtitle"
        style={[
          styles.cellGlyph,
          collection.colorVariant && { color: collection.colorVariant.glyphColor },
        ]}>
        {character.glyph}
      </ThemedText>
      {collection.colorVariant && (
        <View
          style={[
            styles.variantMarker,
            { backgroundColor: collection.colorVariant.glyphColor },
          ]}
        />
      )}
      {collection.totalCopies > 1 && (
        <View style={[styles.countBadge, { backgroundColor: RarityColors[character.rarity] }]}>
          <ThemedText type="smallBold" style={styles.countBadgeText}>
            ×{collection.totalCopies}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

export default function CollectionScreen() {
  const obtainedCount = useCollectionStore(
    (state) => japanese.characters.filter((c) => state.entries[c.id]).length,
  );
  const totalDraws = useCollectionStore((state) => state.totalDraws);
  const totalCount = japanese.characters.length;
  const progress = totalCount === 0 ? 0 : obtainedCount / totalCount;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">コレクション</ThemedText>
            <View style={styles.languageBadge}>
              <ThemedText type="smallBold" style={styles.languageBadgeText}>
                {japanese.label}
              </ThemedText>
            </View>
          </View>

          <View style={styles.progressRow}>
            <ThemedText type="smallBold">
              {obtainedCount} / {totalCount}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              累計 {totalDraws} 回
            </ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </ThemedView>

          <View style={styles.sheet}>
            {japanese.sheetRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((characterId, cellIndex) => (
                  <SheetCell
                    key={cellIndex}
                    character={characterId ? (characterById.get(characterId) ?? null) : null}
                  />
                ))}
              </View>
            ))}
          </View>
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
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  languageBadge: {
    backgroundColor: '#E5484D',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  languageBadgeText: {
    color: '#FFFFFF',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#E5484D',
  },
  sheet: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLocked: {
    opacity: 0.6,
  },
  lockedGlyph: {
    opacity: 0.4,
  },
  cellObtained: {
    borderWidth: 2,
  },
  cellGlyph: {
    fontSize: 28,
    lineHeight: 36,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },
  variantMarker: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
