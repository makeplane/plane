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
// plane web components
import type { TIssuePropertyValueErrors, TIssuePropertyValues, TPropertyValueVariant } from "@plane/types";
import { cn } from "@plane/utils";
import { PropertyValueSelect } from "@/components/customers";
// plane web hooks
import { useCustomerProperties } from "@/plane-web/hooks/store";

type TIssueAdditionalPropertyValuesProps = {
  customerPropertyValues: TIssuePropertyValues;
  customerPropertyValueErrors?: TIssuePropertyValueErrors;
  variant: TPropertyValueVariant;
  isDisabled?: boolean;
  isPropertyValuesLoading?: boolean;
  handlePropertyValueChange: (propertyId: string, value: string[]) => void;
};

export const CustomerAdditionalPropertyValues = observer(function CustomerAdditionalPropertyValues(
  props: TIssueAdditionalPropertyValuesProps
) {
  const {
    customerPropertyValues,
    customerPropertyValueErrors,
    variant,
    isPropertyValuesLoading = false,
    handlePropertyValueChange,
    isDisabled = false,
  } = props;
  const { activeProperties, getPropertyById } = useCustomerProperties();

  if (!activeProperties?.length) return null;

  const onPropertyValueChange = async (propertyId: string | undefined, value: string[]) => {
    if (!propertyId) return;
    handlePropertyValueChange(propertyId, value);
  };

  const getPropertyInstanceById = (customPropertyId: string) => getPropertyById(customPropertyId);

  return (
    <div className={cn(variant === "update" ? "space-y-2" : "grid gap-3 grid-cols-2")}>
      {activeProperties.map(
        (property) =>
          property?.id && (
            <div key={property.id}>
              <PropertyValueSelect
                propertyDetail={property}
                propertyValue={customerPropertyValues[property.id] ?? []}
                propertyValueError={customerPropertyValueErrors?.[property.id] ?? undefined}
                variant={variant}
                isPropertyValuesLoading={isPropertyValuesLoading}
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
