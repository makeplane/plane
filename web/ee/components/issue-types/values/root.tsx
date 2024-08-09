import React from "react";
import { observer } from "mobx-react";
// plane web components
import { PropertyValueSelect } from "@/plane-web/components/issue-types/values";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import {
  EIssuePropertyType,
  TIssuePropertyValueErrors,
  TIssuePropertyValues,
  TPropertyValueVariant,
} from "@/plane-web/types";

type TIssueAdditionalPropertyValuesProps = {
  issueTypeId: string;
  issuePropertyValues: TIssuePropertyValues;
  issuePropertyValueErrors?: TIssuePropertyValueErrors;
  projectId: string;
  variant: TPropertyValueVariant;
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

  // sort all multi-line text properties to the top in create mode and to the bottom in update mode
  sortedProperties.sort((a, b) => {
    const isAMultiLineText = a.property_type === EIssuePropertyType.TEXT && a.settings?.display_format === "multi-line";
    const isBMultiLineText = b.property_type === EIssuePropertyType.TEXT && b.settings?.display_format === "multi-line";
    if (variant === "create") {
      // Sort multi-line text properties to the top in create mode
      if (isAMultiLineText && !isBMultiLineText) {
        return -1;
      }
      if (!isAMultiLineText && isBMultiLineText) {
        return 1;
      }
    } else if (variant === "update") {
      // Sort multi-line text properties to the bottom in update mode
      if (isAMultiLineText && !isBMultiLineText) {
        return 1;
      }
      if (!isAMultiLineText && isBMultiLineText) {
        return -1;
      }
    }
    return 0; // No sorting preference
  });

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
                onPropertyValueChange={async (value) => onPropertyValueChange(property.id, value)}
              />
            </div>
          )
      )}
    </div>
  );
});
