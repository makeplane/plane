/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { getLanguageDirection } from "../constants/language";
import type { TLanguage } from "../types";

/**
 * Sync the document's `lang` and `dir` with the active language.
 */
export function applyDocumentLanguage(lng: TLanguage): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng;
  document.documentElement.dir = getLanguageDirection(lng);
}
