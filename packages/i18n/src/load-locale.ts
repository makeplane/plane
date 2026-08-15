/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Dynamic locale loader. Keep this file next to `src/locales/` so the
 * relative `./locales/...` glob still resolves after tsdown bundles into
 * `dist/index.js` (paired with `copy: ["src/locales"]` in tsdown.config.ts).
 */
export function loadLocale(language: string, namespace: string) {
  return import(`./locales/${language}/${namespace}.json`);
}
