/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { useTranslation } from "@plane/i18n";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageOfflineBadge = observer(function PageOfflineBadge({ page }: Props) {
  // use online status
  const { isOnline } = useOnlineStatus();
  const { t } = useTranslation();

  if (!page.isContentEditable || isOnline) return null;

  return (
    <Tooltip
      tooltipHeading={t("common.you_are_offline")}
      tooltipContent={t("common.offline_description")}
    >
      <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-layer-1 px-3 py-0.5 text-11 font-medium text-tertiary">
        <span className="flex-shrink-0 size-1.5 rounded-full bg-layer-1" />
        <span>{t("common.offline")}</span>
      </div>
    </Tooltip>
  );
});
