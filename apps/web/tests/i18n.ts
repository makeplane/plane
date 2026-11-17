/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createInstance, type i18n as I18n } from "i18next";
import ICU from "i18next-icu";
import en from "../../../packages/i18n/src/locales/en/common.json";
import zhCN from "../../../packages/i18n/src/locales/zh-CN/common.json";

export async function createTestI18n(language = "zh-CN"): Promise<I18n> {
  const i18n = createInstance().use(ICU);
  await i18n.init({
    lng: language,
    fallbackLng: false,
    defaultNS: "common",
    resources: { en: { common: en }, "zh-CN": { common: zhCN } },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return i18n;
}
