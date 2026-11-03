/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createInstance } from "i18next";
import ICU from "i18next-icu";
import { describe, expect, it } from "vitest";

const locales = import.meta.glob<{ default: Record<string, unknown> }>(
  "../../../packages/i18n/src/locales/*/common.json",
  { eager: true }
);

// Validate actual ICU evaluation: a JSON/key-sync check cannot detect broken interpolation.
describe("filter messages across locales", () => {
  it.each(Object.entries(locales))("resolves new strings and formats counts in %s", async (path, resource) => {
    // The directory ka-ge uses a lowercase region; i18next canonicalizes it to ka-GE.
    const language = Intl.getCanonicalLocales(path.split("/").at(-2)!)[0];
    const i18n = createInstance().use(ICU);
    await i18n.init({
      lng: language,
      fallbackLng: false,
      i18nFormat: {
        parseErrorHandler: (error: Error) => {
          throw error;
        },
      },
      resources: { [language]: { translation: resource.default } },
    });
    for (const key of [
      "sub_group_by",
      "filter_labels.subscriber",
      "filter_messages.all_applied",
      "filter_messages.configuration_error",
      "filter_messages.configuration_invalid",
    ]) {
      const fullKey = `common.${key}`;
      expect(i18n.t(fullKey)).not.toBe(fullKey);
      expect(i18n.t(fullKey)).not.toBe("");
    }
    for (const count of [0, 1, 2, 1234]) {
      const message = i18n.t("common.project_work_item_count", { count });
      expect(message).not.toContain("{");
      expect(message).toContain(new Intl.NumberFormat(language).format(count));
    }
    if (language === "zh-CN") {
      expect(i18n.t("common.project_work_item_count", { count: 1234 })).toBe("此项目共有 1,234 个工作项");
    }
  });
});
