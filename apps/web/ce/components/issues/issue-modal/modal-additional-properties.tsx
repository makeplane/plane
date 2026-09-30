/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";
import type { TIssue } from "@plane/types";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { IssueTypeService } from "@/services/issue-type.service";
import { IssueTypePropertyField } from "@/plane-web/components/issues/issue-type-properties/fields";

const service = new IssueTypeService();

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
};

export const WorkItemModalAdditionalProperties = observer(function WorkItemModalAdditionalProperties(
  props: TWorkItemModalAdditionalPropertiesProps
) {
  const { projectId, workItemId, workspaceSlug } = props;
  const { watch } = useFormContext<TIssue>();
  const typeId = watch("type_id");
  const { issuePropertyValues, setIssuePropertyValues, issuePropertyValueErrors, setMandatoryPropertyIds } =
    useIssueModal();

  const schemaKey =
    workspaceSlug && projectId && typeId ? `ISSUE_TYPE_PROPS_${workspaceSlug}_${projectId}_${typeId}` : null;

  const { data: schema } = useSWR(schemaKey, () => service.listTypeProperties(workspaceSlug, projectId!, typeId!));

  const valuesKey =
    workspaceSlug && projectId && workItemId ? `ISSUE_PROP_VALUES_${workspaceSlug}_${projectId}_${workItemId}` : null;

  const { data: savedValues } = useSWR(valuesKey, () =>
    service.getIssuePropertyValues(workspaceSlug, projectId!, workItemId!)
  );

  useEffect(() => {
    if (!schema?.length) return;
    if (workItemId && savedValues === undefined) return;
    setIssuePropertyValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const row of schema) {
        if (next[row.property_id] !== undefined) continue;
        const saved = savedValues?.find((v) => v.property_id === row.property_id);
        next[row.property_id] = saved?.value ?? row.default_value ?? null;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [schema, savedValues, workItemId, setIssuePropertyValues]);

  useEffect(() => {
    if (!typeId) {
      setIssuePropertyValues({});
      setMandatoryPropertyIds([]);
      return;
    }
    if (!schema?.length) {
      setMandatoryPropertyIds([]);
      return;
    }
    setMandatoryPropertyIds(
      schema
        .filter((row) => row.is_mandatory)
        .map((row) => row.property_id ?? "")
        .filter(Boolean)
    );
  }, [typeId, schema, setIssuePropertyValues, setMandatoryPropertyIds]);

  if (!projectId || !typeId || !schema?.length) return null;

  return (
    <div className="space-y-3 rounded-md border border-subtle bg-surface-1 p-3">
      {schema.map((property) => (
        <IssueTypePropertyField
          key={property.property_id}
          property={property}
          value={issuePropertyValues[property.property_id]}
          error={issuePropertyValueErrors[property.property_id]}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onChange={(value) =>
            setIssuePropertyValues((prev) => ({
              ...prev,
              [property.property_id]: value,
            }))
          }
          compact
        />
      ))}
    </div>
  );
});
