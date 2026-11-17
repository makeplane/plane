/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";

export function PageNavigationPaneAssetsTabEmptyState() {
  // translation
  const { t } = useTranslation();

  return (
    <EmptyStateCompact
      assetKey="page"
      title={t("page_navigation_pane.tabs.assets.empty_state.title")}
      description={t("page_navigation_pane.tabs.assets.empty_state.description")}
    />
  );
}
