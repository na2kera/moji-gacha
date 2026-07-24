import { defineLanguage } from './build';

export const japanese = defineLanguage({
  id: 'japanese',
  label: '日本語',
  flag: '🇯🇵',
  prefix: 'ja',
  // 五十音表のレイアウト。'　'(全角スペース) は空セル。
  sections: [
    {
      title: '清音',
      rows: [
        'あいうえお',
        'かきくけこ',
        'さしすせそ',
        'たちつてと',
        'なにぬねの',
        'はひふへほ',
        'まみむめも',
        'や　ゆ　よ',
        'らりるれろ',
        'わ　　　を',
        'ん　　　　',
      ],
    },
    {
      title: '濁音',
      rows: ['がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ'],
      soundMark: 'dakuten',
      // 濁音・半濁音は通常の五十音より少し出にくい
      defaultRarity: 'rare',
    },
    {
      title: '半濁音',
      rows: ['ぱぴぷぺぽ'],
      soundMark: 'handakuten',
      defaultRarity: 'rare',
    },
  ],
  // 出にくい文字。実際のガチャガチャで「なかなか出ない」体験を作る
  superRare: 'ぬをんぢづ',
  rare: 'ねむへやゆよらりるれろわ',
  // 行ラベル (あ行/か行…が行…)。1文字だけの行(ん)はその文字自身をラベルにする
  rowLabel: (glyphs) => (glyphs.length > 1 ? `${glyphs[0]}行` : glyphs[0]),
});
