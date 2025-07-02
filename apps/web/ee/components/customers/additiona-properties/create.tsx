"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { CustomerPropertyValueService } from "@plane/services";
import { getPropertiesDefaultValues } from "@plane/utils";
// plane web hooks
import { useCustomerModal } from "@/plane-web/hooks/context/use-customer-modal";
import { useCustomerProperties } from "@/plane-web/hooks/store";
// local components
import { CustomerAdditionalPropertyValues } from "./root";

type TCustomerAdditionalPropertyValuesCreateProps = {
  workspaceSlug: string;
  customerId: string | undefined;
};

const customerPropertyValueService = new CustomerPropertyValueService();

export const CustomerAdditionalPropertyValuesCreate: React.FC<TCustomerAdditionalPropertyValuesCreateProps> = observer(
  (props) => {
    const { workspaceSlug, customerId } = props;
    // states
    const [customerPropertyValues, setCustomerPropertyValues] = React.useState({});
    // store hooks
    const {
      customerPropertyValues: customerPropertyDefaultValues,
      customerPropertyValueErrors,
      setCustomerPropertyValues: handleCustomerPropertyValueUpdate,
    } = useCustomerModal();
    const { activeProperties } = useCustomerProperties();
    // fetch customer property values
    const { data, isLoading } = useSWR(
      workspaceSlug && customerId ? `CUSTOMER_PROPERTY_VALUES_${workspaceSlug}` : null,
      () => (workspaceSlug && customerId ? customerPropertyValueService.list(workspaceSlug, customerId) : null),
      {}
    );

    useEffect(() => {
      if (data) setCustomerPropertyValues(data);
    }, [data]);

    useEffect(() => {
      if (activeProperties?.length) {
        handleCustomerPropertyValueUpdate({
          ...getPropertiesDefaultValues(activeProperties),
          ...customerPropertyValues,
        });
      }
    }, [activeProperties, handleCustomerPropertyValueUpdate, customerPropertyValues]);

    const handlePropertyValueChange = (propertyId: string, value: string[]) => {
      handleCustomerPropertyValueUpdate((prev) => ({
        ...prev,
        [propertyId]: value,
      }));
    };

    if (!activeProperties?.length) return null;

    return (
      <CustomerAdditionalPropertyValues
        customerPropertyValues={customerPropertyDefaultValues}
        customerPropertyValueErrors={customerPropertyValueErrors}
        variant="create"
        isPropertyValuesLoading={isLoading}
        handlePropertyValueChange={handlePropertyValueChange}
      />
    );
  }
);
