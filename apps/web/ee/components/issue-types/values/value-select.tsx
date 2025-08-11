import React from "react";
import { observer } from "mobx-react";
import { InfoIcon } from "lucide-react";
// plane imports
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
import { Loader, Tooltip } from "@plane/ui";
import { getIssuePropertyTypeKey, cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import {
  TextValueInput,
  BooleanInput,
  NumberValueInput,
  MemberValueSelect,
  DateValueSelect,
  OptionValueSelect,
  IssuePropertyLogo,
} from "@/plane-web/components/issue-types";

type TPropertyValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  propertyValue: string[];
  propertyValueError?: EIssuePropertyValueError;
  projectId: string | undefined;
  variant: TPropertyValueVariant;
  arePropertyValuesInitializing: boolean;
  isDisabled: boolean;
  onPropertyValueChange: (value: string[]) => Promise<void>;
  getPropertyInstanceById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

export const PropertyValueSelect = observer((props: TPropertyValueSelectProps) => {
  const {
    propertyDetail,
    propertyValue,
    propertyValueError,
    projectId,
    variant,
    arePropertyValuesInitializing,
    onPropertyValueChange,
    getPropertyInstanceById,
    isDisabled,
  } = props;
  // store hooks
  const { peekIssue } = useIssueDetail();
  // derived values
  const isPeekOverview = peekIssue ? true : false;

  const IssuePropertyDetail = () => (
    <>
      <div className="flex-shrink-0 grid place-items-center">
        {propertyDetail?.logo_props?.in_use && (
          <IssuePropertyLogo icon_props={propertyDetail.logo_props.icon} colorClassName="text-custom-text-300" />
        )}
      </div>
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

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, React.ReactNode>> = {
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
        {propertyDetail?.id && propertyDetail?.issue_type && (
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
          error={propertyValueError}
          projectId={projectId}
          variant={variant}
          isMultiSelect={propertyDetail?.is_multi}
          buttonClassName="h-8"
          isDisabled={isDisabled}
          onMemberValueChange={onPropertyValueChange}
        />
      </>
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);

  const CurrentPropertyAttribute = arePropertyValuesInitializing ? (
    <Loader className="w-full min-h-8">
      <Loader.Item height="32px" />
    </Loader>
  ) : (
    (propertyDetail?.id && ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey]) || null
  );

  if (!CurrentPropertyAttribute) return null;

  return (
    <>
      {variant === "create" && (
        <div className={cn("w-full flex flex-shrink-0 items-start justify-center py-1")}>
          <div className={cn("w-2/5 h-8 flex flex-shrink-0 gap-1.5 items-center")}>
            <IssuePropertyDetail />
          </div>
          <div className="w-3/5 h-full min-h-8 flex flex-col gap-0.5 pl-3">{CurrentPropertyAttribute}</div>
        </div>
      )}
      {variant === "update" && (
        <div className={cn("flex w-full items-start gap-y-1 min-h-8")}>
          <div
            className={cn(
              "flex items-center h-8 gap-1 flex-shrink-0 text-sm text-custom-text-300",
              isPeekOverview ? "w-1/4" : "w-2/5"
            )}
          >
            <IssuePropertyDetail />
          </div>
          <div
            className={cn("relative h-full min-h-8 flex flex-col gap-0.5 pl-3", {
              "w-3/4": isPeekOverview,
              "w-3/5": !isPeekOverview,
            })}
          >
            {CurrentPropertyAttribute}
          </div>
        </div>
      )}
    </>
  );
});
