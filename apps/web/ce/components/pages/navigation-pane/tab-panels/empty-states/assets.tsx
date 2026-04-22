/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useTheme } from "@plane/react-theme";
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import darkAssetsAsset from "@/app/assets/empty-state/wiki/navigation-pane/assets-dark.webp?url";
import lightAssetsAsset from "@/app/assets/empty-state/wiki/navigation-pane/assets-light.webp?url";

export function PageNavigationPaneAssetsTabEmptyState() {
  // theme hook
  const { resolvedTheme } = useTheme();
  // asset resolved path
  const resolvedPath = resolvedTheme === "light" ? lightAssetsAsset : darkAssetsAsset;
  // translation
  const { t } = useTranslation();

  return (
    <div className="size-full grid place-items-center">
      <div className="flex flex-col items-center gap-y-6 text-center">
        <img src={resolvedPath} className="size-40 object-contain" alt="depicts the assets of a page" />
        <div className="space-y-2.5">
          <h4 className="text-14 font-medium">{t("page_navigation_pane.tabs.assets.empty_state.title")}</h4>
          <p className="text-13 text-secondary font-medium">
            {t("page_navigation_pane.tabs.assets.empty_state.description")}
          </p>
        </div>
      </div>
    </div>
  );
}
