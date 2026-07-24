import { defineLanguage } from './build';

export const greek = defineLanguage({
  id: 'greek',
  label: 'ギリシャ語',
  flag: '🇬🇷',
  prefix: 'el',
  // ギリシャ文字24字 (小文字) のレイアウト。'　'(全角スペース) は空セル。
  // ラテン文字と紛らわしい大文字ではなく、形が独特な小文字を採用。
  sections: [
    {
      title: 'アルファベット',
      rows: ['αβγδε', 'ζηθικ', 'λμνξο', 'πρστυ', 'φχψω　'],
    },
  ],
  // ギリシャ語の文章で最も出現頻度が低いψ・ξは超レア。低頻度の文字は少しレア
  superRare: 'ψξ',
  rare: 'ζθφχω',
});
