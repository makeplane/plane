import en from "../locales/en/translations.json";
import fr from "../locales/fr/translations.json";
import es from "../locales/es/translations.json";
import ja from "../locales/ja/translations.json";
import ptBR from "../locales/ptBR/translations.json";
 
 export type Language = (typeof languages)[number];
 export type Translations = {
   [key: string]: {
     [key: string]: string;
   };
 };
 
 export const fallbackLng = "en";
 export const languages = ["en", "fr", "es", "ja", "ptBR"] as const;
 export const translations: Translations = {
   en,
   fr,
   es,
   ja,
   ptBR,
 };
 
 export const SUPPORTED_LANGUAGES = [
   {
     label: "English",
     value: "en",
   },
   {
     label: "French",
     value: "fr",
   },
   {
     label: "Spanish",
     value: "es",
   },
   {
     label: "Japanese",
     value: "ja",
   },
   {
    label: "Português Brasil",
    value: "ptBR",
  },
 ];