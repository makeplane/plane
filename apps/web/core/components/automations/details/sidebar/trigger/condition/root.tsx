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
import type { TAutomationConditionFilterExpression } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { AddFilterButton } from "@/components/rich-filters/add-filters/button";
import { FilterItem } from "@/components/rich-filters/filter-item/root";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationConditionFilterHOC } from "./filter-provider";

type Props = {
  automationId: string;
  initialFilterExpression: TAutomationConditionFilterExpression | undefined;
  updateFilterExpression: (updatedFilters: TAutomationConditionFilterExpression) => void;
};

export const AutomationDetailsSidebarTriggerConditionRoot = observer(
  function AutomationDetailsSidebarTriggerConditionRoot(props: Props) {
    const { automationId, initialFilterExpression, updateFilterExpression } = props;
    // plane hooks
    const { t } = useTranslation();
    // store hooks
    const { getAutomationById } = useAutomations();
    // derived values
    const automation = getAutomationById(automationId);

    if (!automation) return null;

    return (
      <AutomationConditionFilterHOC
        projectId={automation.project}
        workspaceSlug={automation.workspaceSlug}
        initialFilterExpression={initialFilterExpression}
        updateFilterExpression={updateFilterExpression}
      >
        {({ filter }) => (
          <section className="space-y-2">
            {filter && (
              <div className="space-y-2 px-4">
                <p className="text-11 font-medium">{t("automations.condition.label")}</p>
                <div className="flex flex-col items-start">
                  {filter.allConditionsForDisplay.map((condition, index) => (
                    <div key={condition.id} className="flex flex-col items-start">
                      <div className="w-fit">
                        <FilterItem filter={filter} condition={condition} showTransition={false} />
                      </div>
                      {index < filter.allConditionsForDisplay.length - 1 && (
                        <div className="flex flex-col items-center">
                          <div className="h-2 border-l border-dashed border-strong" />
                          <span className="text-11 font-medium uppercase text-secondary px-2 py-0.5 bg-layer-2 rounded-sm">
                            {t("automations.conjunctions.and")}
                          </span>
                          <div className="h-2 border-l border-dashed border-strong" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div
                    className={cn("w-fit", {
                      "pt-3": filter.allConditionsForDisplay.length > 0,
                    })}
                  >
                    <AddFilterButton
                      filter={filter}
                      buttonConfig={{
                        label: t("automations.condition.add_condition"),
                        variant: "secondary",
                        iconConfig: {
                          shouldShowIcon: false,
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </AutomationConditionFilterHOC>
    );
  }
);
