import { useContext } from "react";
import { TranslationContext } from "../components";
import { Language } from "../config";

export function useTranslation() {
  const store = useContext(TranslationContext);
  if (!store) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }

  return {
    t: (key: string) => store.t(key),
    currentLocale: store.currentLocale,
    changeLanguage: (lng: Language) => store.setLanguage(lng),
    languages: store.availableLanguages,
  };
}
