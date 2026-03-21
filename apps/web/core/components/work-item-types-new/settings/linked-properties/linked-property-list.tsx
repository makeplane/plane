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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { Sortable } from "@plane/ui";
import { calculateSortOrder } from "@plane/utils";
// local imports
import { LinkedPropertyListItem } from "./linked-property-list-item";
import type { LinkedPropertyData, LinkedPropertyActions, LinkedPropertyPermissions } from "./types";

type LinkedPropertyListActions = Omit<LinkedPropertyActions, "unlink"> & {
  unlink: (propertyId: string) => void;
};

type LinkedPropertyListProps = {
  id: string;
  linkedProperties: LinkedPropertyData[];
  actions: LinkedPropertyListActions;
  permissions: LinkedPropertyPermissions;
};

export const LinkedPropertyList = observer(function LinkedPropertyList(props: LinkedPropertyListProps) {
  const { id, linkedProperties, actions, permissions } = props;

  const handleReorder = useCallback(
    (reorderedData: LinkedPropertyData[], movedItem?: LinkedPropertyData) => {
      if (!movedItem) return;
      const newSortOrder = calculateSortOrder(
        reorderedData.map((p) => ({ id: p.id, sort_order: p.sort_order })),
        movedItem.id
      );
      if (newSortOrder !== undefined) {
        actions.reorder(movedItem.id, newSortOrder);
      }
    },
    [actions]
  );

  if (linkedProperties.length === 0) return null;

  return (
    <div className="space-y-2">
      {permissions.canReorder ? (
        <Sortable
          data={linkedProperties}
          render={(property) => (
            <LinkedPropertyListItem
              key={property.id}
              property={property}
              canUnlink={permissions.canUnlink}
              canReorder={permissions.canReorder}
              onUnlink={() => actions.unlink(property.id)}
            />
          )}
          onChange={handleReorder}
          keyExtractor={(item) => item.id}
          id={`linked-properties-${id}`}
        />
      ) : (
        linkedProperties.map((property) => (
          <LinkedPropertyListItem
            key={property.id}
            property={property}
            canUnlink={permissions.canUnlink}
            canReorder={false}
            onUnlink={() => actions.unlink(property.id)}
          />
        ))
      )}
    </div>
  );
});
