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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { Switch } from "@plane/propel/switch";
import { Badge } from "@plane/propel/badge";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { IssueTypeLogo } from "../common/issue-type-logo";
import { LinkedPropertiesRoot } from "../linked-properties";
import type { LinkedPropertyData } from "../linked-properties";
import { WorkItemTypeQuickActions } from "./quick-actions";

type WorkItemTypeItemActions = {
  edit: () => void;
  delete: () => Promise<void>;
  setDefault: () => Promise<void>;
};

type WorkItemTypeListItemProps = {
  workItemType: BaseWorkItemTypeInstanceSchema;
  availableProperties: LinkedPropertyData[];
  getLinkedProperties: (propertyIds: string[]) => LinkedPropertyData[];
  actions: WorkItemTypeItemActions;
};

export const WorkItemTypeListItem = observer(function WorkItemTypeListItem(props: WorkItemTypeListItemProps) {
  const { workItemType, availableProperties, getLinkedProperties, actions } = props;
  // state
  const [isOpen, setIsOpen] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const isWorkItemTypeHierarchyFlagAvailable = useFlag(workspaceSlug, "WORKITEM_TYPE_HIERARCHY", false);
  const isWorkItemHierarchyFeatureEnabled =
    workspaceSlug && isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_WORK_ITEM_HIERARCHY_ENABLED);
  // derived values
  const workItemTypeDetail = workItemType.asJSON;
  const linkedProperties = getLinkedProperties(workItemType.linkedPropertyIds).map((property) => ({
    ...property,
    sort_order: workItemType.properties?.[property.id] ?? 0,
  }));
  // handlers
  const handleEnableDisable = async (isActive: boolean) => {
    workItemType.updateType({ is_active: isActive }).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("work_item_types.enable_disable.toast.error.title"),
        message: t("work_item_types.enable_disable.toast.error.message"),
      });
    });
  };

  if (!workItemTypeDetail) return null;
  return (
    <div
      className={cn("group/work-item-type rounded-lg bg-layer-2 hover:bg-layer-2-hover border border-subtle", {
        "bg-layer-2-active": isOpen,
      })}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="p-2">
        <CollapsibleTrigger className="flex w-full p-1 gap-2 items-center justify-between">
          <div className="flex w-full gap-2 items-center truncate">
            <div className="shrink-0">
              <ChevronRightIcon
                className={cn("shrink-0 size-4", {
                  "rotate-90 text-primary": isOpen,
                  "text-tertiary": !isOpen,
                })}
              />
            </div>
            <IssueTypeLogo
              icon_props={workItemTypeDetail?.logo_props?.icon}
              size="xl"
              containerClassName={cn(!workItemTypeDetail?.is_active && "opacity-60")}
            />
            <div className="flex flex-col items-start justify-start whitespace-normal">
              <div className="flex gap-4 text-left items-center">
                <div className="text-body-sm-medium text-primary line-clamp-1">{workItemTypeDetail?.name}</div>
                {workItemTypeDetail?.is_global && (
                  <div className="py-0.5 px-2 text-caption-sm-medium rounded-sm text-accent-primary bg-transparent border border-accent-strong cursor-default">
                    {t("common.global")}
                  </div>
                )}
                {!workItemTypeDetail?.is_active && (
                  <div className="py-0.5 px-3 text-caption-sm-medium rounded-sm text-tertiary bg-layer-2">
                    {t("common.disabled")}
                  </div>
                )}
              </div>
              {workItemTypeDetail?.description && (
                <div className="text-body-xs-regular text-tertiary text-left line-clamp-1">
                  {workItemTypeDetail.description}
                </div>
              )}
            </div>
          </div>
          {workItemTypeDetail?.is_default && (
            <div className="shrink-0 py-0.5 px-2 text-caption-sm-medium rounded-sm text-accent-primary bg-transparent border border-accent-strong cursor-default">
              {t("common.default")}
            </div>
          )}
          {isWorkItemTypeHierarchyFlagAvailable && isWorkItemHierarchyFeatureEnabled && (
            <span className="shrink-0">
              <Badge size="sm" variant="neutral">
                Level {workItemTypeDetail?.level}
              </Badge>
            </span>
          )}
          <div className="shrink-0 flex items-center gap-2">
            {!workItemTypeDetail?.is_default && workItemType.canEnableDisable && (
              <Switch value={!!workItemTypeDetail?.is_active} onChange={handleEnableDisable} />
            )}
            <WorkItemTypeQuickActions
              isDefault={!!workItemTypeDetail?.is_default}
              isDisabled={!workItemTypeDetail?.is_active}
              onDisable={async () => handleEnableDisable(false)}
              onDelete={actions.delete}
              onEdit={actions.edit}
              onSetDefault={actions.setDefault}
              canEdit={workItemType.canEdit}
              canDelete={workItemType.canDelete}
              canSetAsDefault={workItemType.canSetAsDefault}
              typeName={workItemTypeDetail?.name ?? ""}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-2">
            <LinkedPropertiesRoot
              id={workItemType.id}
              linkedProperties={linkedProperties}
              availableProperties={availableProperties}
              actions={{
                link: (propertyIds) => workItemType.linkProperties(propertyIds),
                unlink: (propertyId) => workItemType.unlinkProperty(propertyId),
                reorder: (propertyId, newSortOrder) => workItemType.reorderProperty(propertyId, newSortOrder),
              }}
              permissions={{
                canLink: workItemType.canLinkProperties,
                canUnlink: workItemType.canUnlinkProperties,
                canReorder: workItemType.canReorderProperties,
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
