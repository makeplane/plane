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

import { useEffect, useMemo, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import {
  AUTOMATION_TRIGGER_PLANE_EVENT_OPTIONS,
  DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION,
  AUTOMATION_TRIGGER_TIME_BASED_OPTIONS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type {
  TAutomationConditionFilterExpression,
  TAutomationTriggerNodeConfig,
  TTriggerNodeHandlerName,
} from "@plane/types";
import { EAutomationSidebarTab, ETriggerNodeHandlerName } from "@plane/types";
import { generateConditionPayload } from "@plane/utils";
// plane web imports
import { useUser } from "@/hooks/store/user";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
import { useRunners } from "@/hooks/store/runners/use-runners";
// local imports
import { AutomationDetailsSidebarActionButtons } from "../action-buttons";
import { AutomationDetailsSidebarTriggerConditionRoot } from "./condition/root";
import { AutomationDetailsSidebarTriggerSelect } from "./trigger-select";
import { AutomationDetailsSidebarTriggerTimeBasedRoot } from "./time-based-root";
import { isRecord } from "@plane/utils";
import {
  createDefaultFixedScheduleConfig,
  fixedScheduleToTriggerConfig,
  isFixedScheduleConfigComplete,
  stripScheduleFieldsFromConfig,
  triggerConfigToFixedSchedule,
} from "./schedule-config";
import {
  createDefaultCronScheduleConfig,
  cronScheduleToTriggerConfig,
  isCronScheduleConfigComplete,
  triggerConfigToCronSchedule,
} from "./cron-config";

type Props = {
  automationId: string;
};

function getScheduleMethodFromConfig(config: TAutomationTriggerNodeConfig | undefined): "fixed" | "cron" | undefined {
  if (!isRecord(config)) return undefined;
  const method = config.method;
  if (method === "cron") return "cron";
  if (method === "fixed") return "fixed";
  return undefined;
}

export const AutomationDetailsSidebarTriggerRoot = observer(function AutomationDetailsSidebarTriggerRoot(props: Props) {
  const { automationId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const user = useUser();
  const profileTimezone = user.data?.user_timezone;
  const { getAutomationById } = useAutomations();
  const { isRunnerAvailable } = useRunners();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const triggerNode = automation?.trigger;
  const conditionNode = automation?.allConditions?.[0];
  const filterExpression = conditionNode?.config?.filter_expression;
  const triggerNodeHandlerName = triggerNode?.handler_name;
  const isTimeBasedTrigger = triggerNodeHandlerName === ETriggerNodeHandlerName.SCHEDULED;
  const workspaceSlug = automation?.workspaceSlug ?? "";
  const isRunnerHealthy = isRunnerAvailable(workspaceSlug);
  // states
  const [isCreatingUpdatingTrigger, setIsCreatingUpdatingTrigger] = useState(false);
  const [isCreatingUpdatingCondition, setIsCreatingUpdatingCondition] = useState(false);
  const [selectedTriggerNodeHandlerName, setSelectedTriggerNodeHandlerName] = useState<
    TTriggerNodeHandlerName | undefined
  >(triggerNodeHandlerName);
  const [selectedFilterExpression, setSelectedFilterExpression] = useState<TAutomationConditionFilterExpression>(
    filterExpression ?? DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION
  );
  const [fixedScheduleConfig, setFixedScheduleConfig] = useState(() =>
    triggerNode && isTimeBasedTrigger
      ? triggerConfigToFixedSchedule(triggerNode.config, profileTimezone)
      : createDefaultFixedScheduleConfig(profileTimezone)
  );
  const [selectedScheduleMethod, setSelectedScheduleMethod] = useState<"fixed" | "cron">(() => {
    if (triggerNode && isTimeBasedTrigger) {
      return getScheduleMethodFromConfig(triggerNode.config) ?? "fixed";
    }
    return "fixed";
  });
  const [cronScheduleConfig, setCronScheduleConfig] = useState(() =>
    triggerNode && isTimeBasedTrigger && getScheduleMethodFromConfig(triggerNode.config) === "cron"
      ? triggerConfigToCronSchedule(triggerNode.config, profileTimezone)
      : createDefaultCronScheduleConfig(profileTimezone)
  );
  // derived states
  const selectedTriggerNodeHandlerOption = useMemo(
    () =>
      [...AUTOMATION_TRIGGER_PLANE_EVENT_OPTIONS, ...AUTOMATION_TRIGGER_TIME_BASED_OPTIONS].find(
        (option) => option.value === selectedTriggerNodeHandlerName
      ),
    [selectedTriggerNodeHandlerName]
  );
  const isTimeBasedTriggerSelected = selectedTriggerNodeHandlerOption?.value === ETriggerNodeHandlerName.SCHEDULED;

  const handleScheduleMethodChange = (method: "fixed" | "cron") => {
    if (method === selectedScheduleMethod) return;
    setSelectedScheduleMethod(method);
    if (method === "cron") {
      setFixedScheduleConfig(createDefaultFixedScheduleConfig(profileTimezone));
    } else {
      setCronScheduleConfig(createDefaultCronScheduleConfig(profileTimezone));
    }
  };

  const createOrUpdateTrigger = async () => {
    if (!automation || !selectedTriggerNodeHandlerName) return;

    const isScheduled = selectedTriggerNodeHandlerName === ETriggerNodeHandlerName.SCHEDULED;
    const isCron = isScheduled && selectedScheduleMethod === "cron";
    const isFixed = isScheduled && selectedScheduleMethod === "fixed";

    if (isFixed && !isFixedScheduleConfigComplete(fixedScheduleConfig)) return;
    if (isCron && !isCronScheduleConfigComplete(cronScheduleConfig)) return;

    if (!triggerNode) {
      try {
        const config = isCron
          ? cronScheduleToTriggerConfig(cronScheduleConfig)
          : isFixed
            ? fixedScheduleToTriggerConfig(fixedScheduleConfig)
            : undefined;
        await automation.createTrigger({
          handler_name: selectedTriggerNodeHandlerName,
          ...(config ? { config } : {}),
          conditionPayload: {
            config: {
              filter_expression: selectedFilterExpression,
            },
          },
        });
      } catch (error) {
        console.error("Failed to create trigger:", error);
      }
      return;
    }

    const nextTriggerConfig = isCron
      ? cronScheduleToTriggerConfig(cronScheduleConfig)
      : isFixed
        ? fixedScheduleToTriggerConfig(fixedScheduleConfig)
        : stripScheduleFieldsFromConfig(triggerNode.config);

    const handlerChanged = triggerNode.handler_name !== selectedTriggerNodeHandlerName;
    const configChanged = !isEqual(triggerNode.config, nextTriggerConfig);

    if (handlerChanged || configChanged) {
      try {
        await triggerNode.update({
          ...(handlerChanged ? { handler_name: selectedTriggerNodeHandlerName } : {}),
          ...(configChanged ? { config: nextTriggerConfig } : {}),
        });
      } catch (error) {
        console.error("Failed to update trigger:", error);
      }
    }
  };

  const createOrUpdateCondition = async () => {
    if (!automation || !selectedTriggerNodeHandlerName) return;

    if (!conditionNode) {
      try {
        const conditionPayload = generateConditionPayload({
          triggerHandlerName: selectedTriggerNodeHandlerName,
          conditionPayload: {
            config: {
              filter_expression: selectedFilterExpression,
            },
          },
        });
        await automation.createCondition(conditionPayload);
      } catch (error) {
        console.error("Failed to create condition:", error);
      }
      return;
    }

    if (!isEqual(conditionNode.config.filter_expression, selectedFilterExpression)) {
      try {
        await conditionNode.update({
          config: {
            filter_expression: selectedFilterExpression,
          },
        });
      } catch (error) {
        console.error("Failed to update condition:", error);
      }
    }
  };

  const handleNextButtonClick = async () => {
    setIsCreatingUpdatingTrigger(true);
    setIsCreatingUpdatingCondition(true);

    try {
      await createOrUpdateTrigger();
      setIsCreatingUpdatingTrigger(false);

      await createOrUpdateCondition();
      setIsCreatingUpdatingCondition(false);

      sidebarHelper?.setSelectedSidebarConfig({
        tab: EAutomationSidebarTab.ACTION,
        mode: automation?.isAnyActionNodeAvailable ? "view" : "create",
      });
    } catch (error) {
      console.error("Failed to proceed to next step:", error);
      setIsCreatingUpdatingTrigger(false);
      setIsCreatingUpdatingCondition(false);
    }
  };

  useEffect(() => {
    setSelectedTriggerNodeHandlerName(triggerNode?.handler_name);
    if (isTimeBasedTrigger && triggerNode) {
      const method = getScheduleMethodFromConfig(triggerNode.config);
      setSelectedScheduleMethod(method ?? "fixed");
      if (method === "cron") {
        setCronScheduleConfig(triggerConfigToCronSchedule(triggerNode.config, profileTimezone));
      } else {
        setFixedScheduleConfig(triggerConfigToFixedSchedule(triggerNode.config, profileTimezone));
      }
    } else if (isTimeBasedTrigger) {
      setSelectedScheduleMethod("fixed");
      setFixedScheduleConfig(createDefaultFixedScheduleConfig(profileTimezone));
    }
    // Intentionally omit profileTimezone and triggerNode.config: profile timezone is synced separately without
    // resetting the form; config changes are handled on save / navigation.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNode?.handler_name, triggerNode?.id]);

  if (!automation) return null;
  return (
    <section className="grow space-y-4 pt-2">
      <AutomationDetailsSidebarTriggerSelect
        selectedOption={selectedTriggerNodeHandlerOption}
        onSelect={setSelectedTriggerNodeHandlerName}
        isTimeBasedTrigger={isTimeBasedTrigger}
        hasTriggerNode={!!triggerNode}
        isRunnerHealthy={isRunnerHealthy}
        workspaceSlug={workspaceSlug}
      />
      {isTimeBasedTriggerSelected ? (
        <AutomationDetailsSidebarTriggerTimeBasedRoot
          scheduleMethod={selectedScheduleMethod}
          onScheduleMethodChange={handleScheduleMethodChange}
          fixedScheduleConfig={fixedScheduleConfig}
          onFixedScheduleChange={setFixedScheduleConfig}
          cronScheduleConfig={cronScheduleConfig}
          onCronScheduleChange={setCronScheduleConfig}
        />
      ) : (
        <AutomationDetailsSidebarTriggerConditionRoot
          automationId={automationId}
          initialFilterExpression={selectedFilterExpression}
          updateFilterExpression={setSelectedFilterExpression}
        />
      )}
      <AutomationDetailsSidebarActionButtons
        previousButton={{
          label: t("automations.trigger.button.previous"),
          isDisabled: true,
        }}
        nextButton={{
          label: isCreatingUpdatingTrigger
            ? t("common.confirming")
            : triggerNode
              ? t("common.continue")
              : t("automations.trigger.button.next"),
          isDisabled:
            !selectedTriggerNodeHandlerName ||
            isCreatingUpdatingTrigger ||
            isCreatingUpdatingCondition ||
            (isTimeBasedTriggerSelected &&
              selectedScheduleMethod === "fixed" &&
              !isFixedScheduleConfigComplete(fixedScheduleConfig)) ||
            (isTimeBasedTriggerSelected &&
              selectedScheduleMethod === "cron" &&
              !isCronScheduleConfigComplete(cronScheduleConfig)),
          onClick: handleNextButtonClick,
        }}
      />
    </section>
  );
});
