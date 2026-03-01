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
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
// plane imports
import type { TLoader, IIssueType } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
// local imports
import { IssueTypeLogo } from "./common/issue-type-logo";
import { IssuePropertiesRoot } from "./properties/root";
import { IssueTypeQuickActions } from "./quick-actions";

type TIssueTypeListItem = {
  issueTypeId: string;
  isOpen: boolean;
  isCollapseDisabled: boolean;
  propertiesLoader: TLoader;
  containerClassName?: string;
  onToggle: (issueTypeId: string) => void;
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
  onDeleteIssueTypeIdChange: (issueTypeId: string) => void;
  onEnableDisableIssueType: (issueTypeId: string) => Promise<void>;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  getClassName?: (isOpen: boolean) => string;
};

export const IssueTypeListItem = observer(function IssueTypeListItem(props: TIssueTypeListItem) {
  const {
    issueTypeId,
    isOpen,
    isCollapseDisabled,
    propertiesLoader,
    containerClassName,
    onToggle,
    onEditIssueTypeIdChange,
    onDeleteIssueTypeIdChange,
    onEnableDisableIssueType,
    getWorkItemTypeById,
    getClassName,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;
  if (!issueTypeDetail) return null;

  return (
    <div className={cn("py-2 border-b border-subtle last:border-b-0", containerClassName)}>
      <div
        className={cn(
          "group/issue-type bg-surface-1 hover:bg-layer-1-hover rounded-md",
          {
            "bg-layer-1": isOpen,
          },
          getClassName?.(isOpen)
        )}
      >
        <Collapsible
          key={issueTypeId}
          open={isOpen}
          onOpenChange={(open) => {
            if (open !== isOpen) {
              onToggle(issueTypeId);
            }
          }}
          className={cn("p-2")}
        >
          <CollapsibleTrigger
            className={cn("flex w-full py-2 gap-2 items-center justify-between", {
              "cursor-not-allowed": isCollapseDisabled,
            })}
          >
            <div className={cn("flex items-center w-full px-2 gap-2 cursor-pointer")}>
              <div className={cn("flex w-full gap-2 items-center truncate")}>
                <div className="flex-shrink-0">
                  <ChevronRightIcon
                    className={cn("flex-shrink-0 size-4", {
                      "rotate-90 text-primary": isOpen,
                      "text-tertiary": !isOpen,
                      "text-placeholder opacity-70": isCollapseDisabled,
                    })}
                  />
                </div>
                <IssueTypeLogo
                  icon_props={issueTypeDetail?.logo_props?.icon}
                  size="xl"
                  isDefault={issueTypeDetail?.is_default}
                  containerClassName={cn(!issueTypeDetail?.is_active && "opacity-60")}
                />
                <div className="flex flex-col items-start justify-start whitespace-normal">
                  <div className="flex gap-4 text-left items-center">
                    <div className="text-body-xs-medium text-primary line-clamp-1">{issueTypeDetail?.name}</div>
                    {!issueTypeDetail?.is_active && (
                      <div className="py-0.5 px-3 text-caption-sm-medium rounded-sm text-tertiary bg-layer-2">
                        {t("common.disabled")}
                      </div>
                    )}
                  </div>
                  <div className="text-caption-sm-medium text-tertiary text-left line-clamp-1">
                    {issueTypeDetail?.description}
                  </div>
                </div>
              </div>
              {issueTypeDetail?.is_default && (
                <div className="flex-shrink-0 py-0.5 px-2 text-caption-sm-medium rounded-sm text-accent-primary bg-transparent border border-accent-strong cursor-default">
                  {t("common.default")}
                </div>
              )}
              <div className="flex-shrink-0 flex">
                <IssueTypeQuickActions
                  issueTypeId={issueTypeId}
                  getWorkItemTypeById={getWorkItemTypeById}
                  onEditIssueTypeIdChange={onEditIssueTypeIdChange}
                  onDeleteIssueTypeIdChange={onDeleteIssueTypeIdChange}
                  onEnableDisableIssueType={onEnableDisableIssueType}
                />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2">
              <IssuePropertiesRoot
                issueTypeId={issueTypeId}
                propertiesLoader={propertiesLoader}
                getWorkItemTypeById={getWorkItemTypeById}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
});
