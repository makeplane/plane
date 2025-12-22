/**
 * Server-side i18n Initialization
 *
 * Utilities for initializing i18next on the server for SSR.
 */

import { initI18n, getI18n } from "../core/i18n";
import type { LanguageCode, Namespace } from "../config/languages";
import { DEFAULT_NAMESPACE } from "../config/languages";

/**
 * Initialize i18next for server-side rendering
 *
 * Call this in your server entry or loader before rendering.
 * This ensures translations are loaded before the React tree renders.
 *
 * @param lng - The language to use for this request
 * @param namespaces - Namespaces to preload (default: ["translation"])
 *
 * @example
 * ```ts
 * // In entry.server.tsx or a loader
 * import { initI18nServer, detectLanguage } from "@plane/i18n/server";
 *
 * export async function loader({ request }: LoaderArgs) {
 *   const { language } = detectLanguage({
 *     cookie: request.headers.get("Cookie"),
 *     acceptLanguage: request.headers.get("Accept-Language"),
 *   });
 *
 *   await initI18nServer(language, ["translation", "auth"]);
 *
 *   return { language };
 * }
 * ```
 */
export async function initI18nServer(lng: LanguageCode, namespaces: Namespace[] = [DEFAULT_NAMESPACE]): Promise<void> {
  await initI18n({
    lng,
    preloadNamespaces: namespaces,
    isServer: true,
  });
}

/**
 * Get a translation function for server-side use
 *
 * Use this when you need to translate strings outside of React components,
 * such as in loaders or actions.
 *
 * @param ns - The namespace to use (default: "translation")
 *
 * @example
 * ```ts
 * import { getServerTranslation } from "@plane/i18n/server";
 *
 * export async function action({ request }: ActionArgs) {
 *   const t = getServerTranslation("auth");
 *
 *   // ... handle form
 *
 *   return json({
 *     message: t("login.success"),
 *   });
 * }
 * ```
 */
export function getServerTranslation(ns: Namespace = DEFAULT_NAMESPACE) {
  const i18n = getI18n();
  return i18n.getFixedT(i18n.language, ns);
}
