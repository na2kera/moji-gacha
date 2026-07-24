import { defineLanguage } from './build';

/**
 * カナダラ表 (반절표) のレイアウト。
 * 行 = 基本子音14 (ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ)、
 * 列 = 基本母音6 (ㅏㅓㅗㅜㅡㅣ) の音節文字。
 */
const BASIC_ROWS: string[] = [
  '가거고구그기',
  '나너노누느니',
  '다더도두드디',
  '라러로루르리',
  '마머모무므미',
  '바버보부브비',
  '사서소수스시',
  '아어오우으이',
  '자저조주즈지',
];

/** 激音 (ㅊㅋㅌㅍ) とㅎの行は出にくい。その中でもㅡ段は超レア */
const ASPIRATED_ROWS: string[] = [
  '차처초추츠치',
  '카커코쿠크키',
  '타터토투트티',
  '파퍼포푸프피',
  '하허호후흐히',
];

export const korean = defineLanguage({
  id: 'korean',
  label: '韓国語',
  flag: '🇰🇷',
  prefix: 'ko',
  sections: [{ title: 'カナダラ表', rows: [...BASIC_ROWS, ...ASPIRATED_ROWS] }],
  superRare: ASPIRATED_ROWS.map((row) => [...row][4]).join(''),
  rare: ASPIRATED_ROWS.join(''),
});
