#!/usr/bin/env node

import { blue, yellow, white, red, green } from "ansis";
import { BASE_LOCALE } from "./locale/constants";
import { LocaleManager } from "./locale/manager";
import { TranslationRow, TranslationStatus } from "./locale/types";

async function checkMissingTranslations() {
  try {
    const manager = new LocaleManager();
    const files = manager.translationFiles;
    let hasMissingTranslations = false;

    console.log(blue`\nChecking for missing translations...\n`);

    for (const file of files) {
      console.log(yellow`\nChecking 📄 ${file}:`);
      const rows = await manager.generateTranslationRows(file);

      const missingTranslations = rows.filter((row: TranslationRow) =>
        Object.entries(row.translations).some(
          ([locale, translation]: [string, TranslationStatus]) =>
            locale !== BASE_LOCALE && translation.status === "missing"
        )
      );

      if (missingTranslations.length > 0) {
        hasMissingTranslations = true;

        missingTranslations.forEach((row: TranslationRow) => {
          console.log(white`\n🔑 Key: ${row.key}`);
          Object.entries(row.translations).forEach(([locale, translation]: [string, TranslationStatus]) => {
            if (locale !== "en" && translation.status === "missing") {
              console.log(red`  - Missing in 📂 locales/${locale}/${file}.json`);
            }
          });
        });
        console.log(); // Add empty line for readability
      } else {
        console.log(green`✓ All translations present`);
      }
    }

    if (hasMissingTranslations) {
      console.error(red`\n⚠️  Some translations are missing. Please add them to maintain full language support.\n`);
      process.exit(1);
    } else {
      console.log(green`\n✓ All translations are complete!\n`);
      process.exit(0);
    }
  } catch (error) {
    console.error(red`\nError checking translations: ${error}`);
    process.exit(1);
  }
}

checkMissingTranslations();
