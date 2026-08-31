/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useProjectCustomField } from "@/hooks/store/use-project-custom-field";

type Props = {
  workspaceSlug: string;
  projectId: string;
  fieldId: string;
  disabled: boolean;
};

export const ProjectCustomFieldOptionsEditor = observer(function ProjectCustomFieldOptionsEditor(props: Props) {
  const { workspaceSlug, projectId, fieldId, disabled } = props;
  const [newOptionName, setNewOptionName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();
  const { getFieldOptions, createFieldOption, deleteFieldOption } = useProjectCustomField();
  const options = getFieldOptions(fieldId);

  const handleAdd = async () => {
    if (!newOptionName.trim() || isAdding) return;
    setIsAdding(true);
    await createFieldOption(workspaceSlug, projectId, fieldId, newOptionName.trim())
      .then(() => setNewOptionName(""))
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_custom_field.settings.toasts.create.error.title"),
          message: t("project_custom_field.settings.toasts.option_create.error.message"),
        });
      })
      .finally(() => setIsAdding(false));
  };

  const handleDelete = async (optionId: string) => {
    await deleteFieldOption(workspaceSlug, projectId, fieldId, optionId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_custom_field.settings.toasts.delete.error.title"),
        message: t("project_custom_field.settings.toasts.option_delete.error.message"),
      });
    });
  };

  return (
    <div className="flex w-full items-center gap-3 pb-2">
      {/* Spacer matching the field-name column's width in the row above, so the
          options line up under the value column instead of a computed offset that
          would drift if that row's width/gap classes ever change. */}
      <div className="w-1/3 flex-shrink-0" aria-hidden="true" />
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {options?.map((option) => (
          <span
            key={option.id}
            className="flex items-center gap-1 rounded-sm border border-subtle bg-surface-2 px-2 py-0.5 text-body-xs-regular text-secondary"
          >
            {option.name}
            {!disabled && (
              <button type="button" onClick={() => handleDelete(option.id)} className="text-tertiary hover:text-danger-primary">
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <InputGroup size="sm" className="w-32">
            <Input
              size="sm"
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder={t("project_custom_field.settings.options.add_placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              onBlur={handleAdd}
            />
          </InputGroup>
        )}
      </div>
    </div>
  );
});
