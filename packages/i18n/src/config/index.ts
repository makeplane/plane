import en from "../locales/en/translations.json";
import fr from "../locales/fr/translations.json";

export type Language = (typeof languages)[number];
export type Translations = {
  [key: string]: {
    [key: string]: string;
  };
};

export const fallbackLng = "en";
export const languages = ["en", "fr"] as const;
export const translations: Translations = {
  en,
  fr,
};
