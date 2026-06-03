/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkItemType } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { IssueTypeService } from "@/services/issue-type.service";

const issueTypeService = new IssueTypeService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  editingType: TWorkItemType | null;
  onClose: () => void;
  onSaved: () => void;
};

export const TypeFormModal = observer(function TypeFormModal(props: Props) {
  const { workspaceSlug, projectId, isOpen, editingType, onClose, onSaved } = props;
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEpic, setIsEpic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(editingType?.name ?? "");
      setDescription(editingType?.description ?? "");
      setIsEpic(editingType?.is_epic ?? false);
    }
  }, [isOpen, editingType]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingType) {
        await issueTypeService.update(workspaceSlug, projectId, editingType.id, {
          name,
          description,
          is_epic: isEpic,
        });
      } else {
        await issueTypeService.create(workspaceSlug, projectId, { name, description, is_epic: isEpic });
      }
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
          {editingType
            ? t("project_settings.work_item_types.type_modal.edit_title")
            : t("project_settings.work_item_types.type_modal.create_title")}
        </h3>
        <div>
          <label className="mb-1 block text-13 font-medium text-secondary">
            {t("project_settings.work_item_types.type_modal.name")}
          </label>
          <Input
            className="w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("project_settings.work_item_types.type_modal.name_placeholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-13 font-medium text-secondary">
            {t("project_settings.work_item_types.type_modal.description")}
          </label>
          <Input className="w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-13 text-secondary">
          <input type="checkbox" checked={isEpic} onChange={(e) => setIsEpic(e.target.checked)} />
          {t("project_settings.work_item_types.type_modal.is_epic")}
        </label>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" loading={submitting} disabled={!name.trim()} onClick={handleSubmit}>
          {t("save")}
        </Button>
      </div>
    </ModalCore>
  );
});
