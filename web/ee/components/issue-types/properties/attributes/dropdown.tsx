import { observer } from "mobx-react";
// plane web components
import { OptionValueSelect } from "@/plane-web/components/issue-types";
import {
  DefaultOptionCreateSelect,
  IssuePropertyOptionsRoot,
  PropertyMultiSelect,
  PropertySettingsConfiguration,
} from "@/plane-web/components/issue-types/properties";
// plane web constants
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@/plane-web/constants/issue-properties";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import {
  EIssuePropertyType,
  TCreationListModes,
  TIssueProperty,
  TOperationMode,
  TIssuePropertyOptionCreateList,
} from "@/plane-web/types";

type TDropdownAttributesProps = {
  issueTypeId: string;
  dropdownPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.OPTION>>;
  currentOperationMode: TOperationMode;
  issuePropertyOptionCreateList: TIssuePropertyOptionCreateList[];
  onDropdownDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.OPTION>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.OPTION>[K],
    shouldSync?: boolean
  ) => void;
  handleIssuePropertyOptionCreateList: (mode: TCreationListModes, value: TIssuePropertyOptionCreateList) => void;
};

export const DropdownAttributes = observer((props: TDropdownAttributesProps) => {
  const {
    issueTypeId,
    dropdownPropertyDetail,
    currentOperationMode,
    issuePropertyOptionCreateList,
    onDropdownDetailChange,
    handleIssuePropertyOptionCreateList,
  } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const isAnyIssueAttached = issueType?.issue_exists;
  const isOptionDefaultDisabled = dropdownPropertyDetail.is_multi === undefined || !!dropdownPropertyDetail.is_required;

  return (
    <>
      <div className="px-1">
        <PropertyMultiSelect
          value={dropdownPropertyDetail.is_multi}
          variant="OPTION"
          onChange={(value) => {
            onDropdownDetailChange("is_multi", value);
            if (!value) {
              onDropdownDetailChange(
                "default_value",
                dropdownPropertyDetail.default_value?.[0] ? [dropdownPropertyDetail.default_value?.[0]] : []
              );
            }
          }}
          isDisabled={currentOperationMode === "update" && isAnyIssueAttached}
        />
      </div>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.OPTION?.length && (
        <div className="pt-4">
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.OPTION?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={dropdownPropertyDetail.settings}
              settingsConfigurations={configurations}
              onChange={(value) =>
                onDropdownDetailChange("settings", value as TIssueProperty<EIssuePropertyType.OPTION>["settings"])
              }
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && isAnyIssueAttached}
            />
          ))}
        </div>
      )}
      <IssuePropertyOptionsRoot
        issueTypeId={issueTypeId}
        issuePropertyId={dropdownPropertyDetail.id}
        issuePropertyOptionCreateList={issuePropertyOptionCreateList}
        handleIssuePropertyOptionCreateList={handleIssuePropertyOptionCreateList}
      />
      <div className="pt-2 px-1">
        <div className="text-xs font-medium text-custom-text-300">Default • Optional</div>
        {dropdownPropertyDetail.id ? (
          <OptionValueSelect
            propertyDetail={dropdownPropertyDetail}
            value={dropdownPropertyDetail.default_value ?? []}
            issueTypeId={issueTypeId}
            issuePropertyId={dropdownPropertyDetail.id}
            variant="create"
            isMultiSelect={dropdownPropertyDetail.is_multi}
            isDisabled={isOptionDefaultDisabled}
            onOptionValueChange={async (value) => onDropdownDetailChange("default_value", value)}
          />
        ) : (
          <DefaultOptionCreateSelect
            isMultiSelect={dropdownPropertyDetail.is_multi}
            issuePropertyOptionCreateList={issuePropertyOptionCreateList}
            handleOptionListUpdate={(value) => handleIssuePropertyOptionCreateList("update", value)}
            isDisabled={isOptionDefaultDisabled}
          />
        )}
      </div>
    </>
  );
});
