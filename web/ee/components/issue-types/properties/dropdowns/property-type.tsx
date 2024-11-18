import { observer } from "mobx-react";
// ui
import { CustomSearchSelect } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web constants
import { ISSUE_PROPERTY_TYPE_DETAILS } from "@/plane-web/constants/issue-properties";
// plane web helpers
import { getIssuePropertyTypeDetails, getIssuePropertyTypeKey } from "@/plane-web/helpers/issue-properties.helper";
// plane web types
import { useIssueType } from "@/plane-web/hooks/store";
import {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  TIssueProperty,
  TOperationMode,
  TIssuePropertyTypeKeys,
} from "@/plane-web/types";

type TPropertyTypeDropdownProps = {
  issueTypeId: string;
  propertyType: EIssuePropertyType | undefined;
  propertyRelationType: EIssuePropertyRelationType | null | undefined;
  currentOperationMode: TOperationMode | null;
  handlePropertyObjectChange: (value: Partial<TIssueProperty<EIssuePropertyType>>) => void;
  error?: string;
};

export const PropertyTypeDropdown = observer((props: TPropertyTypeDropdownProps) => {
  const {
    issueTypeId,
    propertyType,
    propertyRelationType,
    currentOperationMode,
    handlePropertyObjectChange,
    error = "",
  } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;
  // derived values
  const isEditingAllowed = currentOperationMode && (currentOperationMode === "create" || !isAnyIssueAttached);
  const propertyTypeDetails = getIssuePropertyTypeDetails(propertyType, propertyRelationType);

  // Can be used with CustomSearchSelect as well
  const issuePropertyTypeOptions = Object.entries(ISSUE_PROPERTY_TYPE_DETAILS).map(([key, property]) => ({
    value: key,
    query: property.displayName,
    content: (
      <div className="flex gap-2 items-center">
        <div className="flex-shrink-0">
          <property.icon className="w-3 h-3 text-custom-text-200" />
        </div>
        <div>{property.displayName}</div>
      </div>
    ),
  }));

  const onPropertyTypeChange = (key: TIssuePropertyTypeKeys) => {
    handlePropertyObjectChange({
      ...ISSUE_PROPERTY_TYPE_DETAILS[key]?.dataToUpdate,
    });
  };

  return (
    <div>
      <span className="text-xs text-custom-text-300 font-medium">Property type</span>
      <CustomSearchSelect
        value={getIssuePropertyTypeKey(propertyType, propertyRelationType)}
        label={
          propertyTypeDetails ? (
            <span className="flex items-center gap-1.5">
              <propertyTypeDetails.icon className="w-3.5 h-3.5" />
              {propertyTypeDetails.displayName}
            </span>
          ) : (
            "Select type"
          )
        }
        options={issuePropertyTypeOptions}
        onChange={onPropertyTypeChange}
        optionsClassName="w-48"
        buttonClassName={cn(
          "rounded text-sm border-[0.5px] bg-custom-background-100 border-custom-border-300",
          Boolean(error) && "border-red-500",
          {
            "bg-custom-background-80": !isEditingAllowed,
          }
        )}
        disabled={!isEditingAllowed}
      />
    </div>
  );
});
