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

import { useRef } from "react";
import { observer } from "mobx-react";
// types
import type { IIssueDisplayProperties, TIssue } from "@plane/types";
import { isCustomPropertyKey } from "@plane/utils";
// components
import { SPREADSHEET_COLUMNS, shouldRenderWorkItemPropertyColumn } from "@/helpers/work-item-layout";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
import { SpreadsheetCustomPropertyColumn } from "./columns/custom-property-column";

type WorkItemColumnProps = {
  workspaceSlug: string;
  displayProperties: IIssueDisplayProperties;
  issueDetail: TIssue;
  property: keyof IIssueDisplayProperties;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  isEstimateEnabled: boolean;
  canEditProperty: (property: TWorkItemProperty) => boolean;
};

export const IssueColumn = observer(function IssueColumn(props: WorkItemColumnProps) {
  const { workspaceSlug, displayProperties, issueDetail, canEditProperty, property, updateIssue } = props;
  const tableCellRef = useRef<HTMLTableCellElement | null>(null);

  // Handle custom property columns
  if (isCustomPropertyKey(property)) {
    const propertyId = property.replace("customproperty_", "");
    return (
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey={property as keyof IIssueDisplayProperties}
      >
        <td
          className="h-11 min-w-36 text-13 after:absolute after:w-full after:bottom-[-1px] after:border after:border-subtle border-r-[1px] border-subtle"
          ref={tableCellRef}
        >
          <SpreadsheetCustomPropertyColumn
            workspaceSlug={workspaceSlug}
            workItem={issueDetail}
            propertyId={propertyId}
            disabled={!canEditProperty("property_values")}
          />
        </td>
      </WithDisplayPropertiesHOC>
    );
  }

  const columnDetails = SPREADSHEET_COLUMNS[property];
  if (!columnDetails) return null;

  const shouldRenderProperty = shouldRenderWorkItemPropertyColumn(property);

  const handleUpdateIssue = async (issue: TIssue, data: Partial<TIssue>) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, data);
  };

  const Column = columnDetails.component;
  return (
    <WithDisplayPropertiesHOC
      displayProperties={displayProperties}
      displayPropertyKey={property}
      shouldRenderProperty={() => shouldRenderProperty}
    >
      <td
        tabIndex={0}
        className="h-11 min-w-36 text-13 after:absolute after:w-full after:bottom-[-1px] after:border after:border-subtle border-r-[1px] border-subtle"
        ref={tableCellRef}
      >
        <Column
          issue={issueDetail}
          onChange={handleUpdateIssue}
          disabled={!canEditProperty(columnDetails.workItemProperty)}
          onClose={() => tableCellRef?.current?.focus()}
        />
      </td>
    </WithDisplayPropertiesHOC>
  );
});
