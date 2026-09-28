/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { IWorkflowDetail, TWorkflowCreatePayload } from "@plane/types";
import { Input, ModalCore, TextArea } from "@plane/ui";
// helpers
import { getWorkflowErrorMessage } from "@/utils/workflow-error";

type TWorkflowFormProps = {
  /** Present when editing; omit to create. */
  workflow?: IWorkflowDetail | null;
  onClose: () => void;
  onSubmit: (data: TWorkflowCreatePayload) => Promise<unknown>;
};

export const WorkflowForm = observer(function WorkflowForm(props: TWorkflowFormProps) {
  const { workflow, onClose, onSubmit } = props;
  const { t } = useTranslation();

  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const isUpdating = Boolean(workflow);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError(t("project_settings.workflows.create.name.validation.required"));
      return;
    }
    if (name.length > 255) {
      setNameError(t("project_settings.workflows.create.name.validation.max_length"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(
          isUpdating
            ? "project_settings.workflows.update.success.title"
            : "project_settings.workflows.create.success.title"
        ),
        message: t(
          isUpdating
            ? "project_settings.workflows.update.success.message"
            : "project_settings.workflows.create.success.message"
        ),
      });
      onClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t(
          isUpdating ? "project_settings.workflows.update.error.title" : "project_settings.workflows.create.error.title"
        ),
        // §23.5 — show the backend's message rather than a generic one.
        message: getWorkflowErrorMessage(
          error,
          t(
            isUpdating
              ? "project_settings.workflows.update.error.message"
              : "project_settings.workflows.create.error.message"
          )
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-surface-1 p-5">
        <h3 className="text-16 font-medium text-primary">{t("project_settings.workflows.create.heading")}</h3>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="workflow-name" className="text-13 font-medium text-secondary">
              {t("common.name")}
            </label>
            <Input
              id="workflow-name"
              name="name"
              type="text"
              maxLength={255}
              value={name}
              hasError={Boolean(nameError)}
              placeholder={t("project_settings.workflows.create.name.placeholder")}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(undefined);
              }}
            />
            {nameError && <span className="text-13 text-danger-primary">{nameError}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="workflow-description" className="text-13 font-medium text-secondary">
              {t("common.description")}
            </label>
            <TextArea
              id="workflow-description"
              name="description"
              value={description}
              className="min-h-20 w-full resize-none"
              placeholder={t("project_settings.workflows.create.description.placeholder")}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isUpdating ? t("common.update") : t("common.add")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
