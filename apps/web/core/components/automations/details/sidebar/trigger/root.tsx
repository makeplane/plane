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
import { Zap } from "lucide-react";
// plane imports
import {
  AUTOMATION_TRIGGER_SELECT_OPTIONS,
  DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION,
  AUTOMATION_TRIGGER_TIME_BASED_OPTIONS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
// helpers
import type { TAutomationConditionFilterExpression, TTriggerNodeHandlerName } from "@plane/types";
import { EAutomationSidebarTab, ETriggerNodeHandlerName } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn, generateConditionPayload } from "@plane/utils";
// plane web imports
import { useUser } from "@/hooks/store/user";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActionButtons } from "../action-buttons";
import { AutomationDetailsSidebarTriggerConditionRoot } from "./condition/root";
import { AutomationTriggerIcon } from "./icon";
import { AutomationDetailsSidebarTriggerSchedule } from "./schedule";
import {
  createDefaultFixedScheduleConfig,
  fixedScheduleToTriggerConfig,
  getFixedScheduleValidationErrorKey,
  isFixedScheduleConfigComplete,
  stripScheduleFieldsFromConfig,
  triggerConfigToFixedSchedule,
} from "./schedule-config";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { useRunners } from "@/hooks/store/runners/use-runners";
import { Tooltip } from "@plane/propel/tooltip";

type Props = {
  automationId: string;
};

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
  const isTimeBasedTrigger = triggerNodeHandlerName === ETriggerNodeHandlerName.FIXED_SCHEDULE;
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
  // derived states
  const selectedTriggerNodeHandlerOption = useMemo(
    () =>
      [...AUTOMATION_TRIGGER_SELECT_OPTIONS, ...AUTOMATION_TRIGGER_TIME_BASED_OPTIONS].find(
        (option) => option.value === selectedTriggerNodeHandlerName
      ),
    [selectedTriggerNodeHandlerName]
  );

  const createOrUpdateTrigger = async () => {
    if (!automation || !selectedTriggerNodeHandlerName) return;

    // If trigger node doesn't exist, create it with the selected handler and condition.
    const isFixedSchedule = selectedTriggerNodeHandlerName === ETriggerNodeHandlerName.FIXED_SCHEDULE;
    if (isFixedSchedule && !isFixedScheduleConfigComplete(fixedScheduleConfig)) {
      return;
    }
    if (!triggerNode) {
      try {
        await automation.createTrigger({
          handler_name: selectedTriggerNodeHandlerName,
          ...(isFixedSchedule ? { config: fixedScheduleToTriggerConfig(fixedScheduleConfig) } : {}),
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

    const nextTriggerConfig = isFixedSchedule
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

    // If condition node doesn't exist, create it.
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

    // If filter expression changed, update the condition node.
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
    if (isTimeBasedTrigger) {
      if (triggerNode) {
        setFixedScheduleConfig(triggerConfigToFixedSchedule(triggerNode.config, profileTimezone));
      } else {
        setFixedScheduleConfig(createDefaultFixedScheduleConfig(profileTimezone));
      }
    }

    // Intentionally omit profileTimezone and triggerNode.config: profile timezone is synced separately without
    // resetting the form; config changes are handled on save / navigation.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNode?.handler_name, triggerNode?.id]);

  if (!automation) return null;
  return (
    <section className="flex-grow space-y-4 pt-2">
      <div className="space-y-2 px-4">
        <div className="flex items-center gap-1 text-tertiary">
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <Zap className="size-3" />
          </span>
          <p className="text-11 font-medium">{t("automations.trigger.input_label")}</p>
        </div>
        <CustomMenu
          className="w-full"
          placement="bottom-start"
          maxHeight="lg"
          closeOnSelect
          customButtonClassName="w-full"
          customButton={
            <span
              className={cn(
                "text-caption-sm-regular w-full px-4 h-7 rounded-md border-[0.5px] border-subtle-1 hover:bg-layer-transparent-hover text-left flex items-center gap-2 cursor-pointer transition-colors",
                {
                  "text-placeholder border-accent-strong": !selectedTriggerNodeHandlerName,
                }
              )}
            >
              <span className="flex flex-grow items-center gap-2">
                {selectedTriggerNodeHandlerOption ? (
                  <>
                    <AutomationTriggerIcon iconKey={selectedTriggerNodeHandlerOption.iconKey} />
                    {selectedTriggerNodeHandlerOption.label}
                  </>
                ) : (
                  t("automations.trigger.input_placeholder")
                )}
              </span>
              <ChevronDownIcon className="flex-shrink-0 size-3" />
            </span>
          }
        >
          <div className="px-1 pb-1">
            <p className="text-11 font-semibold text-tertiary">{t("automations.trigger.section_plane_events")}</p>
          </div>
          {AUTOMATION_TRIGGER_SELECT_OPTIONS.map((option) => (
            <CustomMenu.MenuItem
              key={option.value}
              className="flex items-center gap-2"
              onClick={() => {
                setSelectedTriggerNodeHandlerName(option.value);
              }}
              disabled={triggerNode && isTimeBasedTrigger}
            >
              <Tooltip
                tooltipContent={t("automations.trigger.warning.disabled_trigger_switching")}
                disabled={!triggerNode || !isTimeBasedTrigger}
              >
                <span className="flex w-full min-w-0 items-center gap-2">
                  <AutomationTriggerIcon iconKey={option.iconKey} />
                  <span className="truncate font-medium">{option.label}</span>
                </span>
              </Tooltip>
            </CustomMenu.MenuItem>
          ))}
          {isRunnerHealthy && (
            <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={"PLANE_RUNNER"} fallback={null}>
              <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={"SCHEDULED_AUTOMATIONS"} fallback={null}>
                <div className="mx-1 mt-1 border-t border-subtle-1 pt-2 pb-1">
                  <p className="text-11 font-semibold text-tertiary">{t("automations.trigger.section_time_based")}</p>
                </div>
                {AUTOMATION_TRIGGER_TIME_BASED_OPTIONS.map((option) => (
                  <CustomMenu.MenuItem
                    key={option.value}
                    className="flex items-center gap-2"
                    onClick={() => {
                      setSelectedTriggerNodeHandlerName(option.value);
                    }}
                    disabled={triggerNode && !isTimeBasedTrigger}
                  >
                    <Tooltip
                      tooltipContent={t("automations.trigger.warning.disabled_trigger_switching")}
                      disabled={!triggerNode || isTimeBasedTrigger}
                    >
                      <span className="flex w-full min-w-0 items-center gap-2">
                        <AutomationTriggerIcon iconKey={option.iconKey} />
                        <span className="truncate font-medium">{option.label}</span>
                      </span>
                    </Tooltip>
                  </CustomMenu.MenuItem>
                ))}
              </WithFeatureFlagHOC>
            </WithFeatureFlagHOC>
          )}
        </CustomMenu>
      </div>
      {selectedTriggerNodeHandlerOption?.value === ETriggerNodeHandlerName.FIXED_SCHEDULE ? (
        <AutomationDetailsSidebarTriggerSchedule
          value={fixedScheduleConfig}
          onChange={setFixedScheduleConfig}
          validationErrorKey={getFixedScheduleValidationErrorKey(fixedScheduleConfig)}
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
            (selectedTriggerNodeHandlerName === ETriggerNodeHandlerName.FIXED_SCHEDULE &&
              !isFixedScheduleConfigComplete(fixedScheduleConfig)),
          onClick: handleNextButtonClick,
        }}
      />
    </section>
  );
});
