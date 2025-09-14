import { promises as fs } from "fs";
import path from "path";
import { TRANSLATION_ROOT_PATH, TRANSLATION_FILES, BASE_LOCALE } from "./constants";
import { FileService } from "./file-service";
import { JsonService, NestedTranslations } from "./json-service";
import { TranslationFile, TranslationLocale, TranslationRow, TranslationStatus } from "./types";

/**
 * Validates if a directory is a valid locale directory (e.g., 'en', 'fr', 'de')
 * @param dir Directory name to validate
 * @returns True if the directory is a valid locale directory
 */
const isValidLocaleDirectory = (dir: string): boolean => /^[a-z]{2}(-[A-Z]{2})?$/.test(dir);

/**
 * Manages translation files across multiple locales.
 * Handles reading, writing, and generating translation files in a structured format.
 */
export class LocaleManager {
  private fileService = new FileService();
  private jsonService = new JsonService();
  public readonly rootPath: string;
  public readonly translationFiles: TranslationFile[];

  /**
   * Initializes the TranslationManager with default paths and files.
   * Automatically updates generated translations for each file.
   */
  constructor() {
    this.rootPath = TRANSLATION_ROOT_PATH;
    this.translationFiles = TRANSLATION_FILES;
  }

  /**
   * Gets all available locale directories (e.g., 'en', 'fr', 'de')
   * @returns Array of valid locale identifiers
   * @throws If the root directory cannot be read
   */
  private async getLocales(): Promise<TranslationLocale[]> {
    const files = await fs.readdir(this.rootPath);
    return files.filter((f) => isValidLocaleDirectory(f)) as TranslationLocale[];
  }

  /**
   * Update all the generated translation files in the memory
   */
  async updateAllGeneratedTranslations(): Promise<void> {
    for (const file of this.translationFiles) {
      await this.updateGeneratedTranslations(file);
    }
  }

  /**
   * Constructs the full file path for a translation file
   * @param locale The locale identifier (e.g., 'en', 'fr')
   * @param file The translation file category (e.g., "translations", "accessibility", "editor", "core")
   * @returns Absolute path to the translation file
   */
  private getFilePath(locale: TranslationLocale, file: TranslationFile): string {
    return path.join(this.rootPath, locale, `${file}.json`);
  }

  /**
   * Retrieves and flattens translations for a specific locale and file
   * @param locale The locale to get translations for
   * @param file The translation file category (e.g., "translations", "accessibility", "editor", "core")
   * @returns Flattened key-value pairs of translations
   */
  async getTranslations(locale: TranslationLocale, file: TranslationFile): Promise<Record<string, string>> {
    const filePath = this.getFilePath(locale, file);
    const raw = await this.fileService.read(filePath);
    if (!raw) return {};
    return this.jsonService.flatten(JSON.parse(raw) as NestedTranslations);
  }

  /**
   * Updates a single translation key for a specific locale
   * @param locale The locale to update
   * @param key The translation key (dot-notation path)
   * @param value The new translation value
   * @param file The translation file category (e.g., "translations", "accessibility", "editor", "core")
   * @throws If the file cannot be written
   */
  async updateTranslation(locale: TranslationLocale, key: string, value: string, file: TranslationFile): Promise<void> {
    const filePath = this.getFilePath(locale, file);
    const raw = (await this.fileService.read(filePath)) || "{}";
    const json = JSON.parse(raw) as NestedTranslations;
    this.jsonService.set(json, key, value);
    await this.fileService.write(filePath, JSON.stringify(json, null, 2));
    await this.updateGeneratedTranslations(file);
  }

  /**
   * Deletes a translation key from all locales
   * @param key The translation key to delete
   * @param file The translation file category (e.g., "translations", "accessibility", "editor", "core")
   * @throws If any file cannot be written
   */
  async deleteTranslation(key: string, file: TranslationFile): Promise<void> {
    const locales = await this.getLocales();
    for (const locale of locales) {
      const filePath = this.getFilePath(locale, file);
      const raw = (await this.fileService.read(filePath)) || "{}";
      const json = JSON.parse(raw) as NestedTranslations;
      this.jsonService.unset(json, key);
      await this.fileService.write(filePath, JSON.stringify(json, null, 2));
    }
    await this.updateGeneratedTranslations(file);
  }

  /**
   * Generates translation rows for all locales in a specific file
   * @param file The translation file category (e.g., "translations", "accessibility", "editor", "core")
   * @returns Array of translation rows with status for each locale
   * @throws If English translations are not found
   */
  async generateTranslationRows(file: TranslationFile): Promise<TranslationRow[]> {
    const locales = await this.getLocales();
    const translations: Record<TranslationLocale, Record<string, string>> = {
      en: {},
      cs: {},
      de: {},
      es: {},
      fr: {},
      id: {},
      it: {},
      ja: {},
      ko: {},
      pl: {},
      "pt-BR": {},
      ro: {},
      ru: {},
      sk: {},
      ua: {},
      "vi-VN": {},
      "zh-CN": {},
      "zh-TW": {},
      "tr-TR": {},
    };

    for (const locale of locales) {
      translations[locale] = await this.getTranslations(locale, file);
    }

    const en = translations[BASE_LOCALE];
    if (!en) throw new Error("English translations not found");

    return Object.keys(en).map((key) => ({
      id: key,
      key,
      fullPath: path.join(this.rootPath, key),
      translations: Object.fromEntries(
        locales.map((locale) => [
          locale,
          {
            status: translations[locale]?.[key] ? "added" : "missing",
            value: translations[locale]?.[key] || "",
          } as TranslationStatus,
        ])
      ) as Record<TranslationLocale, TranslationStatus>,
    }));
  }

  /**
   * Updates multiple translations for a single key across multiple locales
   * @param key The translation key to update
   * @param translations Map of locale to translation value
   * @param file The translation file category
   * @throws If any translation update fails
   */
  async bulkUpdateTranslations(
    key: string,
    translations: Record<TranslationLocale, string>,
    file: TranslationFile
  ): Promise<void> {
    await Promise.all(
      Object.entries(translations).map(([locale, value]) =>
        this.updateTranslation(locale as TranslationLocale, key, value, file)
      )
    );
  }

  /**
   * Updates the generated translation file for a specific category
   * @param file The translation file category
   * @throws If the temporary directory cannot be created or the file cannot be written
   */
  async updateGeneratedTranslations(file: TranslationFile): Promise<void> {
    const data = await this.generateTranslationRows(file);
    const tempDir = path.join(__dirname, ".temp");
    await fs.mkdir(tempDir, { recursive: true });
    await this.fileService.write(path.join(tempDir, `generated-${file}.json`), JSON.stringify(data, null, 2));
  }
}
