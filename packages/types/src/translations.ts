export type TLanguage =
  | "en"
  | "fr"
  | "es"
  | "ja"
  | "zh-CN"
  | "zh-TW"
  | "ru"
  | "it"
  | "cs"
  | "sk"
  | "de"
  | "ua"
  | "pl"
  | "ko"
  | "pt-BR"
  | "id"
  | "ro"
  | "vi-VN"
  | "tr-TR";

export interface ILanguageOption {
  label: string;
  value: TLanguage;
}

export interface ITranslation {
  [key: string]: string | ITranslation;
}

export interface ITranslations {
  [locale: string]: ITranslation;
}
