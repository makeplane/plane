import path from "path";
import { TranslationFile, TranslationLocale } from "./types";

/** Root path for all translation files */
export const TRANSLATION_ROOT_PATH = path.join(__dirname, "../../src/locales");

/** list of translation file categories */
export const TRANSLATION_FILES: TranslationFile[] = ["translations", "accessibility", "editor", "core"];

/** base locale */
export const BASE_LOCALE: TranslationLocale = "en";
