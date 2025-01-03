import { makeObservable, observable } from "mobx";
import { Language, fallbackLng, languages, translations } from "../config";

export class TranslationStore {
  currentLocale: Language = fallbackLng;

  constructor() {
    makeObservable(this, {
      currentLocale: observable.ref,
    });
    this.initializeLanguage();
  }

  get availableLanguages() {
    return languages;
  }

  t(key: string) {
    return translations[this.currentLocale]?.[key] || translations[fallbackLng][key] || key;
  }

  setLanguage(lng: Language) {
    try {
      localStorage.setItem("userLanguage", lng);
      this.currentLocale = lng;
    } catch (error) {
      console.error(error);
    }
  }

  initializeLanguage() {
    if (typeof window === "undefined") return;
    const savedLocale = localStorage.getItem("userLanguage") as Language;
    if (savedLocale && languages.includes(savedLocale)) {
      this.setLanguage(savedLocale);
    } else {
      const browserLang = navigator.language.split("-")[0] as Language;
      const newLocale = languages.includes(browserLang as Language) ? (browserLang as Language) : fallbackLng;
      this.setLanguage(newLocale);
    }
  }
}
