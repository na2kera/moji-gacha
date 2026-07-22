import { languageById, languages } from '@/data/languages';
import { useSettingsStore } from '@/store/settings';

/** 言語切替の方向。1 = 次の言語 (左スワイプ)、-1 = 前の言語 (右スワイプ) */
export type SwitchDirection = 1 | -1;

/** 選択中の言語セットと、隣の言語への切り替え操作を返す */
export function useLanguage() {
  const languageId = useSettingsStore((state) => state.languageId);
  const setLanguageId = useSettingsStore((state) => state.setLanguageId);
  const language = languageById.get(languageId) ?? languages[0];
  const index = languages.indexOf(language);

  const switchLanguage = (direction: SwitchDirection) => {
    const next = languages[(index + direction + languages.length) % languages.length];
    setLanguageId(next.id);
  };

  return { language, index, switchLanguage };
}
