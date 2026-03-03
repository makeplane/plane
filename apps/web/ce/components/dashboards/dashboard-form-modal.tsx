/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Check } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { cn } from "@plane/utils";
import { EModalPosition, EModalWidth, ModalCore, TextArea, ToggleSwitch } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";

export type DashboardFormPayload = {
  name: string;
  description: string;
  access: number;
  project_ids: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DashboardFormPayload) => Promise<void>;
  dashboard?: { name?: string; description?: string | null; access?: number; projects?: string[] } | null;
};

type FormValues = {
  name: string;
  description: string;
  // access: 0 = private, 1 = public
  access: boolean;
  project_ids: string[];
};

const defaultValues: FormValues = { name: "", description: "", access: false, project_ids: [] };

export const DashboardFormModal = observer(function DashboardFormModal({
  isOpen,
  onClose,
  onSubmit,
  dashboard,
}: Props) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { workspaceProjectIds, getProjectById } = useProject();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  const selectedProjectIds = watch("project_ids");

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      reset({
        name: dashboard?.name ?? "",
        description: dashboard?.description ?? "",
        access: dashboard?.access === 1,
        project_ids: dashboard?.projects ?? [],
      });
    }
  }, [isOpen, dashboard, reset]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const handleFormSubmit = async (formData: FormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        name: formData.name,
        description: formData.description || "",
        access: formData.access ? 1 : 0,
        project_ids: formData.project_ids,
      });
      handleClose();
    } catch {
      // Error toast handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProject = (projectId: string) => {
    const current = selectedProjectIds ?? [];
    if (current.includes(projectId)) {
      setValue(
        "project_ids",
        current.filter((id) => id !== projectId)
      );
    } else {
      setValue("project_ids", [...current, projectId]);
    }
  };

  const isEditing = !!dashboard;
  const projects = (workspaceProjectIds ?? []).map((id) => getProjectById(id)).filter(Boolean);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-color-primary">
            {isEditing ? t("analytics_dashboard.modal_title_update") : t("analytics_dashboard.modal_title_create")}
          </h3>

          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="dashboard-name" className="text-sm font-medium text-color-secondary">
              {t("analytics_dashboard.name.label")} <span className="text-color-danger-primary">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                required: t("analytics_dashboard.name_required"),
                maxLength: { value: 255, message: t("analytics_dashboard.name_max_length") },
              }}
              render={({ field }) => (
                <Input
                  id="dashboard-name"
                  {...field}
                  placeholder={t("analytics_dashboard.name.placeholder")}
                  className="w-full"
                  hasError={!!errors.name}
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal input should auto-focus for UX
                  autoFocus
                />
              )}
            />
            {errors.name && <p className="text-xs text-color-danger-primary">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="dashboard-description" className="text-sm font-medium text-color-secondary">
              {t("analytics_dashboard.description.label")}
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  id="dashboard-description"
                  {...field}
                  placeholder={t("analytics_dashboard.description_placeholder")}
                  className="w-full resize-none"
                  rows={3}
                />
              )}
            />
          </div>

          {/* Project selector */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.projects_label")}</p>
              <p className="text-xs text-color-tertiary">{t("analytics_dashboard.projects_hint")}</p>
            </div>
            <Controller
              name="project_ids"
              control={control}
              render={() => (
                <div className="max-h-40 overflow-y-auto rounded-md border border-color-subtle bg-layer-2">
                  {projects.length === 0 ? (
                    <p className="p-3 text-sm text-color-tertiary">{t("analytics_dashboard.no_projects")}</p>
                  ) : (
                    projects.map((project) => {
                      if (!project) return null;
                      const isSelected = (selectedProjectIds ?? []).includes(project.id);
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => toggleProject(project.id)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                            "hover:bg-layer-1-hover",
                            isSelected && "bg-accent-subtle"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              isSelected ? "border-accent-primary bg-accent-primary" : "border-color-strong bg-layer-2"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-color-on-color" />}
                          </span>
                          <span className="truncate text-color-primary">{project.name}</span>
                          <span className="ml-auto shrink-0 text-xs text-color-tertiary">{project.identifier}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            />
            {(selectedProjectIds ?? []).length > 0 && (
              <p className="text-xs text-color-accent-primary">
                {(selectedProjectIds ?? []).length} {t("analytics_dashboard.projects_selected")}
              </p>
            )}
          </div>

          {/* Access toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.public_access")}</p>
              <p className="text-xs text-color-tertiary">{t("analytics_dashboard.public_access_description")}</p>
            </div>
            <Controller
              name="access"
              control={control}
              render={({ field }) => (
                <ToggleSwitch value={field.value} onChange={field.onChange} size="sm" disabled={isSubmitting} />
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-color-subtle px-5 py-4">
          <Button variant="secondary" size="sm" onClick={handleClose} type="button" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isEditing ? t("analytics_dashboard.submit_update") : t("analytics_dashboard.submit_create")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
