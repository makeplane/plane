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
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";
// local imports
import type { LinkedPropertyData } from "../linked-properties";
import { WorkItemTypeList } from "./work-item-type-list";
import type { WorkItemTypeListActions } from "./types";

type WorkItemTypeListRootProps = {
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
  availableProperties: LinkedPropertyData[];
  getLinkedProperties: (propertyIds: string[]) => LinkedPropertyData[];
  isInitializing: boolean;
  actions: WorkItemTypeListActions;
};

export const WorkItemTypeListRoot = observer(function WorkItemTypeListRoot(props: WorkItemTypeListRootProps) {
  const { workItemTypes, availableProperties, getLinkedProperties, isInitializing, actions } = props;
  // derived values
  const hasWorkItemTypes = workItemTypes && workItemTypes.length > 0;

  if (isInitializing) {
    return (
      <Loader className="w-full space-y-4 py-4">
        <Loader.Item height="68px" width="100%" />
        <Loader.Item height="68px" width="100%" />
        <Loader.Item height="68px" width="100%" />
      </Loader>
    );
  }

  if (hasWorkItemTypes) {
    return (
      <WorkItemTypeList
        workItemTypes={workItemTypes}
        availableProperties={availableProperties}
        getLinkedProperties={getLinkedProperties}
        actions={actions}
      />
    );
  }

  if (!hasWorkItemTypes && !isInitializing) {
    return (
      <div className="w-full py-6 px-2 border border-subtle rounded-lg">
        <EmptyStateCompact
          assetKey="work-item"
          title="No work item types added"
          description="Define work item types to categorize and organize your work."
        />
      </div>
    );
  }
});
