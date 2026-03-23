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
import { useParams } from "react-router";
import { CheckIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { cn } from "@plane/utils";
// components
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
  const isEnabled = workspaceSlug && projectId ? isWorkflowsEnabled(workspaceSlug, projectId) : false;
  const availableStateIdMap =
    isEnabled && workspaceSlug && projectId
      ? isForWorkItemCreation
        ? getCreationAllowedStateIds(projectId, typeId)
        : getAllowedTransitionStateIds(workspaceSlug, projectId, typeId, selectedValue, currentUser?.id)
      : {};
  const isCurrentState = selectedValue === option.value;
  const isDisabled = !isCurrentState && filterAvailableStateIds && !availableStateIdMap[option.value ?? ""];

  if (isDisabled) return null;

  return (
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
          <div className="flex justify-between w-full">
            <span className="grow truncate">{option.content}</span>
            {selected && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
          </div>
        )}
      </Combobox.Option>
    </div>
  );
});
