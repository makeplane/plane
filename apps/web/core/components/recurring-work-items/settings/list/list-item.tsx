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

import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IIssueType } from "@plane/types";
import { getRecurringWorkItemIntervalTypeLabel } from "@plane/utils";
// plane web imports
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
import type { IRecurringWorkItemInstance } from "@/store/recurring-work-items/instance";
// local imports
import { RecurringWorkItemQuickActions } from "./quick-actions";

type RecurringWorkItemListItemProps = {
  deleteRecurringWorkItem: (id: string) => Promise<void>;
  getRecurringWorkItemById: (id: string) => IRecurringWorkItemInstance | undefined;
  getRecurringWorkItemTypeById: (typeId: string) => IIssueType | undefined;
  projectId: string;
  recurringWorkItemId: string;
  workspaceSlug: string;
};

export const RecurringWorkItemListItem = observer(function RecurringWorkItemListItem(
  props: RecurringWorkItemListItemProps
) {
  const { getRecurringWorkItemById, getRecurringWorkItemTypeById, recurringWorkItemId } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // derived values
  const recurringWorkItem = getRecurringWorkItemById(recurringWorkItemId);
  const recurringWorkItemTypeId = recurringWorkItem?.workitem_blueprint.type.id;
  const recurringWorkItemType = recurringWorkItemTypeId
    ? getRecurringWorkItemTypeById(recurringWorkItemTypeId)
    : undefined;

  if (!recurringWorkItem) return null;
  return (
    <div className="flex items-center justify-between gap-2.5 p-3 border border-subtle rounded-lg bg-layer-1">
      <div className="flex items-center gap-2.5 w-full truncate">
        <IssueTypeLogo
          icon_props={recurringWorkItemType?.logo_props?.icon}
          isDefault={recurringWorkItemType?.is_default}
          isEpic={recurringWorkItemType?.is_epic}
          size="lg"
        />
        <div className="text-body-xs-medium text-primary truncate">{recurringWorkItem.workitem_blueprint.name}</div>
      </div>
      <div className="w-full text-right text-caption-sm-medium text-tertiary">
        repeats every {recurringWorkItem.interval_count > 1 ? `${recurringWorkItem.interval_count} ` : ""}
        {getRecurringWorkItemIntervalTypeLabel(recurringWorkItem.interval_type, recurringWorkItem.interval_count)}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <RecurringWorkItemQuickActions {...props} parentRef={parentRef} />
      </div>
    </div>
  );
});
