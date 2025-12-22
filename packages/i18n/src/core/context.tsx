/**
 * React Context and Hooks for i18n
 *
 * Custom React bindings for i18next using useSyncExternalStore.
 * This replaces react-i18next to avoid CJS/ESM compatibility issues.
 *
 * - TranslationProvider: Wrap your app to enable i18n
 * - useTranslation: Access translations
 * - useLocale: Access locale info and formatters
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useI18nStore, i18next } from "./store";
import { initI18n, changeLanguage as i18nChangeLanguage, loadNamespaces } from "./i18n";
import {
  DEFAULT_NAMESPACE,
  DEFAULT_LANGUAGE,
  getLanguageOptions,
  getLanguageConfig,
  isValidLanguage,
  applyDocumentDirection,
  LANGUAGE_STORAGE_KEY,
} from "../config/languages";
import type { LanguageCode, Namespace } from "../config/languages";
import type {
  Namespace as GeneratedNamespace,
  KeysOf,
  KeysWithoutParams,
  KeysWithParams,
  PrefixedKey,
  PrefixedKeyWithoutParams,
  PrefixedKeyWithParams,
  ParamsFor,
} from "../types/generated";

// ============================================================================
// Detect initial language
// ============================================================================

function detectInitialLanguage(): LanguageCode {
  // Server-side: use default
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  // Check localStorage first
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  // Check browser language - try exact match first, then language-only
  if (typeof navigator !== "undefined" && navigator.language) {
    const browserLocale = navigator.language;
    if (isValidLanguage(browserLocale)) {
      return browserLocale;
    }

    // Fall back to language-only match (e.g., vi-VN -> vi)
    const langOnly = browserLocale.split("-")[0];
    if (isValidLanguage(langOnly)) {
      return langOnly;
    }
  }

  return DEFAULT_LANGUAGE;
}

// ============================================================================
// Context
// ============================================================================

interface TranslationContextValue {
  defaultNamespace: Namespace;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface TranslationProviderProps {
  children: ReactNode;
  /** Initial language (auto-detects if not provided) */
  initialLanguage?: LanguageCode;
  /** Namespaces to preload (defaults to common) */
  preloadNamespaces?: Namespace[];
}

/**
 * Wrap your app with TranslationProvider to enable i18n
 *
 * @example
 * ```tsx
 * <TranslationProvider>
 *   <App />
 * </TranslationProvider>
 * ```
 *
 * @example With specific language and namespaces
 * ```tsx
 * <TranslationProvider initialLanguage="de" preloadNamespaces={["translation", "auth"]}>
 *   <App />
 * </TranslationProvider>
 * ```
 */
export function TranslationProvider({
  children,
  initialLanguage,
  preloadNamespaces = [DEFAULT_NAMESPACE],
}: TranslationProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const lng = initialLanguage ?? detectInitialLanguage();

      await initI18n({
        lng,
        preloadNamespaces,
        isServer: false,
      });

      // Apply document direction on client
      if (typeof window !== "undefined") {
        applyDocumentDirection(lng);
      }

      if (mounted) {
        setIsReady(true);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [initialLanguage, preloadNamespaces]);

  // Listen for language changes to update document direction
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (typeof window !== "undefined") {
        applyDocumentDirection(lng as LanguageCode);
        // Persist to localStorage
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
        } catch {
          // localStorage not available
        }
      }
    };

    i18next.on("languageChanged", handleLanguageChanged);
    return () => {
      i18next.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <TranslationContext.Provider value={{ defaultNamespace: DEFAULT_NAMESPACE }}>
      {children}
    </TranslationContext.Provider>
  );
}

// ============================================================================
// useTranslation
// ============================================================================

/**
 * Keys that don't require params for a namespace (including prefixed keys)
 */
export type TKeysWithoutParams<NS extends GeneratedNamespace> = KeysWithoutParams<NS> | PrefixedKeyWithoutParams;

/**
 * Keys that require params for a namespace (including prefixed keys)
 */
export type TKeysWithParams<NS extends GeneratedNamespace> = KeysWithParams<NS> | PrefixedKeyWithParams;

/**
 * All valid keys for a namespace
 */
export type TKeys<NS extends GeneratedNamespace> = KeysOf<NS> | PrefixedKey;

/**
 * Translation function type with namespace-aware type safety.
 *
 * - Keys without params: `t("cancel")` - no second argument
 * - Keys with params: `t("greeting", { name: "John" })` - params required
 *
 * @template NS - The namespace being used (defaults to "translation")
 */
export type TFunction<NS extends GeneratedNamespace = "translation"> = {
  /** Translate a key that doesn't require params */
  <K extends TKeysWithoutParams<NS>>(key: K): string;
  /** Translate a key that requires params */
  <K extends TKeysWithParams<NS>>(key: K, params: ParamsFor<NS, K>): string;
};

/**
 * Return type for useTranslation hook
 * @template NS - The namespace being used
 */
export interface UseTranslationReturn<NS extends GeneratedNamespace = "translation"> {
  /** Translate a key - accepts keys from the specified namespace or any prefixed key */
  t: TFunction<NS>;
  /** Whether translations are loaded and ready */
  ready: boolean;
  /** Change the current language */
  changeLanguage: (code: LanguageCode) => Promise<void>;
}

