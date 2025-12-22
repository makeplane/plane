/**
 * @plane/i18n - Internationalization for Plane
 *
 * Built on i18next with custom React bindings for code-split locale loading.
 *
 * Provides:
 * - Translation with ICU MessageFormat (plurals, interpolation)
 * - Locale info (intlLocale) for use with Intl APIs
 * - RTL support
 * - On-demand namespace loading with code-splitting
 * - SSR support
 *
 * @example
 * ```tsx
 * import { TranslationProvider, useTranslation, useLocale } from "@plane/i18n";
 *
 * <TranslationProvider>
 *   <App />
 * </TranslationProvider>
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   const { intlLocale, dir } = useLocale();
 *
 *   return (
 *     <div dir={dir}>
 *       <h1>{t("welcome")}</h1>
 *       <p>{new Intl.DateTimeFormat(intlLocale).format(new Date())}</p>
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// React API
// ============================================================================

export {
  TranslationProvider,
  useTranslation,
  useLocale,
  Trans,
  type UseTranslationReturn,
  type UseLocaleReturn,
  type TKeys,
  type TFunction,
  type TransProps,
} from "./core/context";

// ============================================================================
// i18next Core
// ============================================================================

export { initI18n, getI18n, changeLanguage, loadNamespaces, isNamespaceLoaded, i18next } from "./core/i18n";

// ============================================================================
// Configuration
// ============================================================================

export {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  LANGUAGE_STORAGE_KEY,
  getLanguageOptions,
  getLanguageConfig,
  isValidLanguage,
  applyDocumentDirection,
  languages,
  namespaces,
  type LanguageCode,
  type LanguageConfig,
  type Namespace,
  // Backwards compatible exports
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type TLanguage,
  type ILanguageOption,
} from "./config/languages";

// ============================================================================
// Types
// ============================================================================

export type {
  Namespace as GeneratedNamespace,
  NamespaceKeys,
  KeysOf,
  KeysWithoutParams,
  KeysWithParams,
  PrefixedKey,
  PrefixedKeyWithoutParams,
  PrefixedKeyWithParams,
  DefaultKey,
  TranslationKey,
  ParamsFor,
} from "./types/generated";
