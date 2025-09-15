#!/usr/bin/env node

import { blue, yellow, white, red, green } from "ansis";
import { checkMissingTranslations } from "./locale/check-translations";

async function runTranslationCheck() {
  try {
    console.log(blue`\nChecking for missing translations...\n`);

    const result = await checkMissingTranslations();
    const { hasMissingTranslations, missingTranslations } = result;

    if (missingTranslations.length > 0) {
      missingTranslations.forEach(({ key, file, missingLocales }) => {
        console.log(white`\n🔑 Key: ${key}`);
        missingLocales.forEach((locale) => {
          console.log(red`  - Missing in 📂 locales/${locale}/${file}.json`);
        });
        console.log();
      });
    } else {
      console.log(green`✓ All translations present`);
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

runTranslationCheck();
