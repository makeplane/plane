/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Plus, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssuePropertyType, EIssuePropertyRelationType, type TIssuePropertyCreatePayload } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { IssueTypeService } from "@/services/issue-type.service";

const issueTypeService = new IssueTypeService();

const PROPERTY_TYPE_ORDER: EIssuePropertyType[] = [
  EIssuePropertyType.TEXT,
  EIssuePropertyType.DECIMAL,
  EIssuePropertyType.OPTION,
  EIssuePropertyType.BOOLEAN,
  EIssuePropertyType.DATETIME,
  EIssuePropertyType.RELATION,
  EIssuePropertyType.URL,
];

type Props = {
  workspaceSlug: string;
  projectId: string;
  typeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export const PropertyFormModal = observer(function PropertyFormModal(props: Props) {
  const { workspaceSlug, projectId, typeId, isOpen, onClose, onSaved } = props;
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState<EIssuePropertyType>(EIssuePropertyType.TEXT);
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isMulti, setIsMulti] = useState(false);
  const [options, setOptions] = useState<{ id: number; name: string }[]>([{ id: 0, name: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const nextOptionId = useRef(1);

  useEffect(() => {
    if (isOpen) {
      setDisplayName("");
      setDescription("");
      setPropertyType(EIssuePropertyType.TEXT);
      setIsRequired(false);
      setIsActive(true);
      setIsMulti(false);
      setOptions([{ id: 0, name: "" }]);
      nextOptionId.current = 1;
    }
  }, [isOpen]);

  const supportsMulti = propertyType === EIssuePropertyType.OPTION || propertyType === EIssuePropertyType.RELATION;
  const isOptionType = propertyType === EIssuePropertyType.OPTION;
  // Booleans cannot be required (matching Plane cloud)
  const canBeRequired = propertyType !== EIssuePropertyType.BOOLEAN;

  const handleSubmit = async () => {
    if (!displayName.trim()) return;
    const cleanOptions = options.map((o) => o.name.trim()).filter(Boolean);
    if (isOptionType && cleanOptions.length === 0) return;
    setSubmitting(true);
    const payload: TIssuePropertyCreatePayload = {
      name: displayName.trim(),
      display_name: displayName.trim(),
      description,
      property_type: propertyType,
      relation_type: propertyType === EIssuePropertyType.RELATION ? EIssuePropertyRelationType.USER : null,
      is_required: canBeRequired ? isRequired : false,
      is_active: isActive,
      is_multi: supportsMulti ? isMulti : false,
      options: isOptionType ? cleanOptions.map((name) => ({ name })) : undefined,
    };
    try {
      await issueTypeService.createProperty(workspaceSlug, projectId, typeId, payload);
      onSaved();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("project_settings.work_item_types.toasts.error"), message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="space-y-4 p-5">
        <h3 className="text-18 font-medium text-secondary">
          {t("project_settings.work_item_types.property_modal.create_title")}
        </h3>
        <div>
          <label className="mb-1 block text-13 font-medium text-secondary">
            {t("project_settings.work_item_types.property_modal.name")}
          </label>
          <Input
            className="w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("project_settings.work_item_types.property_modal.name_placeholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-13 font-medium text-secondary">
            {t("project_settings.work_item_types.property_modal.type")}
          </label>
          <select
            className="w-full rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-secondary"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as EIssuePropertyType)}
          >
            {PROPERTY_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {t(`project_settings.work_item_types.property_types.${type}`)}
              </option>
            ))}
          </select>
        </div>

        {isOptionType && (
          <div>
            <label className="mb-1 block text-13 font-medium text-secondary">
              {t("project_settings.work_item_types.property_modal.options")}
            </label>
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    className="w-full"
                    value={option.name}
                    onChange={(e) =>
                      setOptions(options.map((o) => (o.id === option.id ? { ...o, name: e.target.value } : o)))
                    }
                    placeholder={t("project_settings.work_item_types.property_modal.option_placeholder")}
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      className="text-tertiary hover:text-danger-primary"
                      onClick={() => setOptions(options.filter((o) => o.id !== option.id))}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="tertiary"
                size="sm"
                prependIcon={<Plus className="size-3" />}
                onClick={() => setOptions([...options, { id: nextOptionId.current++, name: "" }])}
              >
                {t("project_settings.work_item_types.property_modal.add_option")}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {canBeRequired && (
            <label className="flex items-center gap-2 text-13 text-secondary">
              <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
              {t("project_settings.work_item_types.property_modal.required")}
            </label>
          )}
          {supportsMulti && (
            <label className="flex items-center gap-2 text-13 text-secondary">
              <input type="checkbox" checked={isMulti} onChange={(e) => setIsMulti(e.target.checked)} />
              {t("project_settings.work_item_types.property_modal.multi")}
            </label>
          )}
          <label className="flex items-center gap-2 text-13 text-secondary">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t("project_settings.work_item_types.property_modal.active")}
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" loading={submitting} disabled={!displayName.trim()} onClick={handleSubmit}>
          {t("save")}
        </Button>
      </div>
    </ModalCore>
  );
});
