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
import { ListFilter } from "lucide-react";
// plane imports
import { AUTOMATION_ACTIVITY_TYPE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TAutomationActivityType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { Switch } from "@plane/propel/switch";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarActivityHeaderFilters = observer(
  function AutomationDetailsSidebarActivityHeaderFilters(props: Props) {
    const { automationId } = props;
    // store hooks
    const { getAutomationById } = useAutomations();
    // derived values
    const { activity } = getAutomationById(automationId) ?? {};
    const { filters, updateFilters } = activity ?? {};
    // derived values
    const isShowFailsToggleEnabled = !!filters?.show_fails;
    const activityTypeFilter = filters?.type;
    // translation
    const { t } = useTranslation();

    return (
      <div className="shrink-0 flex items-center gap-2">
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-secondary text-11 font-medium">{t("automations.activity.filters.show_fails")}</span>
          <Switch
            value={isShowFailsToggleEnabled}
            onChange={() => {
              updateFilters?.({
                show_fails: !isShowFailsToggleEnabled,
              });
            }}
            className="shrink-0"
          />
        </div>
        <CustomSelect
          value={activityTypeFilter}
          onChange={(value: TAutomationActivityType) => {
            updateFilters?.({
              type: value,
            });
          }}
          customButton={
            <button
              type="button"
              className="relative grid place-items-center rounded hover:bg-layer-1 p-1 aspect-square transition-colors"
            >
              <ListFilter className="size-3" />
              {activityTypeFilter !== "all" && (
                <span className="absolute size-2 -right-0.5 -top-0.5 bg-accent-primary rounded-full" />
              )}
            </button>
          }
        >
          {AUTOMATION_ACTIVITY_TYPE_OPTIONS.map((item) => (
            <CustomSelect.Option key={item.key} value={item.key}>
              {t(item.i18n_label)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
    );
  }
);
