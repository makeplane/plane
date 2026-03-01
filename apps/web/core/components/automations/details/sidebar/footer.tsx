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
import { CloseIcon, InitiativeIcon } from "@plane/propel/icons";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  automationId: string;
};

export const AutomationDetailsSidebarFooter = observer(function AutomationDetailsSidebarFooter(props: TProps) {
  const { automationId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;

  if (!sidebarHelper) return null;
  return (
    <footer className="flex-shrink-0 px-6 pb-6">
      {sidebarHelper.isPublishAlertOpen && (
        <div className="bg-layer-1 text-secondary rounded-lg p-3 flex items-start gap-2.5" role="status">
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <InitiativeIcon className="size-3" />
          </span>
          <p className="text-11">{t("automations.enable.alert")}</p>
          <button
            type="button"
            onClick={() => {
              sidebarHelper.setIsPublishAlertOpen(false);
            }}
            className="flex-shrink-0 size-4 grid place-items-center hover:text-primary transition-colors"
            aria-label="Close alert"
          >
            <CloseIcon className="size-3" />
          </button>
        </div>
      )}
    </footer>
  );
});
