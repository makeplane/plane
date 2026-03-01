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

import React, { useState } from "react";
import { observer } from "mobx-react";
import { mutate } from "swr";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// plane imports
import { CustomerPropertyValueService } from "@plane/services";
import type { TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";
import { getPropertiesDefaultValues } from "@plane/utils";
// plane web hooks
import type { TCreateUpdatePropertyValuesProps } from "@/components/customers";
import { CustomerModalContext } from "@/components/customers";
import { useCustomerProperties } from "@/plane-web/hooks/store";

type TCustomerModalProviderProps = {
  children: React.ReactNode;
};

const customerPropertiesValueService = new CustomerPropertyValueService();

export const CustomerModalProvider = observer(function CustomerModalProvider(props: TCustomerModalProviderProps) {
  const { children } = props;
  // states
  const [customerPropertyValues, setCustomerPropertyValues] = useState<TIssuePropertyValues>({});
  const [customerPropertyValueErrors, setCustomerPropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // plane web hooks
  const { activeProperties } = useCustomerProperties();

  // handlers
  const handlePropertyValuesValidation = () => {
    // filter all active & required propertyIds
    const activeRequiredPropertyIds = activeProperties
      ?.filter((property) => property.is_required)
      .map((property) => property.id);
    // filter missing required property based on property values
    const missingRequiredPropertyIds = activeRequiredPropertyIds?.filter(
      (propertyId) =>
        propertyId &&
        (!customerPropertyValues[propertyId] ||
          !customerPropertyValues[propertyId].length ||
          customerPropertyValues[propertyId][0].trim() === "")
    );
    // set error state
    setCustomerPropertyValueErrors(
      missingRequiredPropertyIds?.reduce((acc, propertyId) => {
        if (propertyId) acc[propertyId] = "REQUIRED";
        return acc;
      }, {} as TIssuePropertyValueErrors)
    );
    // return true if no missing required properties values
    return missingRequiredPropertyIds.length === 0;
  };

  const handleCreateUpdatePropertyValues = async (props: TCreateUpdatePropertyValuesProps) => {
    const { workspaceSlug, customerId } = props;
    // check if customer property values are empty
    if (Object.keys(customerPropertyValues).length === 0) return;
    const filteredCustomerPropertyValues = Object.keys(customerPropertyValues).reduce((acc, propertyId) => {
      if (activeProperties?.find((property) => property.id === propertyId)) {
        acc[propertyId] = customerPropertyValues[propertyId];
      }
      return acc;
    }, {} as TIssuePropertyValues);
    // create customer property values
    await customerPropertiesValueService
      .create(workspaceSlug, customerId, filteredCustomerPropertyValues)
      .then(() => {
        // mutate customer property values
        mutate(`CUSTOMER_PROPERTY_VALUES_${workspaceSlug}`);
        // reset customer property values
        setCustomerPropertyValues({
          ...getPropertiesDefaultValues(activeProperties ?? []),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Custom properties could not be created. Please try again.",
        });
      });
  };

  return (
    <CustomerModalContext.Provider
      value={{
        customerPropertyValues,
        setCustomerPropertyValues,
        customerPropertyValueErrors,
        setCustomerPropertyValueErrors,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
      }}
    >
      {children}
    </CustomerModalContext.Provider>
  );
});
