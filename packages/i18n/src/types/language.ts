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
  | "id"
  | "ro";

export interface ILanguageOption {
  label: string;
  value: TLanguage;
}
