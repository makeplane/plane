import React from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssuePropertyValueErrors, TIssuePropertyValues, TPropertyValueVariant } from "@plane/types";
import { cn } from "@plane/utils";
import { PropertyValueSelect } from "@/plane-web/components/customers";
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

export const CustomerAdditionalPropertyValues: React.FC<TIssueAdditionalPropertyValuesProps> = observer((props) => {
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
