import IntlMessageFormat from "intl-messageformat";
import get from "lodash/get";
import { makeAutoObservable } from "mobx";
// constants
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, STORAGE_KEY } from "../constants";
// types
import { TLanguage, ILanguageOption, ITranslations } from "../types";

/**
 * Mobx store class for handling translations and language changes in the application
 * Provides methods to translate keys with params and change the language
 * Uses IntlMessageFormat to format the translations
 */
export class TranslationStore {
  // List of translations for each language
  private translations: ITranslations = {};
  // Cache for IntlMessageFormat instances
  private messageCache: Map<string, IntlMessageFormat> = new Map();
  // Current language
  currentLocale: TLanguage = FALLBACK_LANGUAGE;

  /**
   * Constructor for the TranslationStore class
   */
  constructor() {
    makeAutoObservable(this);
    this.initializeLanguage();
    this.loadTranslations();
  }

  /**
   * Loads translations from JSON files and initializes the message cache
   */
  private async loadTranslations() {
    try {
      // dynamic import of translations
      const translations = {
        en: (await import("../locales/en/translations.json")).default,
        fr: (await import("../locales/fr/translations.json")).default,
        es: (await import("../locales/es/translations.json")).default,
        ja: (await import("../locales/ja/translations.json")).default,
        "zh-CN": (await import("../locales/zh-CN/translations.json")).default,
      };
      this.translations = translations;
      this.messageCache.clear(); // Clear cache when translations change
    } catch (error) {
      console.error("Failed to load translations:", error);
    }
  }

  /** Initializes the language based on the local storage or browser language */
  private initializeLanguage() {
    if (typeof window === "undefined") return;

    const savedLocale = localStorage.getItem(STORAGE_KEY) as TLanguage;
    if (this.isValidLanguage(savedLocale)) {
      this.setLanguage(savedLocale);
      return;
    }

    const browserLang = this.getBrowserLanguage();
    this.setLanguage(browserLang);
  }

  /** Checks if the language is valid based on the supported languages */
  private isValidLanguage(lang: string | null): lang is TLanguage {
    return lang !== null && SUPPORTED_LANGUAGES.some((l) => l.value === lang);
  }

  /** Gets the browser language based on the navigator.language */
  private getBrowserLanguage(): TLanguage {
    const browserLang = navigator.language.split("-")[0];
    return this.isValidLanguage(browserLang) ? browserLang : FALLBACK_LANGUAGE;
  }

  /** Gets the IntlMessageFormat instance for the given key and locale */
  private getCacheKey(key: string, locale: TLanguage): string {
    return `${locale}:${key}`;
  }

  /**
   * Gets the IntlMessageFormat instance for the given key and locale
   * Returns cached instance if available
   * Throws an error if the key is not found in the translations
   */
  private getMessageInstance(key: string, locale: TLanguage): IntlMessageFormat | null {
    const cacheKey = this.getCacheKey(key, locale);

    // Check if the cache already has the key
    if (this.messageCache.has(cacheKey)) {
      return this.messageCache.get(cacheKey) || null;
    }

    // Get the message from the translations
    const message = get(this.translations[locale], key);
    if (!message) return null;

    try {
      const formatter = new IntlMessageFormat(message as any, locale);
      this.messageCache.set(cacheKey, formatter);
      return formatter;
    } catch (error) {
      console.error(`Failed to create message formatter for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Translates a key with params using the current locale
   * Falls back to the default language if the translation is not found
   * Returns the key itself if the translation is not found
   * @param key - The key to translate
   * @param params - The params to format the translation with
   * @returns The translated string
   */
  t(key: string, params?: Record<string, any>): string {
    try {
      // Try current locale
      let formatter = this.getMessageInstance(key, this.currentLocale);

      // Fallback to default language if necessary
      if (!formatter && this.currentLocale !== FALLBACK_LANGUAGE) {
        formatter = this.getMessageInstance(key, FALLBACK_LANGUAGE);
      }

      // If we have a formatter, use it
      if (formatter) {
        return formatter.format(params || {}) as string;
      }

      // Last resort: return the key itself
      return key;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  }

  /**
   * Sets the current language and updates the translations
   * @param lng - The new language
   */
  setLanguage(lng: TLanguage): void {
    try {
      if (!this.isValidLanguage(lng)) {
        throw new Error(`Invalid language: ${lng}`);
      }

      localStorage.setItem(STORAGE_KEY, lng);
      this.currentLocale = lng;
      this.messageCache.clear(); // Clear cache when language changes
      document.documentElement.lang = lng;
    } catch (error) {
      console.error("Failed to set language:", error);
    }
  }

  /**
   * Gets the available language options for the dropdown
   * @returns An array of language options
   */
  get availableLanguages(): ILanguageOption[] {
    return SUPPORTED_LANGUAGES;
  }
}
