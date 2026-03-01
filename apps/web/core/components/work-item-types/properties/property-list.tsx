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
import { useCallback } from "react";
// plane imports
import type { EIssuePropertyType, IIssueProperty } from "@plane/types";
import { calculateSortOrder } from "@plane/utils";
// plane web imports
import { WorkItemPropertyOptionsProvider } from "@/lib/context/work-item-property-option";
// local imports
import { IssuePropertyCreateListItem } from "./property-create-list-item";
import { IssuePropertyListItem } from "./property-list-item";
import type { TCustomPropertyOperations } from "./property-list-item";
import type { TIssuePropertyCreateList } from "./root";
import { Sortable } from "@plane/ui";

type TIssuePropertyList = {
  properties: IIssueProperty<EIssuePropertyType>[] | undefined;
  issuePropertyCreateList: TIssuePropertyCreateList[];
  customPropertyOperations: TCustomPropertyOperations;
  containerRef: React.RefObject<HTMLDivElement>;
  lastElementRef: React.RefObject<HTMLDivElement>;
  isUpdateAllowed: boolean;
};

export const IssuePropertyList = observer(function IssuePropertyList(props: TIssuePropertyList) {
  const {
    properties,
    issuePropertyCreateList,
    customPropertyOperations,
    containerRef,
    lastElementRef,
    isUpdateAllowed,
  } = props;

  const handlePropertiesReorder = useCallback(
    async (
      data: IIssueProperty<EIssuePropertyType>[],
      movedProperty: IIssueProperty<EIssuePropertyType> | undefined
    ) => {
      if (!movedProperty?.id) return;
      const sortedData = data
        .map((property) => {
          if (!property.id || property.sort_order === undefined) return;
          return {
            id: property.id,
            sort_order: property.sort_order,
          };
        })
        .filter((e) => e !== undefined);

      const updatedSortOrder = calculateSortOrder(sortedData, movedProperty.id);

      if (updatedSortOrder) {
        await customPropertyOperations.updateProperty(movedProperty.id, { sort_order: updatedSortOrder });
      }
    },
    [customPropertyOperations]
  );

  return (
    <div className="w-full mt-1">
      <div ref={containerRef} className="w-full overflow-y-auto px-6 transition-all">
        {properties && (
          <Sortable
            data={properties}
            render={(property) => (
              <WorkItemPropertyOptionsProvider
                key={property.id}
                customPropertyId={property.id}
                customPropertyOperations={customPropertyOperations}
              >
                <IssuePropertyListItem
                  customPropertyId={property.id}
                  customPropertyOperations={customPropertyOperations}
                  isUpdateAllowed={isUpdateAllowed}
                />
              </WorkItemPropertyOptionsProvider>
            )}
            onChange={(data, movedItem) => {
              handlePropertiesReorder(data, movedItem).catch((error) => {
                console.error(error);
              });
            }}
            keyExtractor={(option, index) => option.id?.toString() ?? index.toString()}
          />
        )}
        {/* Issue properties create list */}
        {issuePropertyCreateList.map((issueProperty, index) => (
          <WorkItemPropertyOptionsProvider
            key={issueProperty.key}
            customPropertyId={issueProperty.id}
            customPropertyOperations={customPropertyOperations}
          >
            <IssuePropertyCreateListItem
              ref={index === issuePropertyCreateList.length - 1 ? lastElementRef : undefined}
              issuePropertyCreateListData={issueProperty}
              customPropertyOperations={customPropertyOperations}
              isUpdateAllowed
            />
          </WorkItemPropertyOptionsProvider>
        ))}
      </div>
    </div>
  );
});
