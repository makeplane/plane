/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm, useFieldArray } from "react-hook-form";
// plane imports
import { getRandomLabelColor, WORKSPACE_PROJECT_TEMPLATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectTemplate, TProjectTemplateStateGroup } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// services
import { ProjectService } from "@/services/project";
// local imports
import type { TProjectTemplateForm } from "../utils";
import { assemblePayload, emptyTemplatePayload, mapProjectTemplateErrors } from "../utils";
import { LabelsSection, StatesSection } from "./";

type TProjectTemplateEditorRoot = {
  workspaceSlug: string;
  /** Distinguishes create from edit and from view-only-mode. */
  mode: "create" | "edit";
  templateId?: string;
  /** Optional prefilled data (for edit; null while SWR is still loading). */
  initialTemplate?: TProjectTemplate | null;
  /** When true (built-in templates) the entire form is disabled. */
  readOnly?: boolean;
};

const projectService = new ProjectService();

/**
 * Build default values from an optional fetched template. When no template is
 * passed (create mode or still loading on edit) we seed one default state so
 * the form is never empty on first paint.
 */
function buildDefaults(initialTemplate?: TProjectTemplate | null): TProjectTemplateForm {
  if (!initialTemplate) {
    return {
      name: "",
      description: "",
      payload: {
        ...emptyTemplatePayload(),
        states: [
          {
            state_key: "",
            name: "",
            color: getRandomLabelColor(),
            group: "backlog" as TProjectTemplateStateGroup,
            default: true,
          },
        ],
      },
    };
  }
  const states = (initialTemplate.payload?.states ?? []).map((s) => ({
    state_key: s.state_key,
    name: s.name,
    color: s.color,
    group: s.group,
    default: s.default === true,
  }));
  const labels = (initialTemplate.payload?.labels ?? []).map((l) => ({
    label_key: l.label_key,
    name: l.name,
    color: l.color,
  }));
  // Ensure exactly one default exists in the form (backend will reject 0 or 2+).
  const defaultCount = states.filter((s) => s.default === true).length;
  let normalisedStates = states;
  if (defaultCount !== 1) {
    normalisedStates = states.map((s, idx) => Object.assign({}, s, { default: idx === 0 }));
  }
  return {
    name: initialTemplate.name ?? "",
    description: initialTemplate.description ?? "",
    payload: {
      states: normalisedStates,
      labels,
      modules: [],
      cycles: [],
      starter_issues: [],
    },
  };
}

/**
 * Full-page editor for project templates.
 *
 * Drives:
 *   - top block (name + description via Controller)
 *   - <StatesSection />, <LabelsSection /> (Phase 1 of the editor)
 *   - footer action bar (Cancel + Save template)
 *
 * On submit (D-10): assembles the form into the backend payload shape via
 * `assemblePayload`, POSTs (create) or PATCHes (edit) through `ProjectService`,
 * mutates the list SWR key, surfaces a toast, and navigates back to the list.
 *
 * Error surface (RESEARCH Pitfall 7 / D-12 / D-09):
 *   - per-section inline messages via `mapProjectTemplateErrors`
 *   - generic toast fallback for anything the mapper can't classify.
 */
