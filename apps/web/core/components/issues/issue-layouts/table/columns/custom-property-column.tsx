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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/types";
import type {
  TIssueProperty,
  TIssue,
  TIssuePropertyValues,
  TTextAttributeConfigurations,
  TTextAttributeDisplayOptions,
  TDateAttributeConfigurations,
  TDateAttributeDisplayOptions,
  IIssueProperty,
} from "@plane/types";
import { Loader } from "@plane/ui";
import { getIssuePropertyTypeKey } from "@plane/utils";
// hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
// lib
import { store } from "@/lib/store-context";
// services
import { IssuePropertyValuesService } from "@/services/issue-types";
// value components
import { TextValueInput } from "@/components/work-item-types/values/components/text-input";
import { NumberValueInput } from "@/components/work-item-types/values/components/number-input";
import { BooleanInput } from "@/components/work-item-types/values/components/boolean-input";
import { DateValueSelect } from "@/components/work-item-types/values/components/date-select";
import { OptionValueSelect } from "@/components/work-item-types/values/components/option-select";
import { MemberValueSelect } from "@/components/work-item-types/values/components/member-select";
import { ReleaseValueSelect } from "@/components/work-item-types/values/components/release-select";
import { UrlValueInput } from "@/components/work-item-types/values/components/url-input";
import { FormulaDisplay } from "@/components/work-item-types/values/components/formula-display";

const workItemPropertyValuesService = new IssuePropertyValuesService();

export type SpreadsheetWorkItemPropertyColumnProps = {
  workspaceSlug: string;
  workItem: TIssue;
  propertyId: string;
  disabled: boolean;
};

export const SpreadsheetCustomPropertyColumn = observer(function SpreadsheetCustomPropertyColumn(
  props: SpreadsheetWorkItemPropertyColumnProps
) {
  const { workspaceSlug, workItem, propertyId, disabled } = props;
  // store hooks
  const { getIssuePropertyById, getIssueTypeById } = useIssueTypes();

  // Read property values directly from the work item object (inline from /work-items/ endpoint)
  const propertyValues: TIssuePropertyValues | undefined = workItem.property_values;
  const propertyValue = propertyValues?.[propertyId] ?? [];
  const hasPropertyValues = propertyValues !== undefined;

  const propertyDetail = getIssuePropertyById(propertyId);

  // Check if this property belongs to the work item's type by looking up the type's active properties
  const workItemType = workItem.type_id ? getIssueTypeById(workItem.type_id) : undefined;
  const propertyBelongsToWorkItemType = workItemType?.activeProperties.some((p) => p.id === propertyId) ?? false;

  const handleValueChange = useCallback(
    async (value: string[]) => {
      if (!workspaceSlug || !workItem.project_id) return;

      const workItemStore = store.issue.issues;

      // Optimistic update
      const previousValues: TIssuePropertyValues = propertyValues ?? {};
      const updatedValues: TIssuePropertyValues = { ...previousValues, [propertyId]: value };
      workItemStore.updateIssue(workItem.id, { property_values: updatedValues });

      try {
        await workItemPropertyValuesService.update(workspaceSlug, workItem.project_id, workItem.id, propertyId, value);
      } catch {
        // Rollback on error
        workItemStore.updateIssue(workItem.id, { property_values: previousValues });
      }
    },
    [workspaceSlug, workItem.project_id, workItem.id, propertyId, propertyValues]
  );

  if (!hasPropertyValues || !propertyDetail) {
    return (
      <div className="flex h-11 w-full items-center border-b-[0.5px] border-subtle px-2">
        <Loader className="w-full">
          <Loader.Item height="20px" />
        </Loader>
      </div>
    );
  }

  // Property doesn't belong to this work item's type — render empty cell
  if (!propertyBelongsToWorkItemType) {
    return <div className="h-11 w-full border-b-[0.5px] border-subtle" />;
  }

  const propertyDetailData = propertyDetail.asJSON;
  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail.property_type, propertyDetail.relation_type);

  return (
    <div className="h-11 w-full border-b-[0.5px] border-subtle">
      <PropertyValueEditor
        workspaceSlug={workspaceSlug}
        propertyTypeKey={propertyTypeKey}
        propertyDetailData={propertyDetailData}
        propertyValue={propertyValue}
        projectId={workItem.project_id ?? undefined}
        disabled={disabled}
        onValueChange={handleValueChange}
        getIssuePropertyById={getIssuePropertyById}
      />
    </div>
  );
});

