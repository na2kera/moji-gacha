import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WordGlyphs, wordToPlainText } from '@/components/words/word-glyphs';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { shareWordGeneric, shareWordToX } from '@/lib/share';
import { useWordsStore, type SavedWord } from '@/store/words';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 削除前の確認。Alert が使えない web では confirm にフォールバックする */
function confirmRemove(word: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const confirmFn = (globalThis as { confirm?: (message: string) => boolean }).confirm;
    if (!confirmFn || confirmFn(`「${word}」をけしますか？`)) onConfirm();
    return;
  }
  Alert.alert('ことばをけす', `「${word}」をけしますか？`, [
    { text: 'やめる', style: 'cancel' },
    { text: 'けす', style: 'destructive', onPress: onConfirm },
  ]);
}

function WordCard({ word }: { word: SavedWord }) {
  const removeWord = useWordsStore((state) => state.removeWord);
  const plainText = wordToPlainText(word.characterIds);

  return (
    <ThemedView type="backgroundElement" style={styles.wordCard}>
      <WordGlyphs characterIds={word.characterIds} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.wordDate}>
        {formatDate(word.createdAt)} につくった
      </ThemedText>
      <View style={styles.wordActions}>
        <Pressable
          onPress={() => shareWordToX(plainText)}
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonX,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={styles.actionButtonXText}>
            Xでシェア
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => shareWordGeneric(plainText)}
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonShare,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={styles.actionButtonShareText}>
            シェアする
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => confirmRemove(plainText, () => removeWord(word.id))}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          hitSlop={Spacing.one}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            けす
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export default function MyWordsScreen() {
  const words = useWordsStore((state) => state.words);

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
            <ThemedText type="subtitle">マイことば</ThemedText>
          </View>

          <Pressable
            onPress={() => {
              haptics.selection();
              router.push('/collection/words/create');
            }}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.createButtonText}>
              ✏️ あたらしいことばをつくる
            </ThemedText>
          </Pressable>

          {words.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyEmoji}>💬</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                まだことばがありません
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                集めた文字でことばを作ってかざろう!
              </ThemedText>
            </View>
          ) : (
            words.map((word) => <WordCard key={word.id} word={word} />)
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
  createButton: {
    borderRadius: Spacing.three,
    minHeight: 44,
    backgroundColor: Accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: Accent.onPrimary,
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
  wordCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  wordDate: {
    textAlign: 'center',
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    borderRadius: Spacing.three,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonX: {
    backgroundColor: Accent.xBrand,
  },
  actionButtonXText: {
    color: Accent.onXBrand,
  },
  actionButtonShare: {
    backgroundColor: Accent.primary,
  },
  actionButtonShareText: {
    color: Accent.onPrimary,
  },
  deleteButton: {
    paddingHorizontal: Spacing.two,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
