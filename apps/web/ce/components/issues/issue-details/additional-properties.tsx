/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IIssueProperty, TIssuePropertyValues } from "@plane/types";
// components
import { FREE_TEXT_PROPERTY_TYPES, IssuePropertyInput } from "@/plane-web/components/issues/issue-properties";
// hooks
import { useIssueProperty } from "@/hooks/store/use-issue-property";
import { useIssuePropertyValue } from "@/hooks/store/use-issue-property-value";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, workItemTypeId, projectId, workspaceSlug, isEditable } = props;
  // store hooks
  const { getTypeProperties, fetchTypeProperties } = useIssueProperty();
  const { getIssueValues, fetchIssueValues, setValue } = useIssuePropertyValue();
  // state
  const [localValues, setLocalValues] = useState<TIssuePropertyValues>({});
  // derived values
  const properties = getTypeProperties(workItemTypeId, true);

  // fetch definitions and values, seeding the local editing state
  useEffect(() => {
    if (!workItemId || !workItemTypeId) return;
    fetchTypeProperties(workspaceSlug, projectId, workItemTypeId).catch(() => {});
    fetchIssueValues(workspaceSlug, projectId, workItemId)
      .then((grouped) => setLocalValues(grouped))
      .catch(() => {});
  }, [workItemId, workItemTypeId, projectId, workspaceSlug, fetchTypeProperties, fetchIssueValues]);

  if (!properties || properties.length === 0) return <></>;

  const persist = (propertyId: string, values: string[]) => {
    setValue(workspaceSlug, projectId, workItemId, propertyId, values).catch(() => {
      // revert to the last persisted value on failure
      const original = getIssueValues(workItemId)?.[propertyId] ?? [];
      setLocalValues((prev) => ({ ...prev, [propertyId]: original }));
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update the property value.",
      });
    });
  };

  const handleChange = (property: IIssueProperty, values: string[]) => {
    setLocalValues((prev) => ({ ...prev, [property.id]: values }));
    // discrete controls commit immediately; free-text controls commit on blur
    if (!FREE_TEXT_PROPERTY_TYPES.includes(property.property_type)) persist(property.id, values);
  };

  const handleBlur = (property: IIssueProperty) => {
    if (!FREE_TEXT_PROPERTY_TYPES.includes(property.property_type)) return;
    const values = localValues[property.id] ?? [];
    const original = getIssueValues(workItemId)?.[property.id] ?? [];
    if (JSON.stringify(values) !== JSON.stringify(original)) persist(property.id, values);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {properties.map((property) => (
        <div key={property.id} className="flex min-h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-secondary">
            <span className="truncate">{property.display_name}</span>
            {property.is_required && <span className="text-danger-text">*</span>}
          </div>
          <div className="w-3/5">
            <IssuePropertyInput
              property={property}
              projectId={projectId}
              value={localValues[property.id] ?? []}
              disabled={!isEditable}
              onChange={(values) => handleChange(property, values)}
              onBlur={() => handleBlur(property)}
            />
          </div>
        </div>
      ))}
    </div>
  );
});
