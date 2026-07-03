export type Rarity = 'common' | 'rare' | 'superRare';

export type GachaCharacter = {
  /** 一意なID (例: 'ja-a') */
  id: string;
  /** 表示する文字 (例: 'あ') */
  glyph: string;
  rarity: Rarity;
  /** 抽選の重み。大きいほど出やすい */
  weight: number;
};

export type LanguageSet = {
  id: string;
  /** 表示名 (例: '日本語') */
  label: string;
  characters: GachaCharacter[];
  /**
   * コレクションシートのレイアウト。行ごとの文字ID配列。
   * null は空セル (例: や行の「やゆよ」以外)
   */
  sheetRows: (string | null)[][];
};
