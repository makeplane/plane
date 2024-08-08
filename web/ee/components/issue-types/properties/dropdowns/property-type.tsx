// ui
import { CustomSearchSelect } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web constants
import { ISSUE_PROPERTY_TYPE_DETAILS } from "@/plane-web/constants/issue-properties";
// plane web helpers
import { getIssuePropertyTypeDisplayName, getIssuePropertyTypeKey } from "@/plane-web/helpers/issue-properties.helper";
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
  propertyRelationType: EIssuePropertyRelationType | undefined;
  currentOperationMode: TOperationMode | null;
  handlePropertyObjectChange: (value: Partial<TIssueProperty<EIssuePropertyType>>) => void;
  error?: string;
};

export const PropertyTypeDropdown = (props: TPropertyTypeDropdownProps) => {
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

  return isEditingAllowed ? (
    <CustomSearchSelect
      value={getIssuePropertyTypeKey(propertyType, propertyRelationType)}
      label={propertyType ? getIssuePropertyTypeDisplayName(propertyType, propertyRelationType) : "Select type"}
      options={issuePropertyTypeOptions}
      onChange={onPropertyTypeChange}
      optionsClassName="w-48"
      buttonClassName={cn(
        "rounded text-sm bg-custom-background-100 border-[0.5px] border-custom-border-300",
        Boolean(error) && "border-red-500"
      )}
    />
  ) : (
    <span className="px-2">{getIssuePropertyTypeDisplayName(propertyType, propertyRelationType)}</span>
  );
};
