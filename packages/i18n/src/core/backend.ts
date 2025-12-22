/**
 * Custom i18next Backend
 *
 * Uses our static import map for code-splitting instead of HTTP fetching.
 * This allows the bundler to properly analyze and split locale files.
 */

import type { BackendModule, ReadCallback, Services } from "i18next";
import { loadLocale } from "./locale-loader";
import type { LanguageCode, Namespace } from "../config/languages";

type BackendOptions = Record<string, unknown>;

/**
 * i18next backend that uses static imports for code-splitting
 *
 * Instead of fetching translations from an HTTP endpoint, this backend
 * uses our locale-loader which has a static import map. This allows
 * bundlers like Vite to properly code-split each locale file.
 */
class StaticImportBackend implements BackendModule<BackendOptions> {
  type = "backend" as const;
  static type = "backend" as const;

  init(_services: Services, _backendOptions: BackendOptions): void {
    // No initialization needed
  }

  read(language: string, namespace: string, callback: ReadCallback): void {
    loadLocale(language as LanguageCode, namespace as Namespace)
      .then((data) => {
        // eslint-disable-next-line promise/no-callback-in-promise -- i18next backend API requires callback in promise
        callback(null, data);
        return data;
      })
      .catch((error: Error) => {
        // eslint-disable-next-line promise/no-callback-in-promise -- i18next backend API requires callback in promise
        callback(error, null);
      });
  }
}

export default StaticImportBackend;
