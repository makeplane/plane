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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import { EAutomationSidebarTab } from "@plane/types";
import { getSidebarHeaderI18nTitle } from "@plane/utils";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActivityHeaderFilters } from "./activity/header-filters";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarHeader = observer(function AutomationDetailsSidebarHeader(props: Props) {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const selectedSidebarTab = sidebarHelper?.selectedSidebarConfig?.tab;
  const isActivityTab = selectedSidebarTab === EAutomationSidebarTab.ACTIVITY;
  // translation
  const { t } = useTranslation();
  // derived values
  const sidebarHeaderI18nTitle = selectedSidebarTab ? getSidebarHeaderI18nTitle(selectedSidebarTab) : "";

  return (
    <header className="shrink-0 px-4 pt-4 flex items-center justify-between gap-2">
      <h2 className="text-13 font-medium">{t(sidebarHeaderI18nTitle)}</h2>
      <div className="shrink-0 flex items-center gap-2">
        {isActivityTab && <AutomationDetailsSidebarActivityHeaderFilters automationId={automationId} />}
        <button
          type="button"
          className="shrink-0 size-5 grid place-items-center text-secondary hover:text-primary transition-colors"
          onClick={() => {
            sidebarHelper?.setSelectedSidebarConfig({ tab: null, mode: null });
          }}
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </header>
  );
});
