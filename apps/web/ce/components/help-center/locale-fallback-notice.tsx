/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Info } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { THelpLocale } from "@/plane-web/types/help-center";

const LOCALE_LABEL_KEY: Record<THelpLocale, string> = {
  vi: "help_center.locale_tab_vi",
  en: "help_center.locale_tab_en",
  ko: "help_center.locale_tab_ko",
};

// Shown when the article resolved to a different locale than the user's UI
// language (graceful fallback), so the reader knows why the language differs.
export const LocaleFallbackNotice = ({ resolvedLocale }: { resolvedLocale: THelpLocale }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center gap-2 rounded-md border border-subtle bg-surface-2 px-3 py-2 text-13 text-secondary">
      <Info className="size-4 shrink-0 text-icon-primary" />
      <span>{t("help_center.shown_in_language_notice", { language: t(LOCALE_LABEL_KEY[resolvedLocale]) })}</span>
    </div>
  );
};

// Shown above search results when the user's UI language had no match and the
// search fell back to the source language, so the language switch is explained.
export const SearchFallbackNotice = ({
  uiLocale,
  fallbackLocale,
}: {
  uiLocale: THelpLocale;
  fallbackLocale: THelpLocale;
}) => {
  const { t } = useTranslation();
  return (
    <div className="mb-3 flex items-center gap-2 rounded-md border border-subtle bg-surface-2 px-3 py-2 text-13 text-secondary">
      <Info className="size-4 shrink-0 text-icon-primary" />
      <span>
        {t("help_center.search_locale_fallback", {
          language: t(LOCALE_LABEL_KEY[uiLocale]),
          fallback: t(LOCALE_LABEL_KEY[fallbackLocale]),
        })}
      </span>
    </div>
  );
};
