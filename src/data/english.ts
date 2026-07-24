import { defineLanguage } from './build';

export const english = defineLanguage({
  id: 'english',
  label: '英語',
  flag: '🇺🇸',
  prefix: 'en',
  // アルファベット表のレイアウト。'　'(全角スペース) は空セル。
  sections: [
    {
      title: 'アルファベット',
      rows: ['ABCDE', 'FGHIJ', 'KLMNO', 'PQRST', 'UVWXY', 'Z　　　　'],
    },
  ],
  // 英文の出現頻度ベースのレアリティ。E, T, A などは出やすく、J, Q, X, Z は超レア。
  superRare: 'JQXZ',
  rare: 'BFGKPVWY',
});
