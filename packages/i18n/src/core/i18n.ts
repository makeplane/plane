/**
 * i18next Configuration
 *
 * Central i18next instance configuration for the application.
 * Uses our custom backend for code-split locale loading.
 */

/* eslint-disable import/no-named-as-default-member -- We intentionally use instance methods to ensure we're using the same i18next instance */
import i18next from "i18next";
import StaticImportBackend from "./backend";
import { DEFAULT_LANGUAGE, DEFAULT_NAMESPACE, languages } from "../config/languages";
import type { LanguageCode, Namespace } from "../config/languages";

// Get supported language codes
const supportedLanguages = Object.keys(languages) as LanguageCode[];

// Initialization promise to prevent race conditions
let initPromise: Promise<typeof i18next> | null = null;

/**
 * Initialize i18next with our configuration
 *
 * This should be called once at app startup, before rendering.
 * On the server, call this for each request with the detected locale.
 * On the client, call this once during hydration.
 *
 * Multiple calls are safe - subsequent calls will wait for the first init
 * to complete, then handle language/namespace changes if needed.
 */
export async function initI18n(options?: {
  /** Initial language (defaults to DEFAULT_LANGUAGE) */
  lng?: LanguageCode;
  /** Namespaces to preload (defaults to [DEFAULT_NAMESPACE]) */
  preloadNamespaces?: Namespace[];
  /** Whether we're on the server (disables some client features) */
  isServer?: boolean;
}): Promise<typeof i18next> {
  const { lng = DEFAULT_LANGUAGE, preloadNamespaces = [DEFAULT_NAMESPACE], isServer = false } = options ?? {};

  // If already initialized, handle language/namespace changes
  if (i18next.isInitialized) {
    if (i18next.language !== lng) {
      await i18next.changeLanguage(lng);
    }
    await i18next.loadNamespaces(preloadNamespaces);
    return i18next;
  }

  // If init is in progress, wait for it then handle changes
  if (initPromise) {
    await initPromise;
    if (i18next.language !== lng) {
      await i18next.changeLanguage(lng);
    }
    await i18next.loadNamespaces(preloadNamespaces);
    return i18next;
  }

  // First initialization - create and store the promise
  initPromise = i18next
    .use(StaticImportBackend)
    .init({
      // Language settings
      lng,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: supportedLanguages,

      // Namespace settings
      ns: preloadNamespaces,
      defaultNS: DEFAULT_NAMESPACE,

      // Key/namespace separators
      keySeparator: ".",
      nsSeparator: ":",

      // Interpolation
      interpolation: {
        escapeValue: false, // React already escapes
      },

      // Development settings
      debug: process.env.NODE_ENV === "development" && !isServer,

      // Don't load all namespaces upfront
      partialBundledLanguages: true,
    })
    .then(() => i18next);

  await initPromise;
  return i18next;
}

/**
 * Get the i18next instance
 *
 * Use this to access the i18next instance directly when needed.
 * Prefer using the React hooks (useTranslation) in components.
 */
export function getI18n(): typeof i18next {
  return i18next;
}

/**
 * Change the current language
 *
 * This will trigger a re-render of all components using translations.
 */
export async function changeLanguage(lng: LanguageCode): Promise<void> {
  await i18next.changeLanguage(lng);
}

/**
 * Load additional namespaces
 *
 * Call this to load namespaces that weren't preloaded.
 */
export async function loadNamespaces(namespaces: Namespace[]): Promise<void> {
  await i18next.loadNamespaces(namespaces);
}

/**
 * Check if a namespace is loaded
 */
export function isNamespaceLoaded(ns: Namespace, lng?: LanguageCode): boolean {
  return i18next.hasLoadedNamespace(ns, lng ? { lng } : undefined);
}

export { i18next, supportedLanguages };
