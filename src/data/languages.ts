import { arabic } from './arabic';
import { english } from './english';
import { greek } from './greek';
import { hindi } from './hindi';
import { japanese } from './japanese';
import { korean } from './korean';
import { thai } from './thai';
import type { GachaCharacter, LanguageSet } from './types';

/** ガチャで遊べる言語一覧。横スワイプ・バッジタップでこの並び順に切り替わる */
export const languages: LanguageSet[] = [japanese, english, korean, arabic, thai, hindi, greek];

export const DEFAULT_LANGUAGE_ID = japanese.id;

export const languageById = new Map(languages.map((language) => [language.id, language]));

/** 全言語を横断した文字ID → 文字。IDは言語prefix付き (例: 'ja-あ') で衝突しない */
export const characterById = new Map<string, GachaCharacter>(
  languages.flatMap((language) => language.characters.map((c) => [c.id, c])),
);

/** 文字ID → その文字が属する言語セット */
export const languageOfCharacter = new Map<string, LanguageSet>(
  languages.flatMap((language) => language.characters.map((c) => [c.id, language])),
);

/** baseId → 色違いバリエーションの一覧 (基本文字自身は含まない) */
export const variantsByBaseId = languages
  .flatMap((language) => language.characters)
  .reduce((map, character) => {
    if (character.id === character.baseId) return map;
    const variants = map.get(character.baseId) ?? [];
    variants.push(character);
    map.set(character.baseId, variants);
    return map;
  }, new Map<string, GachaCharacter[]>());
