/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2 } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ICustomSearchSelectOption, IIssueProperty } from "@plane/types";
import { EIssuePropertyRelationType, EIssuePropertyType } from "@plane/types";
import { CustomSearchSelect, Input, ToggleSwitch } from "@plane/ui";
// hooks
import { useIssueProperty } from "@/hooks/store/use-issue-property";

/** UI-facing property kinds. "member" maps to a USER relation. */
type TPropertyKind = "text" | "number" | "boolean" | "date" | "dropdown" | "member" | "url";

const PROPERTY_KIND_LABELS: Record<TPropertyKind, string> = {
  text: "Text",
  number: "Number",
  boolean: "Boolean",
  date: "Date",
  dropdown: "Dropdown",
  member: "Member picker",
  url: "URL",
};

const propertyKindToPayload = (kind: TPropertyKind): Partial<IIssueProperty> => {
  switch (kind) {
    case "text":
      return { property_type: EIssuePropertyType.TEXT };
    case "number":
      return { property_type: EIssuePropertyType.DECIMAL };
    case "boolean":
      return { property_type: EIssuePropertyType.BOOLEAN };
    case "date":
      return { property_type: EIssuePropertyType.DATETIME };
    case "dropdown":
      return { property_type: EIssuePropertyType.OPTION };
    case "member":
      return { property_type: EIssuePropertyType.RELATION, relation_type: EIssuePropertyRelationType.USER };
    case "url":
      return { property_type: EIssuePropertyType.URL };
  }
};

const getPropertyKindLabel = (property: IIssueProperty): string => {
  switch (property.property_type) {
    case EIssuePropertyType.TEXT:
      return PROPERTY_KIND_LABELS.text;
    case EIssuePropertyType.DECIMAL:
      return PROPERTY_KIND_LABELS.number;
    case EIssuePropertyType.BOOLEAN:
      return PROPERTY_KIND_LABELS.boolean;
    case EIssuePropertyType.DATETIME:
      return PROPERTY_KIND_LABELS.date;
    case EIssuePropertyType.OPTION:
      return PROPERTY_KIND_LABELS.dropdown;
    case EIssuePropertyType.RELATION:
      return PROPERTY_KIND_LABELS.member;
    case EIssuePropertyType.URL:
      return PROPERTY_KIND_LABELS.url;
    default:
      return property.property_type;
  }
};

type TSettingsRootProps = {
  workspaceSlug: string;
  projectId: string;
  typeId: string;
};

/**
 * Manages the custom property definitions (and OPTION options) of a work item
 * type. Self-contained so it can be dropped into a "Work item Types" settings
 * page once that page exists.
 */
