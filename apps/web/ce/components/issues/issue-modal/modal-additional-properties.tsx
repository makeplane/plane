/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
// plane imports
import type { IIssueProperty, TIssue, TIssuePropertyValues } from "@plane/types";
import { EIssuePropertyType } from "@plane/types";
// components
import { WorkItemPropertyField } from "@/plane-web/components/issues/issue-properties";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssueProperty } from "@/hooks/store/use-issue-property";
import { useIssuePropertyValue } from "@/hooks/store/use-issue-property-value";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
};

/**
 * Computes the seed values (defaults / default options) for a set of properties.
 */
const getDefaultPropertyValues = (properties: IIssueProperty[]): TIssuePropertyValues => {
  const defaults: TIssuePropertyValues = {};
  properties.forEach((property) => {
    if (property.property_type === EIssuePropertyType.OPTION) {
      const defaultOptionIds = (property.options ?? [])
        .filter((option) => option.is_default && option.is_active)
        .map((option) => option.id);
      if (defaultOptionIds.length === 0) return;
      defaults[property.id] = property.is_multi ? defaultOptionIds : [defaultOptionIds[0]];
      return;
    }
    if (property.default_value !== null && property.default_value !== undefined && property.default_value !== "") {
      defaults[property.id] = [property.default_value];
    }
  });
  return defaults;
};

export const WorkItemModalAdditionalProperties = observer(function WorkItemModalAdditionalProperties(
  props: TWorkItemModalAdditionalPropertiesProps
) {
  const { projectId, workItemId, workspaceSlug } = props;
  // form context
  const { watch } = useFormContext<TIssue>();
  const typeId = watch("type_id");
  // store hooks
  const { getTypeProperties, fetchTypeProperties } = useIssueProperty();
  const { fetchIssueValues } = useIssuePropertyValue();
  const { issuePropertyValues, setIssuePropertyValues, issuePropertyValueErrors, setIssuePropertyValueErrors } =
    useIssueModal();
  // refs
  const seededKeyRef = useRef<string | null>(null);
  // derived values
  const properties = getTypeProperties(typeId, true);

  // fetch the property definitions of the selected type
  useEffect(() => {
    if (!typeId || !projectId || !workspaceSlug) return;
    fetchTypeProperties(workspaceSlug, projectId, typeId).catch(() => {});
  }, [typeId, projectId, workspaceSlug, fetchTypeProperties]);

  // seed the form values (defaults for new items, persisted values when editing)
  useEffect(() => {
    if (!typeId || !projectId || !workspaceSlug || !properties) return;
    const key = `${typeId}:${workItemId ?? "new"}`;
    if (seededKeyRef.current === key) return;
    seededKeyRef.current = key;

    const defaults = getDefaultPropertyValues(properties);
    if (workItemId) {
      fetchIssueValues(workspaceSlug, projectId, workItemId)
        .then((grouped) => setIssuePropertyValues({ ...defaults, ...grouped }))
        .catch(() => setIssuePropertyValues(defaults));
    } else {
      setIssuePropertyValues(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId, workItemId, projectId, workspaceSlug, properties?.length]);

  if (!projectId || !properties || properties.length === 0) return null;

  const handleChange = (propertyId: string, values: string[]) => {
    setIssuePropertyValues((prev) => ({ ...prev, [propertyId]: values }));
    setIssuePropertyValueErrors((prev) => (prev[propertyId] ? { ...prev, [propertyId]: "" } : prev));
  };

  return (
    <div className="space-y-3 px-5">
      {properties.map((property) => (
        <WorkItemPropertyField
          key={property.id}
          property={property}
          projectId={projectId}
          value={issuePropertyValues[property.id] ?? []}
          onChange={(values) => handleChange(property.id, values)}
          error={issuePropertyValueErrors[property.id] === "REQUIRED" ? "This field is required." : undefined}
        />
      ))}
    </div>
  );
});
