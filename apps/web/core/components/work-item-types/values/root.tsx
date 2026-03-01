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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { IIssueType, TIssuePropertyValueErrors, TIssuePropertyValues, TPropertyValueVariant } from "@plane/types";
// local imports
import { PropertyValueSelect } from "./value-select";

type TWorkItemCustomPropertyValuesProps = {
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  handlePropertyValueChange: (propertyId: string, value: string[]) => void;
  isDisabled?: boolean;
  arePropertyValuesInitializing?: boolean;
  issuePropertyValueErrors?: TIssuePropertyValueErrors;
  issuePropertyValues: TIssuePropertyValues;
  issueTypeId: string;
  projectId: string;
  variant: TPropertyValueVariant;
};

export const WorkItemCustomPropertyValues = observer(function WorkItemCustomPropertyValues(
  props: TWorkItemCustomPropertyValuesProps
) {
  const {
    getWorkItemTypeById,
    handlePropertyValueChange,
    isDisabled = false,
    arePropertyValuesInitializing = false,
    issuePropertyValueErrors,
    issuePropertyValues,
    issueTypeId,
    projectId,
    variant,
  } = props;
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
  const sortedProperties = issueType?.activeProperties;

  if (!sortedProperties?.length) return null;

  const onPropertyValueChange = async (propertyId: string | undefined, value: string[]) => {
    if (!propertyId) return;
    handlePropertyValueChange(propertyId, value);
  };

  const getPropertyInstanceById = (customPropertyId: string) => issueType?.getPropertyById(customPropertyId);

  return (
    <div className="flex flex-col space-y-2">
      {sortedProperties.map(
        (property) =>
          property?.id && (
            <div key={property.id}>
              <PropertyValueSelect
                propertyDetail={property}
                propertyValue={issuePropertyValues[property.id] ?? []}
                propertyValueError={issuePropertyValueErrors?.[property.id] ?? undefined}
                projectId={projectId}
                variant={variant}
                arePropertyValuesInitializing={arePropertyValuesInitializing}
                isDisabled={isDisabled}
                onPropertyValueChange={async (value) => onPropertyValueChange(property.id, value)}
                getPropertyInstanceById={getPropertyInstanceById}
              />
            </div>
          )
      )}
    </div>
  );
});
