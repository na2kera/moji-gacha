import { defineLanguage } from './build';

export const thai = defineLanguage({
  id: 'thai',
  label: 'タイ語',
  flag: '🇹🇭',
  prefix: 'th',
  // タイ文字の子音44字を伝統的な順 (ก ไก่ の順) に並べたレイアウト。
  // '　'(全角スペース) は空セル。
  sections: [
    {
      title: '子音',
      rows: [
        'กขฃคฅ',
        'ฆงจฉช',
        'ซฌญฎฏ',
        'ฐฑฒณด',
        'ตถทธน',
        'บปผฝพ',
        'ฟภมยร',
        'ลวศษส',
        'หฬอฮ　',
      ],
    },
  ],
  // 現代タイ語で使われなくなったฃ・ฅは超レア。サンスクリット由来などの低頻度文字は少しレア
  superRare: 'ฃฅ',
  rare: 'ฆฌฎฏฐฑฒณศษฬฮ',
});