type PropertyValueEditorProps = {
  workspaceSlug: string;
  propertyTypeKey: string;
  propertyDetailData: TIssueProperty<EIssuePropertyType>;
  propertyValue: string[];
  projectId: string | undefined;
  disabled: boolean;
  onValueChange: (value: string[]) => Promise<void>;
  getIssuePropertyById: (id: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

function PropertyValueEditor(props: PropertyValueEditorProps) {
  const {
    workspaceSlug,
    propertyTypeKey,
    propertyDetailData,
    propertyValue,
    projectId,
    disabled,
    onValueChange,
    getIssuePropertyById,
  } = props;

  switch (propertyTypeKey) {
    case "TEXT":
      return (
        <TextValueInput
          propertyDetail={propertyDetailData as TIssueProperty<EIssuePropertyType.TEXT>}
          value={propertyValue}
          variant="update"
          display_format={
            ((propertyDetailData?.settings as TTextAttributeConfigurations | undefined)
              ?.display_format as TTextAttributeDisplayOptions) ?? "single-line"
          }
          readOnlyData={propertyDetailData?.default_value?.[0]}
          className="h-11 border-0"
          isDisabled={disabled}
          onTextValueChange={onValueChange}
        />
      );
    case "DECIMAL":
      return (
        <NumberValueInput
          id={propertyDetailData?.id}
          displayName={propertyDetailData?.display_name}
          value={propertyValue}
          variant="update"
          numberInputSize="xs"
          className="h-11 border-0"
          isDisabled={disabled}
          onNumberValueChange={onValueChange}
        />
      );
    case "BOOLEAN":
      return (
        <div className="flex h-11 w-full items-center px-2">
          <BooleanInput value={propertyValue} onBooleanValueChange={onValueChange} isDisabled={disabled} />
        </div>
      );
    case "DATETIME":
      return (
        <DateValueSelect
          propertyDetail={propertyDetailData as TIssueProperty<EIssuePropertyType.DATETIME>}
          value={propertyValue}
          variant="update"
          displayFormat={
            (propertyDetailData?.settings as TDateAttributeConfigurations | undefined)
              ?.display_format as TDateAttributeDisplayOptions
          }
          buttonClassName="h-11 border-0"
          isDisabled={disabled}
          onDateValueChange={onValueChange}
        />
      );
    case "OPTION":
      return propertyDetailData?.id ? (
        <OptionValueSelect
          propertyDetail={propertyDetailData as TIssueProperty<EIssuePropertyType.OPTION>}
          value={propertyValue}
          customPropertyId={propertyDetailData.id}
          getPropertyInstanceById={getIssuePropertyById}
          variant="update"
          isMultiSelect={propertyDetailData.is_multi}
          buttonClassName="h-11 border-0"
          isDisabled={disabled}
          onOptionValueChange={onValueChange}
        />
      ) : null;
    case "RELATION_USER":
      return (
        <MemberValueSelect
          displayName={propertyDetailData?.display_name}
          value={propertyValue}
          projectId={projectId}
          variant="update"
          isMultiSelect={propertyDetailData?.is_multi}
          buttonClassName="h-11 border-0"
          isDisabled={disabled}
          onMemberValueChange={onValueChange}
        />
      );
    case "RELATION_RELEASE":
      return (
        <ReleaseValueSelect
          propertyDetail={propertyDetailData as TIssueProperty<EIssuePropertyType.RELATION>}
          value={propertyValue}
          workspaceSlug={workspaceSlug}
          variant="update"
          buttonClassName="h-11 border-0"
          isDisabled={disabled}
          onReleaseValueChange={onValueChange}
        />
      );
    case "URL":
      return (
        <UrlValueInput
          propertyDetail={propertyDetailData as TIssueProperty<EIssuePropertyType.URL>}
          value={propertyValue}
          variant="update"
          className="h-11 border-0"
          buttonClassName="h-11 w-full"
          isDisabled={disabled}
          onTextValueChange={onValueChange}
        />
      );
    case "FORMULA":
      return (
        <div className="flex h-11 w-full items-center px-2">
          <FormulaDisplay value={propertyValue} />
        </div>
      );
    default:
      return null;
  }
}
