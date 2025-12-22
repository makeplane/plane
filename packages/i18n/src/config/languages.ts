/**
 * Language Configuration
 *
 * Defines all supported languages with their metadata.
 * This is the single source of truth for language support.
 */

export interface LanguageConfig {
  /** Language code (BCP 47) */
  code: string;
  /** English name */
  name: string;
  /** Native name */
  nativeName: string;
  /** Text direction */
  dir: "ltr" | "rtl";
  /** Intl.Locale identifier for formatting */
  intlLocale: string;
}

/**
 * All supported languages
 *
 * Only languages with complete translation files are included here.
 *
 * When adding a new language:
 * 1. Add the config here
 * 2. Create the locale folder with JSON namespace files
 * 3. Add the language to locale-loader.ts
 * 4. Run the type generation script
 */
export const languages = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    dir: "ltr",
    intlLocale: "en-US",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    dir: "ltr",
    intlLocale: "fr-FR",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    dir: "ltr",
    intlLocale: "es-ES",
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    dir: "ltr",
    intlLocale: "ja-JP",
  },
  "zh-CN": {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    dir: "ltr",
    intlLocale: "zh-CN",
  },
  "zh-TW": {
    code: "zh-TW",
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    dir: "ltr",
    intlLocale: "zh-TW",
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    dir: "ltr",
    intlLocale: "ru-RU",
  },
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    dir: "ltr",
    intlLocale: "it-IT",
  },
  cs: {
    code: "cs",
    name: "Czech",
    nativeName: "Čeština",
    dir: "ltr",
    intlLocale: "cs-CZ",
  },
  sk: {
    code: "sk",
    name: "Slovak",
    nativeName: "Slovenčina",
    dir: "ltr",
    intlLocale: "sk-SK",
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    dir: "ltr",
    intlLocale: "de-DE",
  },
  uk: {
    code: "uk",
    name: "Ukrainian",
    nativeName: "Українська",
    dir: "ltr",
    intlLocale: "uk-UA",
  },
  pl: {
    code: "pl",
    name: "Polish",
    nativeName: "Polski",
    dir: "ltr",
    intlLocale: "pl-PL",
  },
  ko: {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    dir: "ltr",
    intlLocale: "ko-KR",
  },
  "pt-BR": {
    code: "pt-BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    dir: "ltr",
    intlLocale: "pt-BR",
  },
  id: {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    dir: "ltr",
    intlLocale: "id-ID",
  },
  ro: {
    code: "ro",
    name: "Romanian",
    nativeName: "Română",
    dir: "ltr",
    intlLocale: "ro-RO",
  },
  vi: {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    dir: "ltr",
    intlLocale: "vi-VN",
  },
  tr: {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    dir: "ltr",
    intlLocale: "tr-TR",
  },
} as const satisfies Record<string, LanguageConfig>;

/** Language code type derived from config */
export type LanguageCode = keyof typeof languages;

/**
 * @deprecated Use LanguageCode instead
 */
export type TLanguage = LanguageCode;

/** Default/fallback language */
export const DEFAULT_LANGUAGE: LanguageCode = "en";

/**
 * @deprecated Use DEFAULT_LANGUAGE instead
 */
export const FALLBACK_LANGUAGE = DEFAULT_LANGUAGE;

/** Local storage key for persisting language preference */
export const LANGUAGE_STORAGE_KEY = "plane_language";

/**
 * Namespace definitions
 *
 * For now we use a single "translation" namespace (i18next's default).
 * This keeps things simple and aligned with i18next conventions.
 *
 * In the future, we can split into multiple namespaces for code-splitting:
 * - auth: Authentication flows
 * - workspace: Workspace management
 * - project: Project features
 * - etc.
 */
export const namespaces = {
  /** Default namespace containing all translations */
  translation: "translation",
} as const;

export type Namespace = keyof typeof namespaces;

/** Default namespace (i18next standard) */
export const DEFAULT_NAMESPACE: Namespace = "translation";

/**
 * Get language config by code
 */
export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  return languages[code];
}

/**
 * Check if a language code is valid
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return code in languages;
}

/**
 * Get all language options for dropdowns
 */
export function getLanguageOptions(): Array<{ value: LanguageCode; label: string; nativeName: string }> {
  return Object.values(languages).map((lang) => ({
    value: lang.code,
    label: lang.name,
    nativeName: lang.nativeName,
  }));
}

/**
 * Interface for language dropdown options
 */
export interface ILanguageOption {
  label: string;
  value: LanguageCode;
}

/**
 * Language options for dropdowns (backwards compatible format)
 * @deprecated Use getLanguageOptions() instead
 */
export const SUPPORTED_LANGUAGES: ILanguageOption[] = Object.values(languages).map((lang) => ({
  label: lang.nativeName,
  value: lang.code,
}));

/**
 * Apply RTL/LTR direction to the document
 *
 * Sets the `dir` and `lang` attributes on <html>.
 * Tailwind v4 automatically handles RTL styling via `rtl:` and `ltr:` variants
 * when the `dir` attribute is set.
 *
 * @example
 * ```tsx
 * // In your components, use Tailwind RTL variants:
 * <div className="ml-4 rtl:mr-4 rtl:ml-0">
 *   Content with RTL-aware margin
 * </div>
 *
 * // Or use logical properties (recommended):
 * <div className="ms-4">
 *   Content with margin-inline-start
 * </div>
 * ```
 */
export function applyDocumentDirection(code: LanguageCode): void {
  if (typeof document === "undefined") return;

  const config = languages[code];

  // Set dir attribute - Tailwind's rtl: and ltr: variants respond to this
  document.documentElement.dir = config.dir;

  // Set lang attribute for accessibility and browser features
  document.documentElement.lang = code;
}
