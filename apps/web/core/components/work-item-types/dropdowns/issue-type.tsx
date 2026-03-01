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
import { LayersIcon } from "@plane/propel/icons";
import type { IIssueType } from "@plane/types";
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
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  handleIssueTypeChange: (value: string) => void;
  isInitializing?: boolean;
  issueTypeId: string | null;
  optionTooltip?: TIssueTypeOptionTooltip;
  placeholder?: string;
  projectId: string;
  variant?: TIssueTypeDropdownVariant;
};

export const IssueTypeDropdown = observer(function IssueTypeDropdown(props: TIssueTypeDropdownProps) {
  const {
    issueTypeId,
    projectId,
    disabled = false,
    variant = "sm",
    placeholder = "Work item type",
    isInitializing = false,
    handleIssueTypeChange,
    optionTooltip,
    buttonClassName,
    getWorkItemTypes,
  } = props;
  // derived values
  const allIssueTypes = getWorkItemTypes(projectId, false);
  const activeIssueTypes = getWorkItemTypes(projectId, true);

  // Can be used with CustomSearchSelect as well
  const issueTypeOptions = Object.entries(activeIssueTypes).map(([issueTypeId, issueTypeDetail]) => ({
    value: issueTypeId,
    query: issueTypeDetail.name ?? "",
    content: (
      <div className="flex w-full gap-2 items-center">
        <IssueTypeLogo icon_props={issueTypeDetail?.logo_props?.icon} isDefault={issueTypeDetail?.is_default} />
        <div
          className={cn("text-secondary truncate", {
            "text-caption-md-regular": variant === "xs",
            "text-body-sm-medium": variant === "sm",
          })}
        >
          {issueTypeDetail.name}
        </div>
      </div>
    ),
    tooltip: optionTooltip?.[issueTypeId] ?? undefined,
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
      value={issueTypeId}
      label={
        <div
          className={cn("flex w-full items-center max-w-44", {
            "gap-1": variant === "xs",
            "gap-2": variant === "sm",
          })}
        >
          {!issueTypeId && (
            <LayersIcon
              className={cn("flex-shrink-0 text-tertiary", {
                "size-3": variant === "xs",
                "size-4": variant === "sm",
              })}
            />
          )}
          {issueTypeId && (
            <IssueTypeLogo
              icon_props={allIssueTypes[issueTypeId]?.logo_props?.icon}
              isDefault={allIssueTypes[issueTypeId]?.is_default}
              size={variant}
            />
          )}
          <div
            className={cn("truncate", issueTypeId ? "text-secondary" : "text-tertiary", {
              "text-caption-md-regular": variant === "xs",
              "text-body-sm-medium": variant === "sm",
            })}
          >
            {issueTypeId ? allIssueTypes[issueTypeId]?.name : placeholder}
          </div>
        </div>
      }
      options={issueTypeOptions}
      onChange={handleIssueTypeChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      buttonClassName={cn("rounded-sm text-13 py-0.5 bg-surface-1 border-[0.5px] border-subtle-1", buttonClassName)}
      disabled={disabled}
      noChevron
    />
  );
});
