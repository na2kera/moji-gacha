import { defineLanguage } from './build';

export const arabic = defineLanguage({
  id: 'arabic',
  label: 'アラビア語',
  flag: '🇸🇦',
  prefix: 'ar',
  // アラビア文字28字を伝統的な字母順 (ヒジャー順) に並べたレイアウト。
  // '　'(全角スペース) は空セル。各文字は独立形で表示する。
  sections: [
    {
      title: 'アルファベット',
      rows: ['ابتثج', 'حخدذر', 'زسشصض', 'طظعغف', 'قكلمن', 'هوي　　'],
    },
  ],
  // アラビア語特有の音のض・ظは超レア。使用頻度の低い強調音などは少しレア
  superRare: 'ضظ',
  rare: 'ثذخصطغق',
});
