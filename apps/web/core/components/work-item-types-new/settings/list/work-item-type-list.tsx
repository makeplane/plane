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
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
// local imports
import type { LinkedPropertyData } from "../linked-properties";
import { WorkItemTypeListItem } from "./work-item-type-list-item";
import type { WorkItemTypeListActions } from "./types";

type WorkItemTypeListProps = {
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
  availableProperties: LinkedPropertyData[];
  getLinkedProperties: (propertyIds: string[]) => LinkedPropertyData[];
  actions: WorkItemTypeListActions;
};

export const WorkItemTypeList = observer(function WorkItemTypeList(props: WorkItemTypeListProps) {
  const { workItemTypes, availableProperties, getLinkedProperties, actions } = props;

  return (
    <div className="w-full space-y-4">
      {workItemTypes.map((workItemType) => (
        <WorkItemTypeListItem
          key={workItemType.id}
          workItemType={workItemType}
          availableProperties={availableProperties}
          getLinkedProperties={getLinkedProperties}
          actions={{
            edit: () => actions.edit(workItemType.id),
            delete: () => actions.delete(workItemType.id),
            setDefault: () => actions.setDefault(workItemType.id),
          }}
        />
      ))}
    </div>
  );
});
