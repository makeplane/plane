/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import {
  EIssuePropertyType,
  type TIssueProperty,
  type TIssuePropertyValueRecord,
  type TIssuePropertyValuesResponse,
  type TWorkItemType,
} from "@plane/types";
// components
import { EpicChildrenPanel } from "@/components/epics";
// services
import { IssueTypeService } from "@/services/issue-type.service";

const issueTypeService = new IssueTypeService();

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

function recordToValue(record: TIssuePropertyValueRecord, type: EIssuePropertyType): string {
  switch (type) {
    case EIssuePropertyType.DECIMAL:
      return String(record.value_decimal ?? "");
    case EIssuePropertyType.BOOLEAN:
      return record.value_boolean ? "true" : "false";
    case EIssuePropertyType.DATETIME:
      return record.value_datetime ? record.value_datetime.split("T")[0] : "";
    case EIssuePropertyType.OPTION:
      return record.value_option ?? "";
    case EIssuePropertyType.RELATION:
      return record.value_uuid ?? "";
    default:
      return record.value_text ?? "";
  }
}

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, workItemTypeId, projectId, workspaceSlug, isEditable } = props;

  const { data: properties } = useSWR<TIssueProperty[]>(
    workItemTypeId ? `WORK_ITEM_PROPS_${projectId}_${workItemTypeId}` : null,
    workItemTypeId ? () => issueTypeService.listProperties(workspaceSlug, projectId, workItemTypeId) : null
  );

  // Determine whether this work item's type is an epic (to show the children panel).
  const { data: workItemTypes } = useSWR<TWorkItemType[]>(
    workItemTypeId ? `WORK_ITEM_TYPES_${workspaceSlug}_${projectId}` : null,
    workItemTypeId ? () => issueTypeService.list(workspaceSlug, projectId) : null
  );
  const isEpic = Boolean(workItemTypes?.find((type) => type.id === workItemTypeId)?.is_epic);

  const { data: values } = useSWR<TIssuePropertyValuesResponse>(
    workItemTypeId ? `WORK_ITEM_PROP_VALUES_${projectId}_${workItemId}` : null,
    workItemTypeId ? () => issueTypeService.getValues(workspaceSlug, projectId, workItemId) : null
  );

  const [draft, setDraft] = useState<Record<string, string[]>>({});
  // Seed the draft from server values only once per work item, so background SWR
  // revalidations (focus/reconnect) don't clobber in-flight or just-typed edits.
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!properties || !values) return;
    if (seededFor.current === workItemId) return;
    const next: Record<string, string[]> = {};
    properties.forEach((property) => {
      const records = values[property.id] ?? [];
      next[property.id] = records.map((record) => recordToValue(record, property.property_type)).filter(Boolean);
    });
    setDraft(next);
    seededFor.current = workItemId;
  }, [properties, values, workItemId]);

  const persist = async (next: Record<string, string[]>) => {
    try {
      await issueTypeService.setValues(workspaceSlug, projectId, workItemId, next);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not save property", message: "Please check the values." });
    }
  };

  // Update the local draft without a network call (used while typing text fields).
  const updateLocal = (propertyId: string, nextValues: string[]) => {
    setDraft((current) => ({ ...current, [propertyId]: nextValues }));
  };

  // Update the draft and persist (used for selects/checkboxes and text-field blur).
  const commit = (propertyId: string, nextValues: string[]) => {
    const next = { ...draft, [propertyId]: nextValues };
    setDraft(next);
    persist(next);
  };

  const activeProperties = (properties ?? []).filter((property) => property.is_active);
  if (!workItemTypeId || (!isEpic && activeProperties.length === 0)) return <></>;

  return (
    <>
      {isEpic && (
        <EpicChildrenPanel
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={workItemId}
          disabled={!isEditable}
        />
      )}
      {activeProperties.length > 0 && (
        <div className="mt-2 space-y-3 border-t border-subtle pt-3">
          {activeProperties.map((property) => (
            <div key={property.id} className="flex items-start gap-2">
              <span className="w-2/5 pt-1 text-12 text-tertiary">
                {property.display_name}
                {property.is_required && <span className="text-danger-primary"> *</span>}
              </span>
              <div className="w-3/5">
                <PropertyInput
                  property={property}
                  values={draft[property.id] ?? []}
                  disabled={!isEditable}
                  onLocalChange={(next) => updateLocal(property.id, next)}
                  onCommit={(next) => commit(property.id, next)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
});

type PropertyInputProps = {
  property: TIssueProperty;
  values: string[];
  disabled: boolean;
  // Update local draft only (no network) - used while typing free-text fields.
  onLocalChange: (values: string[]) => void;
  // Update draft and persist - used for selects/checkboxes/dates and text blur.
  onCommit: (values: string[]) => void;
};

function PropertyInput({ property, values, disabled, onLocalChange, onCommit }: PropertyInputProps) {
  const single = values[0] ?? "";
  const inputClass =
    "w-full rounded-md border border-subtle bg-surface-1 px-2 py-1 text-12 text-secondary disabled:opacity-60";

  switch (property.property_type) {
    case EIssuePropertyType.BOOLEAN:
      return (
        <input
          type="checkbox"
          disabled={disabled}
          checked={single === "true"}
          onChange={(e) => onCommit([e.target.checked ? "true" : "false"])}
        />
      );
    case EIssuePropertyType.DECIMAL:
      // Controlled so it reflects the current work item after navigation.
      return (
        <input
          type="number"
          className={inputClass}
          disabled={disabled}
          value={single}
          onChange={(e) => onLocalChange(e.target.value ? [e.target.value] : [])}
          onBlur={(e) => onCommit(e.target.value ? [e.target.value] : [])}
        />
      );
    case EIssuePropertyType.DATETIME:
      return (
        <input
          type="date"
          className={inputClass}
          disabled={disabled}
          value={single}
          onChange={(e) => onCommit(e.target.value ? [e.target.value] : [])}
        />
      );
    case EIssuePropertyType.URL:
      return (
        <input
          type="url"
          className={inputClass}
          disabled={disabled}
          value={single}
          onChange={(e) => onLocalChange(e.target.value ? [e.target.value] : [])}
          onBlur={(e) => onCommit(e.target.value ? [e.target.value] : [])}
        />
      );
    case EIssuePropertyType.OPTION:
      if (property.is_multi) {
        return (
          <div className="flex flex-col gap-1">
            {property.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-12 text-secondary">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={values.includes(option.id)}
                  onChange={(e) =>
                    onCommit(e.target.checked ? [...values, option.id] : values.filter((value) => value !== option.id))
                  }
                />
                {option.name}
              </label>
            ))}
          </div>
        );
      }
      return (
        <select
          className={inputClass}
          disabled={disabled}
          value={single}
          onChange={(e) => onCommit(e.target.value ? [e.target.value] : [])}
        >
          <option value="">—</option>
          {property.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      );
    case EIssuePropertyType.RELATION:
      // Member relation editing is handled via the importer/API for now.
      return <span className="text-12 text-tertiary">{single || "—"}</span>;
    default:
      return (
        <input
          type="text"
          className={inputClass}
          disabled={disabled}
          value={single}
          onChange={(e) => onLocalChange(e.target.value ? [e.target.value] : [])}
          onBlur={(e) => onCommit(e.target.value ? [e.target.value] : [])}
        />
      );
  }
}