export const WorkItemPropertiesSettingsRoot = observer(function WorkItemPropertiesSettingsRoot(
  props: TSettingsRootProps
) {
  const { workspaceSlug, projectId, typeId } = props;
  // store hooks
  const { getTypeProperties, fetchTypeProperties, createProperty, updateProperty, deleteProperty } = useIssueProperty();
  // state
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftKind, setDraftKind] = useState<TPropertyKind>("text");
  const [draftMulti, setDraftMulti] = useState(false);
  const [draftRequired, setDraftRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // derived values
  const properties = getTypeProperties(typeId) ?? [];

  useEffect(() => {
    fetchTypeProperties(workspaceSlug, projectId, typeId).catch(() => {});
  }, [workspaceSlug, projectId, typeId, fetchTypeProperties]);

  const resetDraft = () => {
    setDraftName("");
    setDraftKind("text");
    setDraftMulti(false);
    setDraftRequired(false);
    setIsAdding(false);
  };

  const handleCreate = async () => {
    if (!draftName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProperty(workspaceSlug, projectId, typeId, {
        display_name: draftName.trim(),
        is_multi: draftMulti,
        is_required: draftRequired,
        ...propertyKindToPayload(draftKind),
      });
      resetDraft();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to create the property." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (property: IIssueProperty, key: "is_active" | "is_required", value: boolean) => {
    const data: Partial<IIssueProperty> = key === "is_active" ? { is_active: value } : { is_required: value };
    try {
      await updateProperty(workspaceSlug, projectId, typeId, property.id, data);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to update the property." });
    }
  };

  const handleDelete = async (property: IIssueProperty) => {
    try {
      await deleteProperty(workspaceSlug, projectId, typeId, property.id);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to delete the property." });
    }
  };

  const kindOptions: ICustomSearchSelectOption[] = (Object.keys(PROPERTY_KIND_LABELS) as TPropertyKind[]).map(
    (kind) => ({
      value: kind,
      query: PROPERTY_KIND_LABELS[kind],
      content: <span>{PROPERTY_KIND_LABELS[kind]}</span>,
    })
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {properties.map((property) => (
          <div key={property.id} className="flex flex-col gap-2 rounded-md border border-subtle p-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col">
                <span className="text-13 text-primary">{property.display_name}</span>
                <span className="text-11 text-tertiary">
                  {getPropertyKindLabel(property)}
                  {property.is_multi ? " · Multi" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-11 text-secondary">
                <span>Required</span>
                <ToggleSwitch
                  value={property.is_required}
                  onChange={(value) => handleToggle(property, "is_required", value)}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-1 text-11 text-secondary">
                <span>Active</span>
                <ToggleSwitch
                  value={property.is_active}
                  onChange={(value) => handleToggle(property, "is_active", value)}
                  size="sm"
                />
              </div>
              <button
                type="button"
                className="hover:text-danger-text flex-shrink-0 text-tertiary"
                onClick={() => handleDelete(property)}
                aria-label="Delete property"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {property.property_type === EIssuePropertyType.OPTION && (
              <PropertyOptionsEditor workspaceSlug={workspaceSlug} projectId={projectId} property={property} />
            )}
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="flex flex-col gap-2 rounded-md border border-subtle p-3">
          <Input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Property name"
            className="w-full"
          />
          <div className="flex items-center gap-3">
            <CustomSearchSelect
              value={draftKind}
              options={kindOptions}
              onChange={(value: TPropertyKind) => setDraftKind(value)}
              label={PROPERTY_KIND_LABELS[draftKind]}
              buttonClassName="w-40"
            />
            {draftKind === "dropdown" || draftKind === "member" ? (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <span>Multi</span>
                <ToggleSwitch value={draftMulti} onChange={setDraftMulti} size="sm" />
              </div>
            ) : null}
            <div className="flex items-center gap-1 text-11 text-secondary">
              <span>Required</span>
              <ToggleSwitch value={draftRequired} onChange={setDraftRequired} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleCreate} loading={isSubmitting}>
              Create
            </Button>
            <Button variant="secondary" size="sm" onClick={resetDraft}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 text-13 text-link-primary hover:text-link-primary-hover"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add new property
        </button>
      )}
    </div>
  );
});

type TOptionsEditorProps = {
  workspaceSlug: string;
  projectId: string;
  property: IIssueProperty;
};

const PropertyOptionsEditor = observer(function PropertyOptionsEditor(props: TOptionsEditorProps) {
  const { workspaceSlug, projectId, property } = props;
  // store hooks
  const { createOption, updateOption, deleteOption } = useIssueProperty();
  // state
  const [optionName, setOptionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!optionName.trim()) return;
    setIsSubmitting(true);
    try {
      await createOption(workspaceSlug, projectId, property.id, { name: optionName.trim() });
      setOptionName("");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to add the option." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 border-t border-subtle pt-2 pl-2">
      {(property.options ?? []).map((option) => (
        <div key={option.id} className="flex items-center gap-2 text-11">
          <span className="flex-1 text-secondary">{option.name}</span>
          <div className="flex items-center gap-1 text-tertiary">
            <span>Default</span>
            <ToggleSwitch
              value={option.is_default}
              onChange={(value) =>
                updateOption(workspaceSlug, projectId, property.id, option.id, { is_default: value }).catch(() => {
                  setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to update the option." });
                })
              }
              size="sm"
            />
          </div>
          <button
            type="button"
            className="hover:text-danger-text flex-shrink-0 text-tertiary"
            onClick={() =>
              deleteOption(workspaceSlug, projectId, property.id, option.id).catch(() => {
                setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to delete the option." });
              })
            }
            aria-label="Delete option"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={optionName}
          onChange={(e) => setOptionName(e.target.value)}
          placeholder="Add option"
          className="w-40"
          inputSize="xs"
        />
        <Button variant="secondary" size="sm" onClick={handleAdd} loading={isSubmitting}>
          Add
        </Button>
      </div>
    </div>
  );
});
