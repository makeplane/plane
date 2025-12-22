/**
 * Server-side Language Detection
 *
 * Detects the user's preferred language from:
 * 1. Cookie (persisted preference)
 * 2. Accept-Language header (browser preference)
 *
 * Works in any server environment (Node.js, edge, etc.)
 */

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, isValidLanguage, languages } from "../config/languages";
import type { LanguageCode } from "../config/languages";

export interface DetectLanguageOptions {
  /** Cookie header string (e.g., "plane_language=fr; other=value") */
  cookie?: string | null;
  /** Accept-Language header string (e.g., "en-US,en;q=0.9,fr;q=0.8") */
  acceptLanguage?: string | null;
}

export interface DetectedLanguage {
  /** The detected language code */
  language: LanguageCode;
  /** Text direction for the language */
  dir: "ltr" | "rtl";
  /** Source of the detection */
  source: "cookie" | "header" | "default";
}

/**
 * Parse a cookie string and get a specific value
 */
function getCookieValue(cookieString: string, name: string): string | null {
  const cookies = cookieString.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Parse Accept-Language header and find the best matching language
 *
 * @example
 * parseAcceptLanguage("en-US,en;q=0.9,fr;q=0.8,ar;q=0.7")
 * // Returns "en" (exact match for "en")
 */
function parseAcceptLanguage(header: string): LanguageCode | null {
  // Parse header into language-quality pairs
  // Format: "en-US,en;q=0.9,fr;q=0.8"
  const parts = header.split(",").map((part) => {
    const [lang, qualityStr] = part.trim().split(";q=");
    const quality = qualityStr ? parseFloat(qualityStr) : 1.0;
    return { lang: lang.trim(), quality };
  });

  // Sort by quality (highest first)
  parts.sort((a, b) => b.quality - a.quality);

  // Find first matching language
  for (const { lang } of parts) {
    // Try exact match (e.g., "zh-CN")
    if (isValidLanguage(lang)) {
      return lang;
    }

    // Try base language (e.g., "en-US" -> "en")
    const baseLang = lang.split("-")[0];
    if (isValidLanguage(baseLang)) {
      return baseLang;
    }

    // Try finding a variant (e.g., "zh" -> "zh-CN")
    const variant = Object.keys(languages).find((code) => code.startsWith(baseLang + "-"));
    if (variant && isValidLanguage(variant)) {
      return variant;
    }
  }

  return null;
}

/**
 * Detect the user's preferred language on the server
 *
 * Priority:
 * 1. Cookie (user's explicit preference)
 * 2. Accept-Language header (browser preference)
 * 3. Default language (fallback)
 *
 * @example
 * ```ts
 * // In a React Router loader
 * export async function loader({ request }: LoaderArgs) {
 *   const { language, dir } = detectLanguage({
 *     cookie: request.headers.get("Cookie"),
 *     acceptLanguage: request.headers.get("Accept-Language"),
 *   });
 *   return { language, dir };
 * }
 * ```
 */
export function detectLanguage(options: DetectLanguageOptions = {}): DetectedLanguage {
  const { cookie, acceptLanguage } = options;

  // 1. Check cookie for saved preference
  if (cookie) {
    const savedLang = getCookieValue(cookie, LANGUAGE_STORAGE_KEY);
    if (savedLang && isValidLanguage(savedLang)) {
      return {
        language: savedLang,
        dir: languages[savedLang].dir,
        source: "cookie",
      };
    }
  }

  // 2. Check Accept-Language header
  if (acceptLanguage) {
    const detectedLang = parseAcceptLanguage(acceptLanguage);
    if (detectedLang) {
      return {
        language: detectedLang,
        dir: languages[detectedLang].dir,
        source: "header",
      };
    }
  }

  // 3. Fall back to default
  return {
    language: DEFAULT_LANGUAGE,
    dir: languages[DEFAULT_LANGUAGE].dir,
    source: "default",
  };
}

/**
 * Get language config for SSR HTML attributes
 *
 * Convenience function that returns just what's needed for the <html> tag
 *
 * @example
 * ```tsx
 * export function Layout({ children }: { children: React.ReactNode }) {
 *   const { language, dir } = useLoaderData<typeof loader>();
 *   return (
 *     <html lang={language} dir={dir}>
 *       ...
 *     </html>
 *   );
 * }
 * ```
 */
export function getLanguageAttrs(language: LanguageCode): { lang: string; dir: "ltr" | "rtl" } {
  return {
    lang: language,
    dir: languages[language].dir,
  };
}
