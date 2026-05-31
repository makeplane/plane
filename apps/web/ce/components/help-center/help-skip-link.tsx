/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";

// Skip-to-content link for keyboard/screen-reader users — the first focusable
// element in the help shell. Extracted into a component so the (non-i18n) route
// layout can render a localized label via t() instead of a hardcoded string.
export const HelpSkipLink = () => {
  const { t } = useTranslation();
  return (
    <a
      href="#help-main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface-1 focus:px-3 focus:py-2 focus:text-13 focus:text-primary focus:ring-1 focus:ring-accent-strong"
    >
      {t("help_center.skip_to_content")}
    </a>
  );
};
