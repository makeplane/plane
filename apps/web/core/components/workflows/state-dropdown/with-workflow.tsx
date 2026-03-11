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
import { useParams } from "next/navigation";
import { CheckIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// components
import { WorkFlowDisabledMessage } from "@/components/workflows";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkflows } from "@/hooks/store/use-workflows";
// local imports
import type { TWorkItemStateOptionProps } from "./types";

export const WorkItemStateOptionWithWorkflow = observer(function WorkItemStateOptionWithWorkflow(
  props: TWorkItemStateOptionProps
) {
  const {
    projectId,
    typeId,
    option,
    selectedValue,
    className,
    filterAvailableStateIds = true,
    isForWorkItemCreation = false,
  } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { isWorkflowsEnabled, getAllowedTransitionStateIds, getCreationAllowedStateIds } = useWorkflows();
  // derived values
  const isEnabled = workspaceSlug && projectId ? isWorkflowsEnabled(workspaceSlug.toString(), projectId) : false;
  const availableStateIdMap =
    isEnabled && projectId
      ? isForWorkItemCreation
        ? getCreationAllowedStateIds(projectId, typeId)
        : getAllowedTransitionStateIds(workspaceSlug.toString(), projectId, typeId, selectedValue, currentUser?.id)
      : {};
  const isDisabled =
    selectedValue !== option.value && filterAvailableStateIds && !availableStateIdMap[option.value ?? ""];
  const messageStateId = isForWorkItemCreation ? (option.value ?? "") : (selectedValue ?? "");

  return (
    <Tooltip
      tooltipContent={
        <WorkFlowDisabledMessage
          parentStateId={messageStateId}
          typeId={typeId}
          compact
          isForWorkItemCreation={isForWorkItemCreation}
        />
      }
      className="border-[0.5px] border-subtle-1 mx-0.5 shadow-lg"
      position="right-start"
      disabled={!isDisabled || !messageStateId}
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
