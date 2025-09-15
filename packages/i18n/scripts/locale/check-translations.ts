import { BASE_LOCALE } from "./constants";
import { LocaleManager } from "./manager";
import { TranslationRow, TranslationStatus } from "./types";

/**
 * Represents a missing translation entry.
 * Contains information about which key is missing in which locales(eg- [id, cs, de]).
 */
export interface MissingTranslation {
  key: string;
  file: string;
  missingLocales: string[];
}

/**
 * Result object returned by the checkMissingTranslations function.
 * Contains information about whether there are any missing translations
 * and details about each missing translation.
 */
export interface CheckTranslationsResult {
  /** Flag indicating if any translations are missing */
  hasMissingTranslations: boolean;
  /** Array of missing translation details */
  missingTranslations: MissingTranslation[];
}

/**
 * Checks for missing translations across all locale files.
 *
 * This function:
 * 1. Updates all generated translations
 * 2. Iterates through each translation file
 * 3. Identifies missing translations by comparing against the base locale
 * 4. Collects details about missing translations including which keys are missing in which locales
 *
 * @returns {Promise<CheckTranslationsResult>} Object containing missing translation information
 */
async function checkMissingTranslations(): Promise<CheckTranslationsResult> {
  const manager = new LocaleManager();
  await manager.updateAllGeneratedTranslations();

  const files = manager.translationFiles;
  let hasMissingTranslations = false;
  const missingTranslations: MissingTranslation[] = [];

  for (const file of files) {
    const rows = await manager.generateTranslationRows(file);

    const missingRows = rows.filter((row: TranslationRow) =>
      Object.entries(row.translations).some(
        ([locale, translation]: [string, TranslationStatus]) =>
          locale !== BASE_LOCALE && translation.status === "missing"
      )
    );

    if (missingRows.length > 0) {
      hasMissingTranslations = true;

      missingRows.forEach((row: TranslationRow) => {
        const missingLocales = Object.entries(row.translations)
          .filter(
            ([locale, translation]: [string, TranslationStatus]) =>
              locale !== BASE_LOCALE && translation.status === "missing"
          )
          .map(([locale]) => locale);

        missingTranslations.push({
          key: row.key,
          file,
          missingLocales,
        });
      });
    }
  }

  return {
    hasMissingTranslations,
    missingTranslations,
  };
}

export { checkMissingTranslations };