export const ProjectTemplateEditorRoot = observer(function ProjectTemplateEditorRoot(
  props: TProjectTemplateEditorRoot
) {
  const { workspaceSlug, mode, templateId, initialTemplate, readOnly = false } = props;
  const router = useRouter();
  const { t } = useTranslation();

  const initialDefaults = useMemo(() => buildDefaults(initialTemplate), [initialTemplate]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
    watch,
    clearErrors,
  } = useForm<TProjectTemplateForm>({
    defaultValues: initialDefaults,
  });

  // Backend-section error messages (from `mapProjectTemplateErrors`). Lifted
  // into local state so we can pass them through to section components without
  // trying to index into RHF's `FieldErrors<TForm>` nested shape.
  const [backendMessages, setBackendMessages] = useState<Record<string, string>>({});

  // Reset the form when the fetched template lands (edit page SWR resolves).
  useEffect(() => {
    if (mode === "edit" && initialTemplate) {
      reset(buildDefaults(initialTemplate));
    }
  }, [initialTemplate, mode, reset]);

  const states = useFieldArray({ control, name: "payload.states" });
  const labels = useFieldArray({ control, name: "payload.labels" });

  const name = watch("name");
  const watchedStates = watch("payload.states");
  const watchedLabels = watch("payload.labels");

  // Client guards (UI-SPEC Interaction Contracts). Backend remains authoritative.
  const clientErrors = useMemo(() => {
    const errs: { states?: string; labels?: string; submit?: string } = {};
    const stateNames = (watchedStates ?? []).map((s) => (s.name ?? "").trim()).filter(Boolean);
    if (stateNames.length === 0)
      errs.states = t("workspace_settings.settings.project_templates.editor.name_required_inline");
    if (new Set(stateNames).size !== stateNames.length) {
      errs.states = t("workspace_settings.settings.project_templates.editor.duplicate_state_name");
    }
    const defaultCount = (watchedStates ?? []).filter((s) => s.default === true).length;
    if (stateNames.length > 0 && defaultCount !== 1) {
      errs.states = t("workspace_settings.settings.project_templates.editor.no_default_state");
    }
    const labelNames = (watchedLabels ?? []).map((l) => (l.name ?? "").trim()).filter(Boolean);
    if (labelNames.length > 0 && new Set(labelNames).size !== labelNames.length) {
      errs.labels = t("workspace_settings.settings.project_templates.editor.duplicate_label_name");
    }
    return errs;
  }, [watchedStates, watchedLabels, t]);

  const isInvalid =
    (name ?? "").trim().length === 0 || (name ?? "").length > 255 || !!clientErrors.states || !!clientErrors.labels;

  const handleCancel = () => {
    router.push(`/${workspaceSlug}/settings/templates`);
  };

  const onSubmit: SubmitHandler<TProjectTemplateForm> = async (formData) => {
    if (isSubmitting || readOnly) return;
    clearErrors();

    try {
      const payload = assemblePayload(formData);
      const fullPayload = {
        name: (formData.name ?? "").trim(),
        description: (formData.description ?? "").toString(),
        template_type: "custom" as const,
        payload,
      };

      if (mode === "create") {
        await projectService.createProjectTemplate(workspaceSlug, fullPayload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.project_templates.editor.created_toast"),
          message: t("workspace_settings.settings.project_templates.editor.created_toast"),
        });
      } else if (mode === "edit" && templateId) {
        await projectService.updateProjectTemplate(workspaceSlug, templateId, fullPayload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.project_templates.editor.updated_toast"),
          message: t("workspace_settings.settings.project_templates.editor.updated_toast"),
        });
      }

      await mutate(WORKSPACE_PROJECT_TEMPLATES(workspaceSlug));
      router.push(`/${workspaceSlug}/settings/templates`);
    } catch (error) {
      const { perSection, generalFallback } = mapProjectTemplateErrors(error);
      const updated: Record<string, string> = {};
      if (perSection.states) updated.states = perSection.states;
      if (perSection.labels) updated.labels = perSection.labels;
      if (perSection.modules) updated.modules = perSection.modules;
      if (perSection.cycles) updated.cycles = perSection.cycles;
      if (perSection.starter_issues) updated.starter_issues = perSection.starter_issues;
      setBackendMessages(updated);
      if (perSection.name) setError("name", { message: perSection.name });
      void errors; // keep dependency quiet — backend messages flow through state

      const message = generalFallback ?? t("workspace_settings.settings.project_templates.editor.save_error_generic");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-6 pb-24">
      {readOnly && (
        <div className="rounded-md border border-subtle bg-layer-1 px-4 py-2 text-body-xs-regular text-secondary">
          {t("workspace_settings.settings.project_templates.editor.view_only_notice")}
        </div>
      )}

      {/* Top block: name + description */}
      <div className="flex flex-col gap-4">
        <Controller
          control={control}
          name="name"
          rules={{
            required: t("workspace_settings.settings.project_templates.editor.name_required"),
            maxLength: {
              value: 255,
              message: t("workspace_settings.settings.project_templates.editor.name_max_length"),
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-col gap-1">
              <label className="text-body-xs-regular text-secondary">
                {t("workspace_settings.settings.project_templates.editor.name_label")}
              </label>
              <Input
                {...field}
                value={field.value ?? ""}
                hasError={Boolean(error || errors.name)}
                placeholder={t("workspace_settings.settings.project_templates.editor.name_placeholder")}
                disabled={readOnly}
              />
              {error?.message && <p className="text-body-xs-regular text-danger-primary">{error.message}</p>}
            </div>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-body-xs-regular text-secondary">
                {t("workspace_settings.settings.project_templates.editor.description_label")}
              </label>
              <TextArea
                {...field}
                value={field.value ?? ""}
                placeholder={t("workspace_settings.settings.project_templates.editor.description_placeholder")}
                disabled={readOnly}
              />
            </div>
          )}
        />
      </div>

      {/* Sections — Phase 1: States + Labels (Plan 04 adds the other three) */}
      <StatesSection
        control={control}
        array={states}
        disabled={readOnly}
        clientError={clientErrors.states}
        backendError={backendMessages.states}
      />

      <LabelsSection
        control={control}
        array={labels}
        disabled={readOnly}
        clientError={clientErrors.labels}
        backendError={backendMessages.labels}
      />

      {/* Footer action bar */}
      <div className="-mx-page-x sticky bottom-0 flex items-center justify-end gap-3 border-t border-subtle bg-surface-1 px-page-x py-4 lg:-mx-12 lg:px-12">
        <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
            if (isSubmitting) return;
            void handleSubmit(onSubmit)();
          }}
          loading={isSubmitting}
          disabled={readOnly || isSubmitting || isInvalid}
        >
          {isSubmitting
            ? mode === "create"
              ? t("workspace_settings.settings.project_templates.editor.save_template_creating")
              : t("workspace_settings.settings.project_templates.editor.save_template_saving")
            : t("workspace_settings.settings.project_templates.editor.save_template")}
        </Button>
      </div>
    </div>
  );
});
