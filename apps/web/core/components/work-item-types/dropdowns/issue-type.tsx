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
import { LayersIcon } from "@plane/propel/icons";
import type { BaseWorkItemTypeInstanceSchema, IIssueType } from "@plane/types";
import { CustomSearchSelect, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import type { TIssueTypeDropdownVariant } from "@/components/issues/issue-modal/properties/issue-type-select";
// plane web types
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";

export type TIssueTypeOptionTooltip = {
  [issueTypeId: string]: string; // issue type id --> tooltip content
};

type TIssueTypeDropdownProps = {
  buttonClassName?: string;
  disabled?: boolean;
  allWorkItemTypes: IIssueType[] | BaseWorkItemTypeInstanceSchema[];
  showOnlyActiveWorkItemTypes?: boolean;
  handleChange: (value: string) => void;
  isInitializing?: boolean;
  selectedWorkItemTypeId: string | null;
  optionTooltip?: TIssueTypeOptionTooltip;
  placeholder?: string;
  variant?: TIssueTypeDropdownVariant;
  noChevron?: boolean;
};

export const IssueTypeDropdown = observer(function IssueTypeDropdown(props: TIssueTypeDropdownProps) {
  const {
    selectedWorkItemTypeId,
    allWorkItemTypes,
    showOnlyActiveWorkItemTypes = true,
    disabled = false,
    variant = "sm",
    placeholder = "Work item type",
    isInitializing = false,
    handleChange,
    optionTooltip,
    buttonClassName,
    noChevron = true,
  } = props;
  // derived values
  const activeWorkItemTypes = useMemo(
    () =>
      showOnlyActiveWorkItemTypes
        ? allWorkItemTypes.filter((workItemType) => workItemType.is_active)
        : allWorkItemTypes,
    [allWorkItemTypes, showOnlyActiveWorkItemTypes]
  );
  const selectedWorkItemTypeDetails = useMemo(
    () => activeWorkItemTypes.find((workItemType) => workItemType.id === selectedWorkItemTypeId),
    [activeWorkItemTypes, selectedWorkItemTypeId]
  );

  // Can be used with CustomSearchSelect as well
  const workItemTypeOptions = activeWorkItemTypes.map((typeDetails) => ({
    value: typeDetails.id,
    query: typeDetails.name ?? "",
    content: (
      <div className="flex w-full gap-2 items-center">
        <IssueTypeLogo icon_props={typeDetails?.logo_props?.icon} isDefault={typeDetails?.is_default} />
        <div
          className={cn("text-secondary truncate", {
            "text-caption-md-regular": variant === "xs",
            "text-body-sm-medium": variant === "sm",
          })}
        >
          {typeDetails.name}
        </div>
      </div>
    ),
    tooltip: optionTooltip?.[typeDetails.id ?? ""],
  }));

  if (isInitializing) {
    return (
      <Loader className="w-16 h-full">
        <Loader.Item height="100%" />
      </Loader>
    );
  }

  return (
    <CustomSearchSelect
      value={selectedWorkItemTypeId}
      label={
        <div
          className={cn("flex w-full items-center max-w-44", {
            "gap-1": variant === "xs",
            "gap-2": variant === "sm",
          })}
        >
          {!selectedWorkItemTypeId && (
            <LayersIcon
              className={cn("shrink-0 text-tertiary", {
                "size-3": variant === "xs",
                "size-4": variant === "sm",
              })}
            />
          )}
          {selectedWorkItemTypeDetails && (
            <IssueTypeLogo
              icon_props={selectedWorkItemTypeDetails?.logo_props?.icon}
              isDefault={selectedWorkItemTypeDetails?.is_default}
              size={variant}
            />
          )}
          <div
            className={cn("truncate", selectedWorkItemTypeId ? "text-secondary" : "text-tertiary", {
              "text-caption-md-regular": variant === "xs",
              "text-body-sm-medium": variant === "sm",
            })}
          >
            {selectedWorkItemTypeDetails?.name ?? placeholder}
          </div>
        </div>
      }
      options={workItemTypeOptions}
      onChange={handleChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      buttonClassName={cn("rounded-sm text-13 py-0.5 bg-surface-1 border-[0.5px] border-subtle-1", buttonClassName)}
      disabled={disabled}
      noChevron={noChevron}
    />
  );
});
