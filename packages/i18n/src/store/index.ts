import IntlMessageFormat from "intl-messageformat";
import { get, merge } from "lodash-es";
import { makeAutoObservable, runInAction } from "mobx";
// constants
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY, ETranslationFiles } from "../constants";
// core translations imports
import { enCore, locales } from "../locales";
// types
import type { TLanguage, ILanguageOption, ITranslations } from "../types";

/**
 * Mobx store class for handling translations and language changes in the application
 * Provides methods to translate keys with params and change the language
 * Uses IntlMessageFormat to format the translations
 */
export class TranslationStore {
  // Core translations that are always loaded
  private coreTranslations: ITranslations = {
    en: enCore,
  };
  // List of translations for each language
  private translations: ITranslations = {};
  // Cache for IntlMessageFormat instances
  private messageCache: Map<string, IntlMessageFormat> = new Map();
  // Current language
  currentLocale: TLanguage = FALLBACK_LANGUAGE;
  // Loading state
  isLoading: boolean = true;
  isInitialized: boolean = false;
  // Set of loaded languages
  private loadedLanguages: Set<TLanguage> = new Set();

  /**
   * Constructor for the TranslationStore class
   */
  constructor() {
    makeAutoObservable(this);
    // Initialize with core translations immediately
    this.translations = this.coreTranslations;
    // Initialize language
    this.initializeLanguage();
    // Load all the translations
    this.loadTranslations();
  }

  /** Initializes the language based on the local storage or browser language */
  private initializeLanguage() {
    if (typeof window === "undefined") return;

    const savedLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY) as TLanguage;
    if (this.isValidLanguage(savedLocale)) {
      this.setLanguage(savedLocale);
      return;
    }

    // Fallback to default language
    this.setLanguage(FALLBACK_LANGUAGE);
  }

  /** Loads the translations for the current language */
  private async loadTranslations(): Promise<void> {
    try {
      // Set initialized to true (Core translations are already loaded)
      runInAction(() => {
        this.isInitialized = true;
      });
      // Load current and fallback languages in parallel
      await this.loadPrimaryLanguages();
      // Load all remaining languages in parallel
      this.loadRemainingLanguages();
    } catch (error) {
      console.error("Failed in translation initialization:", error);
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private async loadPrimaryLanguages(): Promise<void> {
    try {
      // Load current and fallback languages in parallel
      const languagesToLoad = new Set<TLanguage>([this.currentLocale]);
      // Add fallback language only if different from current
      if (this.currentLocale !== FALLBACK_LANGUAGE) {
        languagesToLoad.add(FALLBACK_LANGUAGE);
      }
      // Load all primary languages in parallel
      const loadPromises = Array.from(languagesToLoad).map((lang) => this.loadLanguageTranslations(lang));
      await Promise.all(loadPromises);
      // Update loading state
      runInAction(() => {
        this.isLoading = false;
      });
    } catch (error) {
      console.error("Failed to load primary languages:", error);
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private loadRemainingLanguages(): void {
    const remainingLanguages = SUPPORTED_LANGUAGES.map((lang) => lang.value).filter(
      (lang) => !this.loadedLanguages.has(lang) && lang !== this.currentLocale && lang !== FALLBACK_LANGUAGE
    );
    // Load all remaining languages in parallel
    Promise.all(remainingLanguages.map((lang) => this.loadLanguageTranslations(lang))).catch((error) => {
      console.error("Failed to load some remaining languages:", error);
    });
  }

  private async loadLanguageTranslations(language: TLanguage): Promise<void> {
    // Skip if already loaded
    if (this.loadedLanguages.has(language)) return;

    try {
      const translations = await this.importLanguageFile(language);
      runInAction(() => {
        // Use lodash merge for deep merging
        this.translations[language] = merge({}, this.coreTranslations[language] || {}, translations.default);
        // Add to loaded languages
        this.loadedLanguages.add(language);
        // Clear cache
        this.messageCache.clear();
      });
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
    }
  }

  /**
   * Helper function to import and merge multiple translation files for a language
   * @param language - The language code
   * @param files - Array of file names to import (without .json extension)
   * @returns Promise that resolves to merged translations
   */
  private async importAndMergeFiles(language: TLanguage, files: string[]) {
    try {
      const localeData = locales[language as keyof typeof locales];
      if (!localeData) {
        throw new Error(`Locale data not found for language: ${language}`);
      }

      // Filter out files that don't exist for this language
      const availableFiles = files.filter((file) => {
        const fileKey = file as keyof typeof localeData;
        return fileKey in localeData;
      });

      const importPromises = availableFiles.map((file) => {
        const fileKey = file as keyof typeof localeData;
        return localeData[fileKey]();
      });

      const modules = await Promise.all(importPromises);
      const merged = modules.reduce((acc: any, module: any) => merge(acc, module.default), {});
      return { default: merged };
    } catch (error) {
      throw new Error(`Failed to import and merge files for ${language}: ${error}`);
    }
  }

  /**
   * Imports the translations for the given language
   * @param language - The language to import the translations for
   * @returns {Promise<any>}
   */
  private async importLanguageFile(language: TLanguage) {
    const files = Object.values(ETranslationFiles);
    return this.importAndMergeFiles(language, files);
  }

  /** Checks if the language is valid based on the supported languages */
  private isValidLanguage(lang: string | null): lang is TLanguage {
    return lang !== null && this.availableLanguages.some((l) => l.value === lang);
  }

  /**
   * Gets the cache key for the given key and locale
   * @param key - the key to get the cache key for
   * @param locale - the locale to get the cache key for
   * @returns the cache key for the given key and locale
   */
  private getCacheKey(key: string, locale: TLanguage): string {
    return `${locale}:${key}`;
  }

  /**
   * Gets the IntlMessageFormat instance for the given key and locale
   * Returns cached instance if available
   */
  private getMessageInstance(key: string, locale: TLanguage): IntlMessageFormat | null {
    const cacheKey = this.getCacheKey(key, locale);

    // Check if the cache already has the key
    if (this.messageCache.has(cacheKey)) {
      return this.messageCache.get(cacheKey) || null;
    }

    // Get the message from the translations
    const message = get(this.translations[locale], key);
    if (typeof message !== "string") return null;

    try {
      const formatter = new IntlMessageFormat(message, locale);
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
  t(key: string, params?: Record<string, unknown>): string {
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
  async setLanguage(lng: TLanguage): Promise<void> {
    try {
      if (!this.isValidLanguage(lng)) {
        throw new Error(`Invalid language: ${lng}`);
      }

      // Safeguard in case background loading failed
      if (!this.loadedLanguages.has(lng)) {
        await this.loadLanguageTranslations(lng);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
        document.documentElement.lang = lng;
      }

      runInAction(() => {
        this.currentLocale = lng;
        this.messageCache.clear(); // Clear cache when language changes
      });
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
