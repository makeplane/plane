export interface ITranslation {
  [key: string]: string | ITranslation;
}

export interface ITranslations {
  [locale: string]: ITranslation;
}
