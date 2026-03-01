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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web imports
import { ConjunctionLabel } from "@/components/automations/details/main-content/common/conjunction-label";
import { AutomationConditionFilterHOC } from "@/components/automations/details/sidebar/trigger/condition/filter-provider";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsMainContentTriggerConditionItem } from "./condition-item";

type Props = {
  automationId: string;
};

export const AutomationDetailsMainContentTriggerCondition = observer(
  function AutomationDetailsMainContentTriggerCondition(props: Props) {
    const { automationId } = props;
    // store hooks
    const { getAutomationById } = useAutomations();
    // derived values
    const automation = getAutomationById(automationId);
    // translation
    const { t } = useTranslation();
    // condition node
    const conditionNode = automation?.allConditions[0];
    const { config } = conditionNode ?? {};
    const isFilterApplied = useMemo(() => {
      if (!config?.filter_expression) return false;
      const firstKey = Object.keys(config.filter_expression)[0];
      if (!firstKey) return false;
      const condition = config.filter_expression[firstKey as keyof typeof config.filter_expression] as unknown[];
      if (!condition || condition.length <= 0) return false;
      return true;
    }, [config]);

    if (!automation || !isFilterApplied) return null;

    return (
      <div className="pt-3 space-y-2">
        <ConjunctionLabel text={t("automations.condition.label")} />
        <AutomationConditionFilterHOC
          projectId={automation?.project}
          workspaceSlug={automation?.workspaceSlug}
          initialFilterExpression={config?.filter_expression}
        >
          {({ filter }) => (
            <section>
              {filter && (
                <div className="flex flex-col gap-y-2 items-start">
                  {filter.allConditionsForDisplay.map((condition, index) => (
                    <div key={condition.id} className="flex flex-col gap-y-2 items-start">
                      <AutomationDetailsMainContentTriggerConditionItem filter={filter} condition={condition} />
                      {index < filter.allConditionsForDisplay.length - 1 && (
                        <ConjunctionLabel text={t("automations.conjunctions.and")} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </AutomationConditionFilterHOC>
      </div>
    );
  }
);
