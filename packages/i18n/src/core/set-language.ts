/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { initPromise, i18nInstance } from "./instance";
import { LANGUAGE_STORAGE_KEY } from "../constants/language";
import { applyDocumentLanguage } from "./apply-language";
import type { TLanguage } from "../types";

export async function setLanguage(lng: TLanguage): Promise<void> {
  await initPromise;
  await i18nInstance.changeLanguage(lng);
  // A later change may have won while this one was loading; i18next then keeps
  // the newer language active, so skip the stale update.
  if (i18nInstance.language !== lng || typeof window === "undefined") return;
  // Apply the direction first so a failed write (e.g. storage quota) can't block it.
  applyDocumentLanguage(lng);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch (err) {
    console.warn("[i18n] Could not save the language preference:", err);
  }
}
