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
import { CheckIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// components
import { WorkFlowDisabledMessage } from "@/components/workflow";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import type { TWorkItemStateOptionProps } from "./types";

export const WorkItemStateOptionWithWorkflow = observer(function WorkItemStateOptionWithWorkflow(
  props: TWorkItemStateOptionProps
) {
  const {
    projectId,
    option,
    selectedValue,
    className,
    filterAvailableStateIds = true,
    isForWorkItemCreation = false,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAvailableProjectStateIdMap, getAvailableWorkItemCreationStateIdMap } = useProjectState();
  // derived values
  const availableStateIdMap = isForWorkItemCreation
    ? getAvailableWorkItemCreationStateIdMap(projectId)
    : getAvailableProjectStateIdMap(projectId, selectedValue);
  const isDisabled =
    selectedValue !== option.value && filterAvailableStateIds && !availableStateIdMap[option.value ?? ""];

  return (
    <Tooltip
      tooltipContent={
        isForWorkItemCreation ? (
          <div className="py-1.5 px-1">{t("workflows.workflow_states.work_item_creation_disable_tooltip")}</div>
        ) : (
          <WorkFlowDisabledMessage parentStateId={selectedValue ?? ""} />
        )
      }
      className="border-[0.5px] border-subtle-1 mx-0.5 shadow-lg"
      position={isForWorkItemCreation ? "right" : "right-start"}
      disabled={!isDisabled}
    >
      <div>
        <Combobox.Option
          key={option.value}
          value={option.value}
          className={({ active, selected }) =>
            cn(className, active ? "bg-layer-1" : "", selected ? "text-primary" : "text-secondary", {
              "cursor-not-allowed text-placeholder hover:bg-layer-1": isDisabled,
            })
          }
          disabled={isDisabled}
        >
          {({ selected }) => (
            <div className={cn("flex justify-between w-full")}>
              <span className="flex-grow truncate">{option.content}</span>
              {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
            </div>
          )}
        </Combobox.Option>
      </div>
    </Tooltip>
  );
});
