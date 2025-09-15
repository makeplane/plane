import { BASE_LOCALE } from "./constants";
import { LocaleManager } from "./manager";
import { TranslationRow, TranslationStatus } from "./types";

export interface MissingTranslation {
  key: string;
  file: string;
  missingLocales: string[];
}

export interface CheckTranslationsResult {
  hasMissingTranslations: boolean;
  missingTranslations: MissingTranslation[];
}

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
