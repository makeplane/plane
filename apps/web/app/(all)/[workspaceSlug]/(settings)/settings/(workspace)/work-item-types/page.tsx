/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { observer } from "mobx-react";
import useSWR, { useSWRConfig } from "swr";
import { Layers } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { TChangeHandlerProps } from "@plane/propel/emoji-icon-picker";
import { EmojiIconPickerTypes, EmojiPicker, Logo } from "@plane/propel/emoji-icon-picker";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea, ToggleSwitch } from "@plane/ui";
import type { TIssueType } from "@plane/types";
import { PageHead } from "@/components/core/page-title";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useUserPermissions } from "@/hooks/store/user";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { IssueTypeService } from "@/services/issue-type.service";
import { LogoSpinner } from "@/components/common/logo-spinner";
import type { Route } from "./+types/page";
import { WorkItemTypesSettingsHeader } from "./header";
import { WorkItemTypePropertyEditor } from "./work-item-type-property-editor";
import { DEFAULT_WORK_ITEM_TYPE_FORM, type TWorkItemTypeFormFields } from "./work-item-type-form.types";
import { buildIssueTypePayloadFromForm, mapIssueTypeToFormValues } from "./work-item-type-payload-helpers";

const service = new IssueTypeService();

function WorkItemTypesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();
  const { mutate } = useSWRConfig();

  const canManage = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const listKey = canManage && workspaceSlug ? `ISSUE_TYPES_${workspaceSlug}` : null;
  const { data: issueTypes, isLoading } = useSWR(listKey, () => service.listWorkspaceTypes(workspaceSlug));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);

  const form = useForm<TWorkItemTypeFormFields>({
    defaultValues: DEFAULT_WORK_ITEM_TYPE_FORM,
  });

  const { handleSubmit, control, reset, watch, setValue, formState } = form;
  const properties = watch("properties");

  useEffect(() => {
    if (!modalOpen) {
      reset(DEFAULT_WORK_ITEM_TYPE_FORM);
      setEditingId(null);
    }
  }, [modalOpen, reset]);

  const openCreate = () => {
    reset(DEFAULT_WORK_ITEM_TYPE_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (row: TIssueType) => {
    reset(mapIssueTypeToFormValues(row));
    setEditingId(row.id);
    setModalOpen(true);
  };

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.work_item_types.title")}`
    : undefined;

  const onSubmit = handleSubmit(async (values) => {
    if (!values.name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.work_item_types.form.name_required"),
      });
      return;
    }
    const payload = buildIssueTypePayloadFromForm(values);
    setSaving(true);
    try {
      if (editingId) {
        await service.updateWorkspaceType(workspaceSlug, editingId, payload);
      } else {
        await service.createWorkspaceType(workspaceSlug, payload);
      }
      await mutate(listKey);
      setModalOpen(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.work_item_types.toasts.saved.title"),
        message: t("workspace_settings.settings.work_item_types.toasts.saved.message"),
      });
    } catch (e) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.work_item_types.toasts.save_failed.title"),
        message: t("workspace_settings.settings.work_item_types.toasts.save_failed.message"),
      });
    } finally {
      setSaving(false);
    }
  });

  const onToggleActive = async (row: TIssueType) => {
    try {
      await service.updateWorkspaceType(workspaceSlug, row.id, { is_active: !row.is_active });
      await mutate(listKey);
    } catch (e) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.work_item_types.toasts.save_failed.message"),
      });
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm(t("workspace_settings.settings.work_item_types.delete_confirm"))) return;
    try {
      await service.removeWorkspaceType(workspaceSlug, id);
      await mutate(listKey);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.work_item_types.toasts.deleted.title"),
        message: t("workspace_settings.settings.work_item_types.toasts.deleted.message"),
      });
    } catch (e) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.work_item_types.toasts.delete_failed.title"),
        message: t("workspace_settings.settings.work_item_types.toasts.delete_failed.message"),
      });
    }
  };

  if (!canManage) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <FormProvider {...form}>
      <SettingsContentWrapper header={<WorkItemTypesSettingsHeader />}>
        <PageHead title={pageTitle} />
        <ModalCore
          isOpen={modalOpen}
          handleClose={() => setModalOpen(false)}
          position={EModalPosition.CENTER}
          width={EModalWidth.VIIXL}
        >
          <form onSubmit={onSubmit} className="max-h-[min(90vh,920px)] overflow-y-auto p-5">
            <h3 className="text-h3-medium text-primary">
              {editingId
                ? t("workspace_settings.settings.work_item_types.edit_type")
                : t("workspace_settings.settings.work_item_types.add_type")}
            </h3>
            <p className="pt-1 pb-4 text-13 text-tertiary">
              {t("workspace_settings.settings.work_item_types.form.modal_intro")}
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Controller
                  name="logoProps"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <EmojiPicker
                      iconType="material"
                      closeOnSelect={false}
                      isOpen={logoPickerOpen}
                      handleToggle={(open: boolean) => setLogoPickerOpen(open)}
                      className="flex shrink-0 items-center justify-center"
                      buttonClassName="flex h-10 w-10 items-center justify-center rounded-md border border-subtle bg-surface-2"
                      label={<Logo logo={value} size={20} />}
                      onChange={(val: TChangeHandlerProps) => {
                        let logoValue = {};
                        if (val?.type === "emoji") logoValue = { value: val.value };
                        else if (val?.type === "icon") logoValue = val.value;
                        onChange({
                          in_use: val?.type,
                          [val?.type]: logoValue,
                        });
                        setLogoPickerOpen(false);
                      }}
                      defaultIconColor={value?.in_use === "icon" ? value?.icon?.color : undefined}
                      defaultOpen={value?.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON}
                    />
                  )}
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className="text-12 text-tertiary" htmlFor="work-item-type-name">
                      {t("workspace_settings.settings.work_item_types.form.name_label")}
                    </label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="work-item-type-name"
                          className="mt-1 w-full"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-12 text-tertiary" htmlFor="work-item-type-description">
                      {t("workspace_settings.settings.work_item_types.form.description_label")}
                    </label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextArea
                          id="work-item-type-description"
                          className="mt-1 min-h-[80px] w-full resize-y"
                          rows={3}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-13 text-secondary">
                  <Controller
                    name="isEpic"
                    control={control}
                    render={({ field }) => <ToggleSwitch value={field.value} onChange={field.onChange} size="sm" />}
                  />
                  {t("workspace_settings.settings.work_item_types.form.is_epic")}
                </label>
                <label className="flex items-center gap-2 text-13 text-secondary">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => <ToggleSwitch value={field.value} onChange={field.onChange} size="sm" />}
                  />
                  {t("workspace_settings.settings.work_item_types.form.is_active")}
                </label>
              </div>
              <div>
                <label className="block text-12 text-tertiary">
                  {t("workspace_settings.settings.work_item_types.form.projects_label")}
                </label>
                <p className="pt-0.5 pb-1 text-11 text-tertiary">
                  {t("workspace_settings.settings.work_item_types.form.projects_hint")}
                </p>
                <div className="mt-1 h-8 max-w-md">
                  <Controller
                    name="projectIds"
                    control={control}
                    render={({ field }) => (
                      <ProjectDropdown
                        value={field.value}
                        onChange={(ids) => field.onChange(Array.isArray(ids) ? ids : ids ? [ids] : [])}
                        multiple
                        buttonVariant="border-with-text"
                      />
                    )}
                  />
                </div>
              </div>
              <div className="rounded-md border border-subtle bg-surface-1 p-3">
                <h4 className="pb-2 text-14 font-medium text-primary">
                  {t("workspace_settings.settings.work_item_types.form.properties_heading")}
                </h4>
                <WorkItemTypePropertyEditor
                  properties={properties}
                  onChange={(next) => setValue("properties", next, { shouldDirty: true })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" variant="primary" disabled={saving || formState.isSubmitting} loading={saving}>
                  {editingId ? t("update") : t("add")}
                </Button>
              </div>
            </div>
          </form>
        </ModalCore>
        <div className="w-full">
          <SettingsHeading
            title={t("workspace_settings.settings.work_item_types.title")}
            description={t("workspace_settings.settings.work_item_types.description")}
            control={
              <Button variant="primary" size="lg" onClick={openCreate}>
                {t("workspace_settings.settings.work_item_types.add_type")}
              </Button>
            }
          />
          {isLoading || !issueTypes ? (
            <div className="flex justify-center py-8">
              <LogoSpinner />
            </div>
          ) : issueTypes.length === 0 ? (
            <p className="py-4 text-13 text-tertiary">{t("no_data_yet")}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-md border border-subtle">
              <table className="w-full min-w-[40rem] text-left text-13">
                <thead className="bg-surface-1 text-tertiary">
                  <tr>
                    <th className="p-2 font-medium">{t("workspace_settings.settings.work_item_types.table.name")}</th>
                    <th className="p-2 font-medium">
                      {t("workspace_settings.settings.work_item_types.table.properties")}
                    </th>
                    <th className="p-2 font-medium">
                      {t("workspace_settings.settings.work_item_types.table.projects")}
                    </th>
                    <th className="p-2 font-medium">{t("workspace_settings.settings.work_item_types.table.status")}</th>
                    <th className="w-40 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {issueTypes.map((row) => (
                    <tr key={row.id} className="border-t border-subtle">
                      <td className="p-2">
                        <div className="flex items-center gap-2 font-medium text-primary">
                          <SwitcherIcon logo_props={row.logo_props} LabelIcon={Layers} size={14} />
                          <span>{row.name}</span>
                          {row.is_epic ? (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-10 text-tertiary">
                              {t("workspace_settings.settings.work_item_types.epic_badge")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2 text-secondary">{row.properties?.length ?? 0}</td>
                      <td className="p-2 text-secondary">
                        {(row.project_ids ?? []).length === 0
                          ? t("workspace_settings.settings.work_item_types.table.no_projects")
                          : (row.project_ids ?? []).map((id) => getProjectById(id)?.name ?? id).join(", ")}
                      </td>
                      <td className="p-2">
                        <ToggleSwitch value={row.is_active} onChange={() => onToggleActive(row)} size="sm" />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-1">
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

export default observer(WorkItemTypesPage);
