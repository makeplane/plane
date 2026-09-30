/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageOfflineBadge = observer(function PageOfflineBadge({ page }: Props) {
  // translation
  const { t } = useTranslation();
  // use online status
  const { isOnline } = useOnlineStatus();

  if (!page.isContentEditable || isOnline) return null;

  return (
    <Tooltip tooltipHeading={t("page_ui.offline.heading")} tooltipContent={t("page_ui.offline.description")}>
      <div className="flex h-7 flex-shrink-0 items-center gap-2 rounded-full bg-layer-1 px-3 py-0.5 text-11 font-medium text-tertiary">
        <span className="size-1.5 flex-shrink-0 rounded-full bg-layer-1" />
        <span>{t("page_ui.offline.label")}</span>
      </div>
    </Tooltip>
  );
});
