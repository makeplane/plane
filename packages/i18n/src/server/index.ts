/**
 * Server-side i18n utilities
 *
 * These utilities are designed for SSR environments (Node.js, edge, etc.)
 * and don't depend on browser APIs.
 *
 * @example
 * ```ts
 * import { detectLanguage, initI18nServer } from "@plane/i18n/server";
 *
 * export async function loader({ request }: LoaderArgs) {
 *   const { language, dir } = detectLanguage({
 *     cookie: request.headers.get("Cookie"),
 *     acceptLanguage: request.headers.get("Accept-Language"),
 *   });
 *
 *   // Initialize i18n for this request
 *   await initI18nServer(language, ["translation", "auth"]);
 *
 *   return { language, dir };
 * }
 * ```
 */

export { detectLanguage, getLanguageAttrs, type DetectLanguageOptions, type DetectedLanguage } from "./detect";

export { initI18nServer, getServerTranslation } from "./init";
