export type TranslationLocale =
  | "en"
  | "cs"
  | "de"
  | "es"
  | "fr"
  | "id"
  | "it"
  | "ja"
  | "ko"
  | "pl"
  | "pt-BR"
  | "ro"
  | "ru"
  | "sk"
  | "ua"
  | "vi-VN"
  | "zh-CN"
  | "zh-TW"
  | "tr-TR";

export type TranslationFile = "core" | "translations" | "accessibility" | "editor";

export interface TranslationStatus {
  status: "added" | "missing";
  value: string;
}

export interface TranslationRow {
  id: string;
  key: string;
  fullPath: string;
  translations: Record<TranslationLocale, TranslationStatus>;
}
