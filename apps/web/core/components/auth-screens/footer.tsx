/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";

export function AuthFooter() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-xs text-color-tertiary">{t("auth.footer.custom_powered_by")}</span>
    </div>
  );
}
