/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React from "react";
import { observer } from "mobx-react";
import { InfoIcon } from "@plane/propel/icons";
import { TriangleAlert } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type {
  EIssuePropertyType,
  EIssuePropertyValueError,
  IIssueProperty,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TIssuePropertyTypeKeys,
  TPropertyValueVariant,
  TTextAttributeDisplayOptions,
} from "@plane/types";
import { Loader, LUCIDE_ICONS_LIST } from "@plane/ui";
import { getIssuePropertyTypeKey, cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { IssuePropertyLogo } from "../properties/common/issue-property-logo";
import { BooleanInput } from "./components/boolean-input";
import { DateValueSelect } from "./components/date-select";
import { MemberValueSelect } from "./components/member-select";
import { NumberValueInput } from "./components/number-input";
import { OptionValueSelect } from "./components/option-select";
import { TextValueInput } from "./components/text-input";
import { UrlValueInput } from "./components/url-input";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";

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

export const PropertyValueSelect = observer(function PropertyValueSelect(props: TPropertyValueSelectProps) {
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

  function IssuePropertyDetail() {
    return (
      <>
        <div className="flex-shrink-0 grid place-items-center">
          {propertyDetail?.logo_props?.in_use && (
            <IssuePropertyLogo icon_props={propertyDetail.logo_props.icon} colorClassName="text-tertiary" />
          )}
        </div>
        <span
          className={cn(
            "w-full cursor-default truncate",
            variant === "create" && "text-body-xs-regular text-secondary"
          )}
        >
          <span className="flex gap-0.5 items-center">
            <span className="truncate">{propertyDetail?.display_name}</span>
            {propertyDetail?.is_required && <span className="text-danger-primary">*</span>}
            {propertyDetail.description && (
              <Tooltip
                tooltipContent={propertyDetail?.description}
                position="right"
                disabled={!propertyDetail?.description}
              >
                <span className="flex-shrink-0">
                  <InfoIcon className=" w-3 h-3 mx-0.5 text-tertiary cursor-pointer" />
                </span>
              </Tooltip>
            )}
          </span>
        </span>
      </>
    );
  }

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
        <>
          <SidebarPropertyListItem
            icon={
              LUCIDE_ICONS_LIST.find((item) => item.name === propertyDetail?.logo_props?.icon?.name)?.element ??
              TriangleAlert
            }
            label={propertyDetail?.display_name ?? ""}
          >
            {CurrentPropertyAttribute}
          </SidebarPropertyListItem>
        </>
      )}
    </>
  );
});
