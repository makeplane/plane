/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { observer } from "mobx-react";
import useSWR, { useSWRConfig } from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import type { TWorkItemTemplate } from "@plane/types";
import { PageHead } from "@/components/core/page-title";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useUserPermissions } from "@/hooks/store/user";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProjectIssueProperties } from "@/hooks/use-project-issue-properties";
import { WorkItemTemplateService } from "@/services/work-item-template.service";
import { LogoSpinner } from "@/components/common/logo-spinner";
import type { Route } from "./+types/page";
import { WorkItemTemplatesSettingsHeader } from "./header";
import { WorkItemTemplateDefaultValueFields } from "./work-item-template-form-fields";
import type { TWorkItemTemplateFormFields } from "./work-item-template-form.types";
import {
  buildWorkItemTemplatePayloadFromFormValues,
  mapWorkItemTemplateToFormValues,
} from "./work-item-template-payload-helpers";

const service = new WorkItemTemplateService();

const TEMPLATE_FORM_DEFAULTS: TWorkItemTemplateFormFields = {
  templateName: "",
  templateNote: "",
  projectId: null,
  workItemName: "",
  workItemDescriptionPlain: "",
  type_id: null,
  state_id: "",
  priority: "none",
  assignee_ids: [],
  label_ids: [],
  cycle_id: null,
  module_ids: null,
  estimate_point: null,
  start_date: null,
  target_date: null,
};

function WorkItemTemplatesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();
  const { mutate } = useSWRConfig();
  const lastProjectInModal = useRef<string | null | undefined>(undefined);
  const { fetchAll: fetchProjectIssueProperties } = useProjectIssueProperties();

  const canManage = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const { data: templates, isLoading } = useSWR(canManage && workspaceSlug ? `WIT_LIST_${workspaceSlug}` : null, () =>
    service.list(workspaceSlug)
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<TWorkItemTemplateFormFields>({
    defaultValues: TEMPLATE_FORM_DEFAULTS,
  });

  const { handleSubmit, control, watch, reset, setValue, formState } = form;
  const projectId = watch("projectId");

  useEffect(() => {
    if (!modalOpen) {
      reset(TEMPLATE_FORM_DEFAULTS);
      setEditingId(null);
      lastProjectInModal.current = undefined;
    }
  }, [modalOpen, reset]);

  const openCreate = () => {
    reset(TEMPLATE_FORM_DEFAULTS);
    setEditingId(null);
    lastProjectInModal.current = undefined;
    setModalOpen(true);
  };

  const openEdit = (row: TWorkItemTemplate) => {
    const values = mapWorkItemTemplateToFormValues(row);
    lastProjectInModal.current = values.projectId;
    reset(values);
    setEditingId(row.id);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen || !workspaceSlug || !projectId) return;
    void fetchProjectIssueProperties(workspaceSlug, projectId);
  }, [modalOpen, workspaceSlug, projectId, fetchProjectIssueProperties]);

  useEffect(() => {
    if (!modalOpen) return;
    if (lastProjectInModal.current === undefined) {
      lastProjectInModal.current = projectId;
      return;
    }
    if (lastProjectInModal.current !== projectId) {
      setValue("assignee_ids", [], { shouldDirty: true });
      setValue("state_id", "", { shouldDirty: true });
      setValue("label_ids", [], { shouldDirty: true });
      setValue("cycle_id", null, { shouldDirty: true });
      setValue("module_ids", null, { shouldDirty: true });
      setValue("estimate_point", null, { shouldDirty: true });
      setValue("type_id", null, { shouldDirty: true });
    }
    lastProjectInModal.current = projectId;
  }, [modalOpen, projectId, setValue]);

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.work_item_templates.title")}`
    : undefined;

  const onSubmit = handleSubmit(async (values) => {
    if (!values.templateName.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.work_item_templates.form.name_required"),
      });
      return;
    }
    const payload = buildWorkItemTemplatePayloadFromFormValues(values);
    setSaving(true);
    try {
      const body = {
        name: values.templateName.trim(),
        description: values.templateNote,
        project_id: values.projectId,
        payload,
      };
      if (editingId) {
        await service.update(workspaceSlug, editingId, body);
      } else {
        await service.create(workspaceSlug, body);
      }
      await mutate(`WIT_LIST_${workspaceSlug}`);
      setModalOpen(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.work_item_templates.toasts.saved.title"),
        message: t("workspace_settings.settings.work_item_templates.toasts.saved.message"),
      });
    } catch (e) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.work_item_templates.toasts.save_failed.title"),
        message: t("workspace_settings.settings.work_item_templates.toasts.save_failed.message"),
      });
    } finally {
      setSaving(false);
    }
  });

  const onDelete = async (id: string) => {
    if (!window.confirm(t("workspace_settings.settings.work_item_templates.delete_confirm"))) return;
    try {
      await service.remove(workspaceSlug, id);
      await mutate(`WIT_LIST_${workspaceSlug}`);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.work_item_templates.toasts.deleted.title"),
        message: t("workspace_settings.settings.work_item_templates.toasts.deleted.message"),
      });
    } catch (e) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.work_item_templates.toasts.delete_failed.title"),
        message: t("workspace_settings.settings.work_item_templates.toasts.delete_failed.message"),
      });
    }
  };

  if (!canManage) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <FormProvider {...form}>
      <SettingsContentWrapper header={<WorkItemTemplatesSettingsHeader />}>
        <PageHead title={pageTitle} />
        <ModalCore
          isOpen={modalOpen}
          handleClose={() => setModalOpen(false)}
          position={EModalPosition.CENTER}
          width={EModalWidth.VIIXL}
        >
          <form
            onSubmit={onSubmit}
            className="max-h-[min(90vh,920px)] overflow-y-auto p-5"
            id="work-item-template-create-form"
          >
            <h3 className="text-h3-medium text-primary">
              {editingId
                ? t("workspace_settings.settings.work_item_templates.edit_template")
                : t("workspace_settings.settings.work_item_templates.add_template")}
            </h3>
            <p className="pt-1 pb-4 text-13 text-tertiary">
              {t("workspace_settings.settings.work_item_templates.form.modal_intro")}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-12 text-tertiary" htmlFor="work-item-template-name">
                  {t("workspace_settings.settings.work_item_templates.form.template_name_label")}
                </label>
                <Controller
                  name="templateName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="work-item-template-name"
                      className="mt-1 w-full"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("workspace_settings.settings.work_item_templates.form.template_name_placeholder")}
                    />
                  )}
                />
              </div>
              <div>
                <label className="text-12 text-tertiary" htmlFor="work-item-template-note">
                  {t("workspace_settings.settings.work_item_templates.form.template_note_label")}
                </label>
                <Controller
                  name="templateNote"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      id="work-item-template-note"
                      className="mt-1 min-h-[100px] w-full resize-y"
                      value={field.value}
                      onChange={field.onChange}
                      rows={3}
                      placeholder={t("workspace_settings.settings.work_item_templates.form.template_note_placeholder")}
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-12 text-tertiary">
                  {t("workspace_settings.settings.work_item_templates.table.project")}
                </label>
                <p className="pt-0.5 pb-1 text-11 text-tertiary">
                  {t("workspace_settings.settings.work_item_templates.form.scope_hint_short")}
                </p>
                <div className="mt-1 h-8 max-w-sm">
                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <ProjectDropdown
                        value={field.value}
                        onChange={(pid) => field.onChange(pid || null)}
                        multiple={false}
                        buttonVariant="border-with-text"
                      />
                    )}
                  />
                </div>
              </div>
              <WorkItemTemplateDefaultValueFields
                control={control}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" variant="primary" disabled={saving || formState.isSubmitting} loading={saving}>
                  {editingId ? t("save_changes") : t("add")}
                </Button>
              </div>
            </div>
          </form>
        </ModalCore>
        <div className="w-full">
          <SettingsHeading
            title={t("workspace_settings.settings.work_item_templates.title")}
            description={t("workspace_settings.settings.work_item_templates.description")}
            control={
              <Button variant="primary" size="lg" onClick={openCreate}>
                {t("workspace_settings.settings.work_item_templates.add_template")}
              </Button>
            }
          />
          {isLoading || !templates ? (
            <div className="flex justify-center py-8">
              <LogoSpinner />
            </div>
          ) : !templates || templates.length === 0 ? (
            <p className="py-4 text-13 text-tertiary">{t("no_data_yet")}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-md border border-subtle">
              <table className="w-full min-w-96 text-left text-13">
                <thead className="bg-surface-1 text-tertiary">
                  <tr>
                    <th className="p-2 font-medium">
                      {t("workspace_settings.settings.work_item_templates.table.name")}
                    </th>
                    <th className="p-2 font-medium">
                      {t("workspace_settings.settings.work_item_templates.table.scope")}
                    </th>
                    <th className="w-40 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {(templates as TWorkItemTemplate[]).map((row) => (
                    <tr key={row.id} className="border-t border-subtle">
                      <td className="p-2 font-medium text-primary">{row.name}</td>
                      <td className="p-2 text-secondary">
                        {row.project_id
                          ? (getProjectById(row.project_id)?.name ?? row.project_id)
                          : t("workspace_settings.settings.work_item_templates.table.workspace_wide")}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                            {t("edit")}
                          </Button>
                          <Button variant="error-outline" size="sm" onClick={() => onDelete(row.id)}>
                            {t("remove")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SettingsContentWrapper>
    </FormProvider>
  );
}

export default observer(WorkItemTemplatesPage);
