/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssuePropertyType, type TIssueProperty, type TWorkItemType } from "@plane/types";
import { Loader } from "@plane/ui";
// services
import { IssueTypeService } from "@/services/issue-type.service";
// local imports
import { PropertyFormModal } from "./property-form-modal";
import { TypeFormModal } from "./type-form-modal";

const issueTypeService = new IssueTypeService();

const TYPES_KEY = (slug: string, projectId: string) => `WORK_ITEM_TYPES_${slug}_${projectId}`;
const PROPS_KEY = (slug: string, projectId: string, typeId: string) =>
  `WORK_ITEM_TYPE_PROPS_${slug}_${projectId}_${typeId}`;

type Props = { workspaceSlug: string; projectId: string };

export const WorkItemTypesRoot = observer(function WorkItemTypesRoot({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TWorkItemType | null>(null);
  const [propertyModalFor, setPropertyModalFor] = useState<string | null>(null);
  const [enabling, setEnabling] = useState(false);

  const { data: types, isLoading } = useSWR<TWorkItemType[]>(TYPES_KEY(workspaceSlug, projectId), () =>
    issueTypeService.list(workspaceSlug, projectId)
  );

  const refreshTypes = () => mutate(TYPES_KEY(workspaceSlug, projectId));

  const handleEnable = async () => {
    setEnabling(true);
    try {
      await issueTypeService.enable(workspaceSlug, projectId);
      await refreshTypes();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("project_settings.work_item_types.toasts.error"), message: "" });
    } finally {
      setEnabling(false);
    }
  };

  const handleDeleteType = async (type: TWorkItemType) => {
    if (!window.confirm(t("project_settings.work_item_types.delete_type_confirm"))) return;
    try {
      await issueTypeService.destroy(workspaceSlug, projectId, type.id);
      await refreshTypes();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("project_settings.work_item_types.toasts.error"), message: "" });
    }
  };

  if (isLoading) {
    return (
      <Loader className="space-y-3">
        <Loader.Item height="44px" />
        <Loader.Item height="44px" />
      </Loader>
    );
  }

  // Not enabled yet (no types mapped to this project)
  if (!types?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-subtle bg-surface-1 p-8 text-center">
        <h4 className="text-14 font-medium text-secondary">{t("project_settings.work_item_types.enable.title")}</h4>
        <p className="max-w-md text-12 text-tertiary">{t("project_settings.work_item_types.enable.description")}</p>
        <Button variant="primary" loading={enabling} onClick={handleEnable}>
          {t("project_settings.work_item_types.enable.cta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="primary"
          size="sm"
          prependIcon={<Plus className="size-3" />}
          onClick={() => {
            setEditingType(null);
            setTypeModalOpen(true);
          }}
        >
          {t("project_settings.work_item_types.add_type")}
        </Button>
      </div>

      <div className="divide-y divide-subtle rounded-lg border border-subtle">
        {types.map((type) => (
          <WorkItemTypeRow
            key={type.id}
            type={type}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            expanded={expanded === type.id}
            onToggle={() => setExpanded(expanded === type.id ? null : type.id)}
            onEdit={() => {
              setEditingType(type);
              setTypeModalOpen(true);
            }}
            onDelete={() => handleDeleteType(type)}
            onAddProperty={() => setPropertyModalFor(type.id)}
          />
        ))}
      </div>

      <TypeFormModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={typeModalOpen}
        editingType={editingType}
        onClose={() => setTypeModalOpen(false)}
        onSaved={refreshTypes}
      />

      {propertyModalFor && (
        <PropertyFormModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          typeId={propertyModalFor}
          isOpen={Boolean(propertyModalFor)}
          onClose={() => setPropertyModalFor(null)}
          onSaved={() => mutate(PROPS_KEY(workspaceSlug, projectId, propertyModalFor))}
        />
      )}
    </div>
  );
});

type RowProps = {
  type: TWorkItemType;
  workspaceSlug: string;
  projectId: string;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddProperty: () => void;
};

const WorkItemTypeRow = observer(function WorkItemTypeRow(props: RowProps) {
  const { type, workspaceSlug, projectId, expanded, onToggle, onEdit, onDelete, onAddProperty } = props;
  const { t } = useTranslation();

  const { data: properties } = useSWR<TIssueProperty[]>(
    expanded ? PROPS_KEY(workspaceSlug, projectId, type.id) : null,
    expanded ? () => issueTypeService.listProperties(workspaceSlug, projectId, type.id) : null
  );

  const handleDeleteProperty = async (property: TIssueProperty) => {
    if (!window.confirm(t("project_settings.work_item_types.delete_property_confirm"))) return;
    try {
      await issueTypeService.destroyProperty(workspaceSlug, projectId, type.id, property.id);
      mutate(PROPS_KEY(workspaceSlug, projectId, type.id));
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("project_settings.work_item_types.toasts.error"), message: "" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" className="flex items-center gap-2 text-secondary" onClick={onToggle}>
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span className="text-13 font-medium">{type.name}</span>
          {type.is_default && (
            <span className="rounded bg-layer-1 px-1.5 py-0.5 text-10 text-tertiary">
              {t("project_settings.work_item_types.default_badge")}
            </span>
          )}
          {type.is_epic && (
            <span className="rounded bg-accent-primary/10 px-1.5 py-0.5 text-10 text-accent-primary">
              {t("project_settings.work_item_types.epic_badge")}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="tertiary" size="sm" onClick={onEdit}>
            {t("edit")}
          </Button>
          {!type.is_default && (
            <button type="button" className="text-tertiary hover:text-danger-primary" onClick={onDelete}>
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-subtle bg-surface-1 px-4 py-3">
          {properties?.length ? (
            properties.map((property) => (
              <div key={property.id} className="flex items-center justify-between rounded-md bg-layer-1 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-13 text-secondary">{property.display_name}</span>
                  <span className="text-10 text-tertiary uppercase">
                    {t(`project_settings.work_item_types.property_types.${property.property_type}`)}
                  </span>
                  {property.is_required && <span className="text-10 text-danger-primary">*</span>}
                </div>
                <button
                  type="button"
                  className="text-tertiary hover:text-danger-primary"
                  onClick={() => handleDeleteProperty(property)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-12 text-tertiary">{t("project_settings.work_item_types.no_properties")}</p>
          )}
          <Button variant="tertiary" size="sm" prependIcon={<Plus className="size-3" />} onClick={onAddProperty}>
            {t("project_settings.work_item_types.add_property")}
          </Button>
        </div>
      )}
    </div>
  );
});

export { EIssuePropertyType };
