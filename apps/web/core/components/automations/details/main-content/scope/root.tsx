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
import { LayersIcon } from "@plane/propel/icons";
// local imports
import { AutomationDetailsMainContentBlockWrapper } from "../common/block-wrapper";
import { AutomationDetailsMainContentSectionWrapper } from "../common/section-wrapper";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentScopeRoot = observer(function AutomationDetailsMainContentScopeRoot(
  _props: TProps
) {
  // translation
  const { t } = useTranslation();

  return (
    <AutomationDetailsMainContentSectionWrapper title={t("automations.scope.label")}>
      <AutomationDetailsMainContentBlockWrapper>
        <p className="leading-4 text-13 text-accent-primary font-medium font-mono uppercase">
          {t("automations.scope.run_on")}
        </p>
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 size-12 rounded-full bg-accent-primary/20 grid place-items-center">
            <LayersIcon className="size-5 text-accent-primary" />
          </span>
          <p className="text-13 font-medium">{t("common.work_items")}</p>
        </div>
      </AutomationDetailsMainContentBlockWrapper>
    </AutomationDetailsMainContentSectionWrapper>
  );
});