/**
 * Hook for translations
 *
 * @param ns - Namespace(s) to use (default: "translation")
 *
 * @example Basic usage with default namespace
 * ```tsx
 * const { t } = useTranslation();
 * return <h1>{t("welcome")}</h1>;  // looks up "welcome" in common.json
 * ```
 *
 * @example With explicit namespace
 * ```tsx
 * const { t } = useTranslation("auth");
 * return <h1>{t("login.title")}</h1>;  // looks up "login.title" in auth.json
 * ```
 *
 * @example Cross-namespace access with colon separator
 * ```tsx
 * const { t } = useTranslation("auth");
 * return (
 *   <div>
 *     <h1>{t("login.title")}</h1>           // auth.json -> login.title
 *     <button>{t("common:save")}</button>   // common.json -> save
 *   </div>
 * );
 * ```
 *
 * @example With interpolation parameters
 * ```tsx
 * const { t } = useTranslation();
 * return <p>{t("greeting", { name: "John" })}</p>;
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components -- This hook is intentionally exported alongside the provider
export function useTranslation<NS extends GeneratedNamespace = "translation">(
  ns?: NS | NS[]
): UseTranslationReturn<NS> {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }

  // Subscribe to i18next changes (language changes, namespace loads, etc.)
  useI18nStore();

  // Determine the namespaces to use
  const defaultNs = Array.isArray(ns) ? ns[0] : (ns ?? context.defaultNamespace);
  const allNamespaces = useMemo(
    () => (Array.isArray(ns) ? ns : ns ? [ns] : [context.defaultNamespace]),
    [ns, context.defaultNamespace]
  );

  // Load namespaces if not already loaded
  useEffect(() => {
    const toLoad = allNamespaces.filter((namespace) => !i18next.hasLoadedNamespace(namespace));
    if (toLoad.length > 0) {
      void loadNamespaces(toLoad);
    }
  }, [allNamespaces]);

  // Create t function bound to this namespace
  const t: TFunction<NS> = useCallback(
    (key: string, params?: Record<string, unknown>) => {
      // Use i18next's t function with our default namespace
      return i18next.t(key, { ns: defaultNs, ...params });
    },
    [defaultNs]
  ) as TFunction<NS>;

  // Check if ready
  const ready = allNamespaces.every((namespace) => i18next.hasLoadedNamespace(namespace));

  // Change language function
  const changeLanguage = useCallback(async (code: LanguageCode) => {
    await i18nChangeLanguage(code);
  }, []);

  return { t, ready, changeLanguage };
}

// ============================================================================
// useLocale
// ============================================================================

export interface UseLocaleReturn {
  /** Current language code (e.g., "en", "de", "ja") */
  language: LanguageCode;
  /** Intl locale string (e.g., "en-US", "de-DE") - use with Intl APIs directly */
  intlLocale: string;
  /** Text direction ("ltr" or "rtl") */
  dir: "ltr" | "rtl";
  /** Change language */
  setLanguage: (code: LanguageCode) => Promise<void>;
  /** Available languages for language picker */
  languages: { value: LanguageCode; label: string; nativeName: string }[];
}

/**
 * Hook for locale information - use intlLocale with Intl APIs directly
 *
 * @example
 * ```tsx
 * const { intlLocale, dir, setLanguage } = useLocale();
 *
 * // Use Intl APIs directly with intlLocale
 * const dateStr = new Intl.DateTimeFormat(intlLocale).format(createdAt);
 * const numStr = new Intl.NumberFormat(intlLocale, { style: "currency", currency: "USD" }).format(price);
 *
 * return (
 *   <div dir={dir}>
 *     <p>Created: {dateStr}</p>
 *   </div>
 * );
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components -- This hook is intentionally exported alongside the provider
export function useLocale(): UseLocaleReturn {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useLocale must be used within a TranslationProvider");
  }

  // Subscribe to i18next changes
  useI18nStore();

  // Get current language
  const language = (i18next.language || DEFAULT_LANGUAGE) as LanguageCode;
  const config = useMemo(() => getLanguageConfig(language), [language]);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    await i18nChangeLanguage(code);
  }, []);

  const languages = useMemo(() => getLanguageOptions(), []);

  return {
    language,
    intlLocale: config.intlLocale,
    dir: config.dir,
    setLanguage,
    languages,
  };
}

// ============================================================================
// Trans Component
// ============================================================================

export interface TransProps<NS extends GeneratedNamespace = "translation"> {
  /** The translation key */
  i18nKey: TKeys<NS>;
  /** Namespace to use */
  ns?: NS;
  /** Interpolation values */
  values?: Record<string, unknown>;
  /** Children (used as fallback) */
  children?: ReactNode;
}

/**
 * Trans component for translations
 *
 * @example Basic usage
 * ```tsx
 * <Trans i18nKey="welcome">Welcome!</Trans>
 * ```
 *
 * @example With values
 * ```tsx
 * <Trans i18nKey="greeting" values={{ name: "John" }}>
 *   Hello, {{name}}!
 * </Trans>
 * ```
 */
export function Trans<NS extends GeneratedNamespace = "translation">({
  i18nKey,
  ns,
  values,
}: TransProps<NS>): React.ReactElement {
  const { t } = useTranslation(ns);
   
  const translated = (t as (key: TKeys<NS>, options?: Record<string, unknown>) => string)(i18nKey, values);

  return <>{translated}</>;
}
