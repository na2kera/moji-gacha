import type { GachaCharacter, LanguageSet, Rarity, SheetSection } from './types';

/** レアリティごとの抽選重み。大きいほど出やすい。全言語で共通 */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 10,
  rare: 4,
  superRare: 1,
};

/** 色違いの出やすさ。基本文字の重みに対する倍率 */
const COLOR_VARIANT_WEIGHT_RATIO = 0.04;

const COLOR_VARIANT_COLORS = [
  { glyphColor: '#008F7A', glowColor: '#7FFFE5' },
  { glyphColor: '#D93668', glowColor: '#FFC1D0' },
  { glyphColor: '#5E9E00', glowColor: '#D8FF7A' },
  { glyphColor: '#C75A00', glowColor: '#FFD08A' },
  { glyphColor: '#0077CC', glowColor: '#A7F0FF' },
];

/** 基本文字それぞれに色違いバリエーションを加えた抽選プールを作る */
export function withColorVariants(baseCharacters: GachaCharacter[]): GachaCharacter[] {
  const colorVariants: GachaCharacter[] = baseCharacters.map((character, index) => ({
    ...character,
    id: `${character.id}-color`,
    baseId: character.id,
    weight: character.weight * COLOR_VARIANT_WEIGHT_RATIO,
    colorVariant: {
      label: '色違い',
      ...COLOR_VARIANT_COLORS[index % COLOR_VARIANT_COLORS.length],
    },
  }));
  return [...baseCharacters, ...colorVariants];
}

/** シートの空セルを表す全角スペース */
const EMPTY_CELL = '　';

export type SectionDefinition = {
  /** 表示名 (例: '清音') */
  title: string;
  /** 行ごとの文字の並び。'　'(全角スペース) は空セル */
  rows: string[];
  /** このセクション全体に付ける soundMark (日本語の濁音・半濁音) */
  soundMark?: GachaCharacter['soundMark'];
  /** superRare / rare で個別指定されていない文字のレア度。省略時は 'common' */
  defaultRarity?: Rarity;
};

export type LanguageDefinition = {
  id: string;
  /** 表示名 (例: '日本語') */
  label: string;
  /** 言語バッジに表示する国旗絵文字 */
  flag: string;
  /** 文字IDのプレフィックス (例: 'ja' → 'ja-あ')。永続化に使われるので変更しないこと */
  prefix: string;
  /** コレクションシートのセクション。この並び順が抽選プール・シートの順になる */
  sections: SectionDefinition[];
  /** superRare にする文字の並び (例: 'ψξ') */
  superRare?: string;
  /** rare にする文字の並び。superRare が優先される */
  rare?: string;
  /** 行ラベルの生成規則。空セルを除いた行の文字を受け取る。省略時は全行ラベルなし */
  rowLabel?: (rowGlyphs: string[]) => string | null;
};

/** 言語の定義オブジェクトから LanguageSet を組み立てる */
export function defineLanguage(definition: LanguageDefinition): LanguageSet {
  const superRare = new Set(definition.superRare ?? '');
  const rare = new Set(definition.rare ?? '');

  const rarityOf = (glyph: string, section: SectionDefinition): Rarity => {
    if (superRare.has(glyph)) return 'superRare';
    if (rare.has(glyph)) return 'rare';
    return section.defaultRarity ?? 'common';
  };

  const toCharacter = (glyph: string, section: SectionDefinition): GachaCharacter => {
    const rarity = rarityOf(glyph, section);
    const soundMark = section.soundMark;
    const id = `${definition.prefix}-${glyph}`;
    return {
      id,
      baseId: id,
      glyph,
      rarity,
      ...(soundMark && { soundMark }),
      weight: RARITY_WEIGHT[rarity],
    };
  };

  const rows = definition.sections.flatMap((section) =>
    section.rows.map((row) => ({ glyphs: [...row], section })),
  );

  const baseCharacters: GachaCharacter[] = rows.flatMap(({ glyphs, section }) =>
    glyphs.filter((glyph) => glyph !== EMPTY_CELL).map((glyph) => toCharacter(glyph, section)),
  );

  let firstRow = 0;
  const sheetSections: SheetSection[] = definition.sections.map((section) => {
    const sheetSection = { title: section.title, firstRow, rowCount: section.rows.length };
    firstRow += section.rows.length;
    return sheetSection;
  });

  return {
    id: definition.id,
    label: definition.label,
    flag: definition.flag,
    characters: withColorVariants(baseCharacters),
    sheetRows: rows.map(({ glyphs }) =>
      glyphs.map((glyph) => (glyph === EMPTY_CELL ? null : `${definition.prefix}-${glyph}`)),
    ),
    sheetRowLabels: rows.map(({ glyphs }) =>
      definition.rowLabel
        ? definition.rowLabel(glyphs.filter((glyph) => glyph !== EMPTY_CELL))
        : null,
    ),
    sheetSections,
  };
}
