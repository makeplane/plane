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

import { Zap } from "lucide-react";
import { AUTOMATION_TRIGGER_PLANE_EVENT_OPTIONS, AUTOMATION_TRIGGER_TIME_BASED_OPTIONS } from "@plane/constants";
import type { TAutomationTriggerSelectOption } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TTriggerNodeHandlerName } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { Tooltip } from "@plane/propel/tooltip";
import { AutomationTriggerIcon } from "./icon";

type Props = {
  selectedOption: TAutomationTriggerSelectOption | undefined;
  onSelect: (value: TTriggerNodeHandlerName) => void;
  isTimeBasedTrigger: boolean;
  hasTriggerNode: boolean;
  isRunnerHealthy: boolean;
  workspaceSlug: string;
};

export const AutomationDetailsSidebarTriggerSelect = (props: Props) => {
  const { selectedOption, onSelect, isTimeBasedTrigger, hasTriggerNode, isRunnerHealthy, workspaceSlug } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-2 px-4">
      <div className="flex items-center gap-1 text-tertiary">
        <span className="shrink-0 size-4 grid place-items-center">
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
                "text-placeholder border-accent-strong": !selectedOption,
              }
            )}
          >
            <span className="flex grow items-center gap-2">
              {selectedOption ? (
                <>
                  <AutomationTriggerIcon iconKey={selectedOption.iconKey} />
                  {selectedOption.label}
                </>
              ) : (
                t("automations.trigger.input_placeholder")
              )}
            </span>
            <ChevronDownIcon className="shrink-0 size-3" />
          </span>
        }
      >
        <div className="px-1 pb-1">
          <p className="text-11 font-semibold text-tertiary">{t("automations.trigger.section_plane_events")}</p>
        </div>
        {AUTOMATION_TRIGGER_PLANE_EVENT_OPTIONS.map((option) => (
          <CustomMenu.MenuItem
            key={option.value}
            className="flex items-center gap-2"
            onClick={() => onSelect(option.value)}
            disabled={hasTriggerNode && isTimeBasedTrigger}
          >
            <Tooltip
              tooltipContent={t("automations.trigger.warning.disabled_trigger_switching")}
              disabled={!hasTriggerNode || !isTimeBasedTrigger}
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
                  onClick={() => onSelect(option.value)}
                  disabled={hasTriggerNode && !isTimeBasedTrigger}
                >
                  <Tooltip
                    tooltipContent={t("automations.trigger.warning.disabled_trigger_switching")}
                    disabled={!hasTriggerNode || isTimeBasedTrigger}
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
  );
};
