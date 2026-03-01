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

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// ui
import { CustomerPropertyValueService } from "@plane/services";
import type { TIssuePropertyValues } from "@plane/types";
import { Loader } from "@plane/ui";
// plane web hooks
import { useCustomerProperties } from "@/plane-web/hooks/store";
import { CustomerAdditionalPropertyValues } from "./root";

type TCustomerAdditionalPropertyValuesUpdateProps = {
  customerId: string;
  workspaceSlug: string;
  isDisabled: boolean;
};

const customerPropertyValuesService = new CustomerPropertyValueService();

export const CustomerAdditionalPropertyValuesUpdate = observer(function CustomerAdditionalPropertyValuesUpdate(
  props: TCustomerAdditionalPropertyValuesUpdateProps
) {
  const { workspaceSlug, isDisabled, customerId } = props;
  // states
  const [issuePropertyValues, setIssuePropertyValues] = React.useState<TIssuePropertyValues>({});
  // store hooks
  const { loader: propertiesLoader, fetchAllCustomerPropertiesAndOptions, activeProperties } = useCustomerProperties();
  // fetch methods
  async function fetchCustomerPropertyValues() {
    // This is required when accessing the peek overview from workspace level.
    await fetchAllCustomerPropertiesAndOptions(workspaceSlug);
    return customerPropertyValuesService.list(workspaceSlug, customerId);
  }
  // fetch issue property values
  const { data, isLoading } = useSWR(
    workspaceSlug ? `ISSUE_PROPERTY_VALUES_${workspaceSlug}` : null,
    () => (workspaceSlug ? fetchCustomerPropertyValues() : null),
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data) setIssuePropertyValues(data);
  }, [data]);

  const handlePropertyValueChange = async (propertyId: string, value: string[]) => {
    const beforeUpdateValue = issuePropertyValues[propertyId];
    setIssuePropertyValues((prev) => ({
      ...prev,
      [propertyId]: value,
    }));
    // update the property value
    await customerPropertyValuesService.update(workspaceSlug, customerId, propertyId, value).catch((error) => {
      // revert the value if update fails
      setIssuePropertyValues((prev) => ({
        ...prev,
        [propertyId]: beforeUpdateValue,
      }));
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error ?? "Property could not be update. Please try again.",
      });
    });
  };

  if (propertiesLoader) {
    return (
      <Loader className="space-y-4 py-4">
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
      </Loader>
    );
  }

  // if issue type details or active properties are not available, return null
  if (!activeProperties?.length) return null;

  return (
    <CustomerAdditionalPropertyValues
      customerPropertyValues={issuePropertyValues}
      variant="update"
      isPropertyValuesLoading={isLoading}
      handlePropertyValueChange={handlePropertyValueChange}
      isDisabled={isDisabled}
    />
  );
});
