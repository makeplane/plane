import { observer } from "mobx-react";
// plane imports
import { ISSUE_PROPERTY_TYPE_DETAILS, EIssuePropertyType, EIssuePropertyRelationType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueProperty, TOperationMode, TIssuePropertyTypeKeys } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { getIssuePropertyTypeDetails, getIssuePropertyTypeKey } from "@plane/utils";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { PropertyTypeIcon } from "@/plane-web/components/issue-types/properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

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
  // plane hooks
  const { t } = useTranslation();
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
    query: t(property.i18n_displayName),
    content: (
      <div className="flex gap-2 items-center">
        <div className="flex-shrink-0">
          <PropertyTypeIcon iconKey={property.iconKey} />
        </div>
        <div>{t(property.i18n_displayName)}</div>
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
      <span className="text-xs text-custom-text-300 font-medium">
        {t("work_item_types.settings.properties.dropdown.label")}
      </span>
      <CustomSearchSelect
        value={getIssuePropertyTypeKey(propertyType, propertyRelationType)}
        label={
          propertyTypeDetails ? (
            <span className="flex items-center gap-1.5">
              <PropertyTypeIcon iconKey={propertyTypeDetails.iconKey} className="size-3.5" />
              {t(propertyTypeDetails.i18n_displayName)}
            </span>
          ) : (
            t("work_item_types.settings.properties.dropdown.placeholder")
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
