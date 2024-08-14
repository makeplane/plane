import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane web components
import {
  MemberValueSelect,
  PropertyMultiSelect,
  PropertySettingsConfiguration,
} from "@/plane-web/components/issue-types";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode } from "@/plane-web/types";

type TMemberPickerAttributesProps = {
  issueTypeId: string;
  memberPickerPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.RELATION>>;
  currentOperationMode: TOperationMode;
  onMemberPickerDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.RELATION>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.RELATION>[K],
    shouldSync?: boolean
  ) => void;
};

export const MemberPickerAttributes = observer((props: TMemberPickerAttributesProps) => {
  const { issueTypeId, memberPickerPropertyDetail, currentOperationMode, onMemberPickerDetailChange } = props;
  // router
  const { projectId } = useParams();
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;
  const isMemberDropdownDisabled =
    memberPickerPropertyDetail.is_multi === undefined || !!memberPickerPropertyDetail.is_required;

  return (
    <>
      <div className="px-1">
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
          isDisabled={currentOperationMode === "update" && isAnyIssueAttached}
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
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
            />
          ))}
        </div>
      )}
      <div className="pt-4">
        <div className="text-xs font-medium text-custom-text-300">Default • Optional</div>
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
