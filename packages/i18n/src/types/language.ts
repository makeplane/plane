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
  | "vi-VN";

export interface ILanguageOption {
  label: string;
  value: TLanguage;
}
