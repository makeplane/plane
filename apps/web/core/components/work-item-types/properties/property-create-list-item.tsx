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

import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EIssuePropertyType, TIssueProperty, TIssuePropertyTypeKeys } from "@plane/types";
// local imports
import { IssuePropertyListItem } from "./property-list-item";
import type { TCustomPropertyOperations, TPropertyValidator } from "./property-list-item";
import type { TIssuePropertyCreateList } from "./root";

export type TIssuePropertyCreateListItem = {
  issuePropertyCreateListData?: TIssuePropertyCreateList;
  customPropertyOperations: TCustomPropertyOperations;
  isUpdateAllowed: boolean;
  allProperties?: TIssueProperty<EIssuePropertyType>[];
  propertyValidator?: TPropertyValidator;
  allowedPropertyTypes?: TIssuePropertyTypeKeys[];
};

export const IssuePropertyCreateListItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateListItem>(function IssuePropertyCreateListItem(
    props: TIssuePropertyCreateListItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const {
      issuePropertyCreateListData,
      customPropertyOperations,
      isUpdateAllowed,
      allProperties,
      propertyValidator,
      allowedPropertyTypes,
    } = props;

    return (
      <div ref={ref}>
        <IssuePropertyListItem
          issuePropertyCreateListData={issuePropertyCreateListData}
          operationMode="create"
          customPropertyOperations={customPropertyOperations}
          isUpdateAllowed={isUpdateAllowed}
          allProperties={allProperties}
          propertyValidator={propertyValidator}
          allowedPropertyTypes={allowedPropertyTypes}
        />
      </div>
    );
  })
);
