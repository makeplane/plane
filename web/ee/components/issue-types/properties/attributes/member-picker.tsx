import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssuePropertyType, ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueProperty, TOperationMode } from "@plane/types";
// plane web components
import {
  MemberValueSelect,
  PropertyMultiSelect,
  PropertySettingsConfiguration,
} from "@/plane-web/components/issue-types";

type TMemberPickerAttributesProps = {
  memberPickerPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.RELATION>>;
  currentOperationMode: TOperationMode;
  onMemberPickerDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.RELATION>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.RELATION>[K],
    shouldSync?: boolean
  ) => void;
  isUpdateAllowed: boolean;
};

export const MemberPickerAttributes = observer((props: TMemberPickerAttributesProps) => {
  const { memberPickerPropertyDetail, currentOperationMode, onMemberPickerDetailChange, isUpdateAllowed } = props;
  // router
  const { projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const isMemberDropdownDisabled =
    memberPickerPropertyDetail.is_multi === undefined || !!memberPickerPropertyDetail.is_required;

  return (
    <>
      <div>
        <span className="text-xs text-custom-text-300 font-medium">
          {t("work_item_types.settings.properties.attributes.label")}
        </span>
        <PropertyMultiSelect
          value={memberPickerPropertyDetail.is_multi}
          variant="RELATION_USER"
          onChange={(value) => {
            onMemberPickerDetailChange("is_multi", value);
            if (!value) {
              onMemberPickerDetailChange(
                "default_value",
                memberPickerPropertyDetail.default_value?.[0] ? [memberPickerPropertyDetail.default_value?.[0]] : []
              );
            }
          }}
          isDisabled={currentOperationMode === "update" && !isUpdateAllowed}
        />
      </div>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.RELATION_USER?.length && (
        <div className="pt-4">
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.RELATION_USER?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={memberPickerPropertyDetail.settings}
              settingsConfigurations={configurations}
              onChange={(value) =>
                onMemberPickerDetailChange("settings", value as TIssueProperty<EIssuePropertyType.RELATION>["settings"])
              }
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
            />
          ))}
        </div>
      )}
      <div>
        <div className="text-xs font-medium text-custom-text-300">
          {t("common.default")} <span className="font-normal italic">({t("common.optional")})</span>
        </div>
        <MemberValueSelect
          propertyDetail={memberPickerPropertyDetail}
          value={memberPickerPropertyDetail.default_value ?? []}
          projectId={projectId?.toString()}
          variant="create"
          isMultiSelect={memberPickerPropertyDetail.is_multi}
          isDisabled={isMemberDropdownDisabled}
          onMemberValueChange={async (value) => onMemberPickerDetailChange("default_value", value)}
        />
      </div>
    </>
  );
});
