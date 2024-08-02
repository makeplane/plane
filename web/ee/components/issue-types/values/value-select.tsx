import React from "react";
import { observer } from "mobx-react";
import { AlignLeft } from "lucide-react";
// ui
import { Loader, Logo, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
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
} from "@/plane-web/components/issue-types/values";
import { getIssuePropertyTypeKey } from "@/plane-web/helpers/issue-properties.helper";
// plane web types
import {
  EIssuePropertyType,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TIssuePropertyTypeKeys,
  TPropertyValueVariant,
  TTextAttributeDisplayOptions,
} from "@/plane-web/types";

type TPropertyValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  propertyValue: string[];
  projectId: string;
  variant: TPropertyValueVariant
  isPropertyValuesLoading: boolean;
  onPropertyValueChange: (value: string[]) => Promise<void>;
};

export const PropertyValueSelect = observer((props: TPropertyValueSelectProps) => {
  const { propertyDetail, propertyValue, projectId, variant, isPropertyValuesLoading, onPropertyValueChange } = props;
  // store hooks
  const { peekIssue } = useIssueDetail();
  // derived values
  const isPeekOverview = peekIssue ? true : false;

  const IssuePropertyDetail = () => (
    <>
      <div className="flex-shrink-0 grid place-items-center">
        {propertyDetail?.logo_props?.in_use ? (
          <Logo logo={propertyDetail.logo_props} size={16} type="lucide" customColor="text-custom-text-300" />
        ) : (
          <AlignLeft className={cn("w-4 h-4 text-custom-text-300")} />
        )}
      </div>
      <Tooltip tooltipContent={propertyDetail?.description} position="top-left" disabled={!propertyDetail?.description}>
        <span className={cn("w-full cursor-default truncate", variant === "create" && "text-sm text-custom-text-200")}>
          {propertyDetail?.display_name}
        </span>
      </Tooltip>
    </>
  );

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, JSX.Element>> = {
    TEXT: (
      <div className="w-full min-h-8">
        <TextValueInput
          propertyId={propertyDetail?.id}
          value={propertyValue}
          variant={variant}
          display_format={propertyDetail?.settings?.display_format as TTextAttributeDisplayOptions}
          readOnlyData={propertyDetail?.default_value?.[0]}
          isRequired={propertyDetail?.is_required}
          onTextValueChange={onPropertyValueChange}
        />
      </div>
    ),
    DECIMAL: (
      <div className="w-full h-8">
        <NumberValueInput
          propertyId={propertyDetail?.id}
          value={propertyValue}
          variant={variant}
          isRequired={propertyDetail?.is_required}
          onNumberValueChange={onPropertyValueChange}
        />
      </div>
    ),
    OPTION: (
      <div className="w-full h-8">
        {propertyDetail?.id && propertyDetail?.issue_type && (
          <OptionValueSelect
            value={propertyValue}
            issueTypeId={propertyDetail.issue_type}
            issuePropertyId={propertyDetail.id}
            variant={variant}
            isMultiSelect={propertyDetail.is_multi}
            isRequired={propertyDetail.is_required}
            onOptionValueChange={onPropertyValueChange}
          />
        )}
      </div>
    ),
    BOOLEAN: (
      <div className={cn("w-full flex items-center h-8", variant === "update" && "px-1.5")}>
        <BooleanInput value={propertyValue} onBooleanValueChange={onPropertyValueChange} />
      </div>
    ),
    DATETIME: (
      <div className="w-full h-8">
        <DateValueSelect
          value={propertyValue}
          variant={variant}
          displayFormat={propertyDetail?.settings?.display_format as TDateAttributeDisplayOptions}
          isRequired={propertyDetail?.is_required}
          onDateValueChange={onPropertyValueChange}
        />
      </div>
    ),
    RELATION_USER: (
      <div className="w-full h-8">
        <MemberValueSelect
          value={propertyValue}
          projectId={projectId}
          variant={variant}
          isMultiSelect={propertyDetail?.is_multi}
          isRequired={propertyDetail?.is_required}
          onMemberValueChange={onPropertyValueChange}
        />
      </div>
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);
  const isPropertyMultiLineText =
    propertyTypeKey === "TEXT" && propertyDetail?.settings?.display_format === "multi-line";

  const CurrentPropertyAttribute = isPropertyValuesLoading ? (
    <Loader className="w-full h-8">
      <Loader.Item height="32px" />
    </Loader>
  ) : (
    (propertyDetail?.id && ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey]) || null
  );

  if (!CurrentPropertyAttribute) return null;

  return (
    <>
      {variant === "create" && (
        <div
          className={cn("w-full flex items-center justify-center gap-1.5 py-1", isPropertyMultiLineText && "flex-col")}
        >
          <div className={cn("w-1/2 flex flex-shrink-0 gap-1.5 items-center", isPropertyMultiLineText && "w-full")}>
            <IssuePropertyDetail />
          </div>
          <div className="w-full h-full flex flex-col items-center">{CurrentPropertyAttribute}</div>
        </div>
      )}
      {variant === "update" && (
        <div
          className={cn(
            "flex w-full items-center gap-x-3 gap-y-1 min-h-8",
            isPropertyMultiLineText && "flex-col items-start"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-1 flex-shrink-0 text-sm text-custom-text-300",
              isPeekOverview ? "w-1/4" : "w-2/5",
              isPropertyMultiLineText && "w-full"
            )}
          >
            <IssuePropertyDetail />
          </div>
          <div className="relative h-full min-h-8 w-full flex-grow flex items-center">{CurrentPropertyAttribute}</div>
        </div>
      )}
    </>
  );
});
