import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RarityColors, RarityLabels, RarityStars } from '@/constants/rarity';
import { Spacing } from '@/constants/theme';
import type { GachaCharacter } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useCollectionStore } from '@/store/collection';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type Props = {
  baseCharacter: GachaCharacter;
  variants: GachaCharacter[];
};

/** ポケモン図鑑の色違いトグルのように、獲得済みの色違いをタップして見比べられるショーケース */
export function CharacterShowcase({ baseCharacter, variants }: Props) {
  const theme = useTheme();
  const entries = useCollectionStore((state) => state.entries);
  const all = [baseCharacter, ...variants];
  const [selectedId, setSelectedId] = useState(baseCharacter.id);
  const selected = all.find((c) => c.id === selectedId) ?? baseCharacter;
  const selectedEntry = entries[selected.id];

  const glowPulse = useSharedValue(0.6);
  const flash = useSharedValue(0);
  const glyphScale = useSharedValue(1);
  const sparkleSpin = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    sparkleSpin.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1);
  }, [glowPulse, sparkleSpin]);

  useEffect(() => {
    flash.value = 0;
    flash.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 380 }));
    glyphScale.value = 0.82;
    glyphScale.value = withSpring(1, { damping: 9, stiffness: 160 });
  }, [selectedId, flash, glyphScale]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + glowPulse.value * 0.16,
    transform: [{ scale: 0.9 + glowPulse.value * 0.14 }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.55,
  }));

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glyphScale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleSpin.value * 360}deg` }],
  }));

  const glowColor = selected.colorVariant?.glowColor ?? RarityColors[selected.rarity];
  const glyphColor = selected.colorVariant?.glyphColor ?? theme.text;
  const borderColor = selected.colorVariant?.glyphColor ?? RarityColors[selected.rarity];

  function selectVariant(id: string) {
    if (id === selectedId) return;
    haptics.selection();
    setSelectedId(id);
  }

  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={[styles.glyphCard, { borderColor }]}>
        <View style={styles.glowLayer} pointerEvents="none">
          <Animated.View style={[styles.glow, { backgroundColor: glowColor }, glowStyle]} />
        </View>
        <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

        {selected.colorVariant && (
          <Animated.Text style={[styles.sparkle, { color: glyphColor }, sparkleStyle]}>
            ✦
          </Animated.Text>
        )}

        <ThemedText type="smallBold" style={{ color: RarityColors[selected.rarity] }}>
          {'★'.repeat(RarityStars[selected.rarity])} {RarityLabels[selected.rarity]}
        </ThemedText>

        <Animated.Text style={[styles.glyph, { color: glyphColor }, glyphStyle]}>
          {selected.glyph}
        </Animated.Text>

        {selected.colorVariant && (
          <View style={[styles.variantBadge, { backgroundColor: `${glowColor}33` }]}>
            <ThemedText type="smallBold" style={{ color: glyphColor }}>
              ✦ {selected.colorVariant.label}
            </ThemedText>
          </View>
        )}

        {selectedEntry ? (
          <ThemedText type="small" themeColor="textSecondary">
            ×{selectedEntry.count} / {formatDate(selectedEntry.firstObtainedAt)} に初獲得
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            未獲得
          </ThemedText>
        )}
      </ThemedView>

      {variants.length > 0 && (
        <View style={styles.swatchSection}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            色違い ({variants.filter((v) => entries[v.id]).length}/{variants.length})
          </ThemedText>
          <View style={styles.swatchRow}>
            {all.map((c) => (
              <VariantSwatch
                key={c.id}
                character={c}
                owned={Boolean(entries[c.id])}
                selected={c.id === selectedId}
                onSelect={() => selectVariant(c.id)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function VariantSwatch({
  character,
  owned,
  selected,
  onSelect,
}: {
  character: GachaCharacter;
  owned: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.1 : 1, { damping: 10, stiffness: 180 });
  }, [selected, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const ringColor = character.colorVariant?.glyphColor ?? RarityColors[character.rarity];

  return (
    <Pressable
      onPress={owned ? onSelect : undefined}
      disabled={!owned}
      hitSlop={Spacing.one}
      style={({ pressed }) => pressed && owned && styles.swatchPressed}>
      <Animated.View
        style={[
          styles.swatch,
          { borderColor: owned ? ringColor : 'transparent' },
          selected && styles.swatchSelected,
          !owned && styles.swatchLocked,
          style,
        ]}>
        <ThemedText
          type="smallBold"
          style={[
            styles.swatchGlyph,
            owned && character.colorVariant && { color: character.colorVariant.glyphColor },
            !owned && styles.lockedGlyphText,
          ]}>
          {owned ? character.glyph : '?'}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  glyphCard: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 2,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.four,
    overflow: 'hidden',
  },
  glowLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
  sparkle: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.four,
    fontSize: 22,
  },
  glyph: {
    fontSize: 84,
    lineHeight: 100,
    fontWeight: '700',
  },
  variantBadge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  swatchSection: {
    gap: Spacing.two,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: Spacing.three,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  swatchLocked: {
    opacity: 0.45,
  },
  swatchPressed: {
    opacity: 0.7,
  },
  swatchGlyph: {
    fontSize: 22,
    lineHeight: 28,
  },
  lockedGlyphText: {
    opacity: 0.5,
  },
});
