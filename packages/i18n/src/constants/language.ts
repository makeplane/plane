import { TLanguage, ILanguageOption } from "../types";

export const FALLBACK_LANGUAGE: TLanguage = "en";

export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  { label: "English", value: "en" },
  { label: "Français", value: "fr" },
  { label: "Español", value: "es" },
  { label: "日本語", value: "ja" },
  { label: "简体中文", value: "zh-CN" },
  { label: "繁體中文", value: "zh-TW" },
  { label: "Русский", value: "ru" },
  { label: "Italian", value: "it" },
  { label: "Čeština", value: "cs" },
  { label: "Slovenčina", value: "sk" },
  { label: "Deutsch", value: "de" },
  { label: "Українська", value: "ua" },
  { label: "Polski", value: "pl" },
  { label: "한국어", value: "ko" },
  { label: "Português Brasil", value: "pt-BR" },
  { label: "Indonesian", value: "id" },
  { label: "Română", value: "ro" },
  { label: "Tiếng việt", value: "vi-VN" },
  { label: "Türkçe", value: "tr-TR" },
];

/**
 * Enum for translation file names
 * These are the JSON files that contain translations each category
 */
export enum ETranslationFiles {
  TRANSLATIONS = "translations",
  ACCESSIBILITY = "accessibility",
  EDITOR = "editor",
}

export const LANGUAGE_STORAGE_KEY = "userLanguage";
