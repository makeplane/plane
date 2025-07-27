import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType, TIssueProperty, TIssuePropertyTypeKeys, TOperationMode } from "@plane/types";
import { getIssuePropertyTypeKey } from "@plane/utils";
// plane web components
import {
  BooleanAttributes,
  DatePickerAttributes,
  DropdownAttributes,
  MemberPickerAttributes,
  NumberAttributes,
  TextAttributes,
  TIssuePropertyFormError,
} from "@/plane-web/components/issue-types/properties";

type TSelectedPropertyAttributesProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  disabled?: boolean;
  error?: TIssuePropertyFormError;
  isUpdateAllowed: boolean;
};

export const SelectedAttributeProperties = observer((props: TSelectedPropertyAttributesProps) => {
  const { propertyDetail, currentOperationMode, onPropertyDetailChange, error, isUpdateAllowed } = props;

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, JSX.Element>> = {
    TEXT: (
      <TextAttributes
        textPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.TEXT>>}
        currentOperationMode={currentOperationMode}
        onTextDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    DECIMAL: (
      <NumberAttributes
        numberPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>}
        currentOperationMode={currentOperationMode}
        onNumberDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    OPTION: (
      <DropdownAttributes
        dropdownPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.OPTION>>}
        currentOperationMode={currentOperationMode}
        onDropdownDetailChange={onPropertyDetailChange}
        error={error}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    BOOLEAN: (
      <BooleanAttributes
        booleanPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.BOOLEAN>>}
        currentOperationMode={currentOperationMode}
        onBooleanDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    DATETIME: (
      <DatePickerAttributes
        datePickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DATETIME>>}
        currentOperationMode={currentOperationMode}
        onDatePickerDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    RELATION_USER: (
      <MemberPickerAttributes
        memberPickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.RELATION>>}
        currentOperationMode={currentOperationMode}
        onMemberPickerDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);
  return ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey] || null;
});
