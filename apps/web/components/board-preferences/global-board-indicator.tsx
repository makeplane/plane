/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// shown in the project board's display menu while the global board template is on.

import { observer } from "mobx-react";
import { GlobeOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";

export const GlobalBoardIndicator = observer(function GlobalBoardIndicator() {
  const { t } = useTranslation();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  if (!issuesFilter.globalBoard.isActive()) return null;
  return (
    <div className="mx-2 mt-2 mb-1 flex items-start gap-2 rounded-md bg-layer-1 px-2 py-1.5">
      <GlobeOutline className="mt-0.5 size-3.5 shrink-0 text-secondary" />
      <div className="flex flex-col">
        <span className="text-caption-md-medium text-primary">
          {t("account_settings.preferences.global_board_active")}
        </span>
        <span className="text-caption-sm-regular text-secondary">
          {t("account_settings.preferences.global_board_active_hint")}
        </span>
      </div>
    </div>
  );
});
