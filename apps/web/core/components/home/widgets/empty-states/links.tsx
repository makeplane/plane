/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export function LinksEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 bg-layer-1 w-full rounded-lg">
      <EmptyStateCompact
        assetKey="link"
        assetClassName="w-20 h-20"
        title={t("workspace_empty_state.home_widget_quick_links.title")}
      />
    </div>
  );
}
