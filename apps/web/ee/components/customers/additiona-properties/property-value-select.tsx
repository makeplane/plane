import React from "react";
import { observer } from "mobx-react";
import { InfoIcon } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import {
  EIssuePropertyType,
  EIssuePropertyValueError,
  IIssueProperty,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TIssuePropertyTypeKeys,
  TPropertyValueVariant,
  TTextAttributeDisplayOptions,
} from "@plane/types";
import { Loader } from "@plane/ui";
import { getIssuePropertyTypeKey, cn } from "@plane/utils";
// plane web components
import { BooleanInput } from "@/plane-web/components/issue-types/values/components/boolean-input";
import { DateValueSelect } from "@/plane-web/components/issue-types/values/components/date-select";
import { MemberValueSelect } from "@/plane-web/components/issue-types/values/components/member-select";
import { NumberValueInput } from "@/plane-web/components/issue-types/values/components/number-input";
import { OptionValueSelect } from "@/plane-web/components/issue-types/values/components/option-select";
import { TextValueInput } from "@/plane-web/components/issue-types/values/components/text-input";
import { UrlValueInput } from "@/plane-web/components/issue-types/values/components/url-input";

type TPropertyValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  propertyValue: string[];
  propertyValueError?: EIssuePropertyValueError;
  variant: TPropertyValueVariant;
  isPropertyValuesLoading: boolean;
  isDisabled: boolean;
  onPropertyValueChange: (value: string[]) => Promise<void>;
  getPropertyInstanceById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

export const PropertyValueSelect = observer((props: TPropertyValueSelectProps) => {
  const {
    propertyDetail,
    propertyValue,
    propertyValueError,
    variant,
    isPropertyValuesLoading,
    onPropertyValueChange,
    getPropertyInstanceById,
    isDisabled,
  } = props;

  const CustomerPropertyDetail = () => (
    <>
      <span className={cn("w-full cursor-default truncate", variant === "create" && "text-sm text-custom-text-200")}>
        <span className="flex gap-0.5 items-center">
          <span className="truncate">{propertyDetail?.display_name}</span>
          {propertyDetail?.is_required && <span className="text-red-500">*</span>}
          {propertyDetail.description && (
            <Tooltip
              tooltipContent={propertyDetail?.description}
              position="right"
              disabled={!propertyDetail?.description}
            >
              <InfoIcon className="flex-shrink-0 w-3 h-3 mx-0.5 text-custom-text-300 cursor-pointer" />
            </Tooltip>
          )}
        </span>
      </span>
    </>
  );

  const CUSTOMER_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, React.ReactNode>> = {
    TEXT: (
      <>
        <TextValueInput
          propertyDetail={propertyDetail as TIssueProperty<EIssuePropertyType.TEXT>}
          value={propertyValue}
          error={propertyValueError}
          variant={variant}
          display_format={propertyDetail?.settings?.display_format as TTextAttributeDisplayOptions}
          readOnlyData={propertyDetail?.default_value?.[0]}
          className="min-h-8"
          isDisabled={isDisabled}
          onTextValueChange={onPropertyValueChange}
        />
      </>
    ),
    DECIMAL: (
      <>
        <NumberValueInput
          propertyDetail={propertyDetail as TIssueProperty<EIssuePropertyType.DECIMAL>}
          value={propertyValue}
          error={propertyValueError}
          variant={variant}
          className="h-8"
          isDisabled={isDisabled}
          onNumberValueChange={onPropertyValueChange}
        />
      </>
    ),
    OPTION: (
      <>
        {propertyDetail?.id && (
          <OptionValueSelect
            propertyDetail={propertyDetail as TIssueProperty<EIssuePropertyType.OPTION>}
            value={propertyValue}
            error={propertyValueError}
            customPropertyId={propertyDetail.id}
            getPropertyInstanceById={getPropertyInstanceById}
            variant={variant}
            isMultiSelect={propertyDetail.is_multi}
            buttonClassName="h-8"
            isDisabled={isDisabled}
            onOptionValueChange={onPropertyValueChange}
            showOptionDetails
          />
        )}
      </>
    ),
    BOOLEAN: (
      <div className={cn("w-full h-8 flex items-center", variant === "update" && "px-1.5")}>
        <BooleanInput value={propertyValue} onBooleanValueChange={onPropertyValueChange} isDisabled={isDisabled} />
      </div>
    ),
    DATETIME: (
      <>
        <DateValueSelect
          propertyDetail={propertyDetail as TIssueProperty<EIssuePropertyType.DATETIME>}
          value={propertyValue}
          error={propertyValueError}
          variant={variant}
          displayFormat={propertyDetail?.settings?.display_format as TDateAttributeDisplayOptions}
          buttonClassName="h-8"
          isDisabled={isDisabled}
          onDateValueChange={onPropertyValueChange}
        />
      </>
    ),
    RELATION_USER: (
      <>
        <MemberValueSelect
          propertyDetail={propertyDetail as TIssueProperty<EIssuePropertyType.RELATION>}
          value={propertyValue}
          projectId={undefined}
          error={propertyValueError}
          variant={variant}
          isMultiSelect={propertyDetail?.is_multi}
          buttonClassName="h-8"
          isDisabled={isDisabled}
          onMemberValueChange={onPropertyValueChange}
        />
      </>
    ),
    URL: (
      <>
        <UrlValueInput
          propertyDetail={propertyDetail as TIssueProperty<EIssuePropertyType.URL>}
          value={propertyValue}
          error={propertyValueError}
          variant={variant}
          className="min-h-8"
          isDisabled={isDisabled}
          onTextValueChange={onPropertyValueChange}
        />
      </>
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);

  const CurrentPropertyAttribute = isPropertyValuesLoading ? (
    <Loader className="w-full min-h-8">
      <Loader.Item height="32px" />
    </Loader>
  ) : (
    (propertyDetail?.id && CUSTOMER_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey]) || null
  );

  if (!CurrentPropertyAttribute) return null;

  return (
    <>
      {variant === "create" && (
        <div className="space-y-1">
          <div className={cn("w-full")}>
            <CustomerPropertyDetail />
          </div>
          <div className="w-full h-full min-h-8 flex flex-col gap-0.5">{CurrentPropertyAttribute}</div>
        </div>
      )}
      {variant === "update" && (
        <div className={cn("flex w-full gap-1 items-center min-h-8")}>
          <div className={cn("gap-1 flex-shrink-0 text-sm text-custom-text-300 w-2/5")}>
            <CustomerPropertyDetail />
          </div>
          <div className={cn("relative h-full flex flex-col gap-0.5 w-3/5")}>{CurrentPropertyAttribute}</div>
        </div>
      )}
    </>
  );
});
