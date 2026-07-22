export type Rarity = 'common' | 'rare' | 'superRare';

export type ColorVariant = {
  label: string;
  glyphColor: string;
  glowColor: string;
};

export type GachaCharacter = {
  /** 一意なID (例: 'ja-a') */
  id: string;
  /** 色違いも含めた同一文字グループのID */
  baseId: string;
  /** 表示する文字 (例: 'あ') */
  glyph: string;
  rarity: Rarity;
  colorVariant?: ColorVariant;
  /** 濁音・半濁音。ガチャの開封演出を通常の五十音と変えるのに使う */
  soundMark?: 'dakuten' | 'handakuten';
  /** 抽選の重み。大きいほど出やすい */
  weight: number;
};

export type SheetSection = {
  /** 表示名 (例: '清音') */
  title: string;
  /** sheetRows におけるセクション先頭行のインデックス */
  firstRow: number;
  rowCount: number;
};

export type LanguageSet = {
  id: string;
  /** 表示名 (例: '日本語') */
  label: string;
  /** 言語バッジに表示する国旗絵文字 */
  flag: string;
  characters: GachaCharacter[];
  /**
   * コレクションシートのレイアウト。行ごとの文字ID配列。
   * null は空セル (例: や行の「やゆよ」以外)
   */
  sheetRows: (string | null)[][];
  /** sheetRows と同じ並びの行ラベル (例: 'あ行')。null はラベルなし */
  sheetRowLabels: (string | null)[];
  /** コレクションシートのセクション区切り */
  sheetSections: SheetSection[];
};
