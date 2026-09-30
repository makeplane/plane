/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ListTodo } from "lucide-react";
import { IssueTypeService } from "@/services/issue-type.service";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { IssueTypePropertyField } from "@/plane-web/components/issues/issue-type-properties/fields";
import { normalizeIssuePropertyValueForApi } from "@/plane-web/helpers/issue-type-property-values";

const service = new IssueTypeService();

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
  const [localValues, setLocalValues] = useState<Record<string, unknown>>({});

  const schemaKey =
    workspaceSlug && projectId && workItemTypeId
      ? `ISSUE_TYPE_PROPS_${workspaceSlug}_${projectId}_${workItemTypeId}`
      : null;

  const { data: schema } = useSWR(schemaKey, () =>
    service.listTypeProperties(workspaceSlug, projectId, workItemTypeId!)
  );

  const valuesKey = `ISSUE_PROP_VALUES_${workspaceSlug}_${projectId}_${workItemId}`;
  const { data: savedValues, mutate } = useSWR(valuesKey, () =>
    service.getIssuePropertyValues(workspaceSlug, projectId, workItemId)
  );

  useEffect(() => {
    if (!schema?.length) return;
    const next: Record<string, unknown> = {};
    for (const row of schema) {
      const saved = savedValues?.find((v) => v.property_id === row.property_id);
      next[row.property_id] = saved?.value ?? row.default_value ?? null;
    }
    setLocalValues(next);
  }, [schema, savedValues]);

  const persistValue = useCallback(
    async (propertyId: string, value: unknown) => {
      setLocalValues((prev) => ({ ...prev, [propertyId]: value }));
      await service.saveIssuePropertyValues(workspaceSlug, projectId, workItemId, [
        { property_id: propertyId, value: normalizeIssuePropertyValueForApi(value) },
      ]);
      await mutate();
    },
    [workspaceSlug, projectId, workItemId, mutate]
  );

  if (!workItemTypeId || !schema?.length) return null;

  return (
    <>
      {schema.map((property) => (
        <SidebarPropertyListItem key={property.property_id} icon={ListTodo} label={property.title ?? ""}>
          <IssueTypePropertyField
            property={property}
            value={localValues[property.property_id]}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            disabled={!isEditable}
            onChange={(value) => {
              void persistValue(property.property_id, value);
            }}
            compact
          />
        </SidebarPropertyListItem>
      ))}
    </>
  );
});
