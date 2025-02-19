import React from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssuePropertyValueErrors, TIssuePropertyValues, TPropertyValueVariant } from "@plane/types";
import { PropertyValueSelect } from "@/plane-web/components/issue-types/values";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane imports

type TIssueAdditionalPropertyValuesProps = {
  issueTypeId: string;
  issuePropertyValues: TIssuePropertyValues;
  issuePropertyValueErrors?: TIssuePropertyValueErrors;
  projectId: string;
  variant: TPropertyValueVariant;
  isDisabled?: boolean;
  isPropertyValuesLoading?: boolean;
  handlePropertyValueChange: (propertyId: string, value: string[]) => void;
};

export const IssueAdditionalPropertyValues: React.FC<TIssueAdditionalPropertyValuesProps> = observer((props) => {
  const {
    issueTypeId,
    issuePropertyValues,
    issuePropertyValueErrors,
    projectId,
    variant,
    isPropertyValuesLoading = false,
    handlePropertyValueChange,
    isDisabled = false,
  } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
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
