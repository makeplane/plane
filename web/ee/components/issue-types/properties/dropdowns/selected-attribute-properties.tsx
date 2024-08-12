import { observer } from "mobx-react";
// plane web components
import {
  BooleanAttributes,
  DatePickerAttributes,
  DropdownAttributes,
  MemberPickerAttributes,
  NumberAttributes,
  TextAttributes,
} from "@/plane-web/components/issue-types/properties";
// plane web helpers
import { getIssuePropertyTypeKey } from "@/plane-web/helpers/issue-properties.helper";
// plane web types
import { EIssuePropertyType, TIssueProperty, TOperationMode, TIssuePropertyTypeKeys } from "@/plane-web/types";

type TSelectedPropertyAttributesProps = {
  issueTypeId: string;
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  disabled?: boolean;
};

export const SelectedAttributeProperties = observer((props: TSelectedPropertyAttributesProps) => {
  const { issueTypeId, propertyDetail, currentOperationMode, onPropertyDetailChange } = props;

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, JSX.Element>> = {
    TEXT: (
      <TextAttributes
        issueTypeId={issueTypeId}
        textPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.TEXT>>}
        currentOperationMode={currentOperationMode}
        onTextDetailChange={onPropertyDetailChange}
      />
    ),
    DECIMAL: (
      <NumberAttributes
        issueTypeId={issueTypeId}
        numberPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>}
        currentOperationMode={currentOperationMode}
        onNumberDetailChange={onPropertyDetailChange}
      />
    ),
    OPTION: (
      <DropdownAttributes
        issueTypeId={issueTypeId}
        dropdownPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.OPTION>>}
        currentOperationMode={currentOperationMode}
        onDropdownDetailChange={onPropertyDetailChange}
      />
    ),
    BOOLEAN: (
      <BooleanAttributes
        issueTypeId={issueTypeId}
        booleanPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.BOOLEAN>>}
        currentOperationMode={currentOperationMode}
        onBooleanDetailChange={onPropertyDetailChange}
      />
    ),
    DATETIME: (
      <DatePickerAttributes
        issueTypeId={issueTypeId}
        datePickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DATETIME>>}
        currentOperationMode={currentOperationMode}
        onDatePickerDetailChange={onPropertyDetailChange}
      />
    ),
    RELATION_USER: (
      <MemberPickerAttributes
        issueTypeId={issueTypeId}
        memberPickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.RELATION>>}
        currentOperationMode={currentOperationMode}
        onMemberPickerDetailChange={onPropertyDetailChange}
      />
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);
  return ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey] || null;
});
