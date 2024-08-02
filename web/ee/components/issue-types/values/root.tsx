import React from "react";
import { observer } from "mobx-react";
// plane web components
import { PropertyValueSelect } from "@/plane-web/components/issue-types/values";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssuePropertyValues, TPropertyValueVariant } from "@/plane-web/types";

type TIssueAdditionalPropertyValuesProps = {
  issueTypeId: string;
  issuePropertyValues: TIssuePropertyValues;
  projectId: string;
  variant: TPropertyValueVariant;
  isPropertyValuesLoading?: boolean;
  handlePropertyValueChange: (propertyId: string, value: string[]) => void;
};

export const IssueAdditionalPropertyValues: React.FC<TIssueAdditionalPropertyValuesProps> = observer((props) => {
  const {
    issueTypeId,
    issuePropertyValues,
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

  // Sort all multi-line text properties to the top
  if (variant === "create") {
    sortedProperties.sort((a, b) => {
      // Check if `a` should come before `b`
      if (a.property_type === EIssuePropertyType.TEXT && a.settings?.display_format === "multi-line") {
        if (b.property_type !== EIssuePropertyType.TEXT || b.settings?.display_format !== "multi-line") {
          return -1;
        }
      }
      // Check if `b` should come before `a`
      if (b.property_type === EIssuePropertyType.TEXT && b.settings?.display_format === "multi-line") {
        if (a.property_type !== EIssuePropertyType.TEXT || a.settings?.display_format !== "multi-line") {
          return 1;
        }
      }
      return 0; // No sorting preference
    });
  }

  return (
    <div className="flex flex-col space-y-2">
      {sortedProperties.map(
        (property) =>
          property?.id && (
            <div key={property.id}>
              <PropertyValueSelect
                propertyDetail={property}
                propertyValue={issuePropertyValues[property.id] ?? []}
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
