/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectCustomField, TProjectCustomFieldType } from "@plane/types";
import { CustomSelect, Loader } from "@plane/ui";
// hooks
import { useProjectCustomField } from "@/hooks/store/use-project-custom-field";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { SettingsHeading } from "../settings/heading";
import { ProjectCustomFieldOptionsEditor } from "./custom-field-options-editor";
import { ProjectCustomFieldValueInput } from "./custom-field-value-input";
import { DeleteProjectCustomFieldModal } from "./delete-custom-field-modal";
import { SendProjectDataModal } from "./send-project-data-modal";

const FIELD_TYPES: TProjectCustomFieldType[] = ["number", "text", "date", "dropdown", "member"];

export const ProjectCustomFieldList = observer(function ProjectCustomFieldList() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<TProjectCustomFieldType>("number");
  const [isCreating, setIsCreating] = useState(false);
  const [selectDeleteField, setSelectDeleteField] = useState<IProjectCustomField | null>(null);
  const [showSendDataModal, setShowSendDataModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    getProjectCustomFields,
    getFieldValue,
    getFieldOptions,
    fetchProjectCustomFields,
    fetchProjectCustomFieldValues,
    fetchFieldOptions,
    createCustomField,
    setCustomFieldValue,
  } = useProjectCustomField();
  const { allowPermissions } = useUserPermissions();
  // derived values
  // Field definitions (add/delete) are admin-only; the backend allows MEMBER role
  // to write values, so the value input must not be gated behind the admin-only flag.
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const canEditValue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const customFields = getProjectCustomFields(projectId?.toString());

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    fetchProjectCustomFields(workspaceSlug.toString(), projectId.toString());
    fetchProjectCustomFieldValues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchProjectCustomFields, fetchProjectCustomFieldValues]);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !customFields) return;
    customFields
      .filter((field) => field.field_type === "dropdown")
      .forEach((field) => fetchFieldOptions(workspaceSlug.toString(), projectId.toString(), field.id));
  }, [workspaceSlug, projectId, customFields, fetchFieldOptions]);

  const handleCreate = async () => {
    if (!workspaceSlug || !projectId || !newFieldName.trim() || isCreating) return;
    setIsCreating(true);
    await createCustomField(workspaceSlug.toString(), projectId.toString(), {
      name: newFieldName.trim(),
      field_type: newFieldType,
    })
      .then(() => {
        setNewFieldName("");
        setNewFieldType("number");
        setShowCreateForm(false);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_custom_field.settings.toasts.create.success.title"),
          message: t("project_custom_field.settings.toasts.create.success.message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_custom_field.settings.toasts.create.error.title"),
          message: t("project_custom_field.settings.toasts.create.error.message"),
        });
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  return (
    <>
      <DeleteProjectCustomFieldModal
        isOpen={!!selectDeleteField}
        data={selectDeleteField}
        onClose={() => setSelectDeleteField(null)}
      />
      <SendProjectDataModal isOpen={showSendDataModal} onClose={() => setShowSendDataModal(false)} />
      <SettingsHeading
        title={t("project_custom_field.settings.title")}
        description={t("project_custom_field.settings.description")}
        control={
          isEditable && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="lg" onClick={() => setShowSendDataModal(true)}>
                {t("project_custom_field.settings.send_data.trigger_button")}
              </Button>
              <Button variant="primary" size="lg" onClick={() => setShowCreateForm(true)}>
                {t("project_custom_field.settings.add_button")}
              </Button>
            </div>
          )
        }
      />
      <div className="mt-6 w-full space-y-2">
        {showCreateForm && (
          <div className="flex w-full items-center gap-2 rounded-sm border border-subtle px-3.5 py-2">
            <InputGroup size="2xl" className="flex-1">
              <Input
                size="2xl"
                type="text"
                autoFocus
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder={t("project_custom_field.settings.form.name_placeholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </InputGroup>
            <CustomSelect
              value={newFieldType}
              label={<span>{t(`project_custom_field.settings.field_types.${newFieldType}`)}</span>}
              onChange={(type: TProjectCustomFieldType) => setNewFieldType(type)}
              buttonClassName="border border-subtle rounded-sm"
            >
              {FIELD_TYPES.map((type) => (
                <CustomSelect.Option key={type} value={type}>
                  {t(`project_custom_field.settings.field_types.${type}`)}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setNewFieldName("");
                setNewFieldType("number");
              }}
            >
              {t("project_custom_field.settings.form.cancel")}
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={isCreating}>
              {t("project_custom_field.settings.form.create")}
            </Button>
          </div>
        )}
        {customFields ? (
          customFields.length === 0 && !showCreateForm ? (
            <div className="rounded-sm border border-subtle px-3.5 py-8 text-center">
              <p className="text-body-sm-medium text-primary">{t("project_custom_field.settings.empty_state.title")}</p>
              <p className="mt-1 text-body-xs-regular text-tertiary">
                {t("project_custom_field.settings.empty_state.description")}
              </p>
            </div>
          ) : (
            customFields.map((field) => (
              <div key={field.id} className="rounded-sm border border-subtle px-3.5 py-2">
                <div className="flex w-full items-center gap-3">
                  <div className="w-1/3 truncate text-body-sm-medium text-primary">{field.name}</div>
                  <div className="flex-1">
                    <ProjectCustomFieldValueInput
                      field={field}
                      value={getFieldValue(field.id)}
                      options={getFieldOptions(field.id)}
                      projectId={projectId!.toString()}
                      disabled={!canEditValue}
                      onSave={(data) => setCustomFieldValue(workspaceSlug!.toString(), projectId!.toString(), field.id, data)}
                    />
                  </div>
                  {isEditable && (
                    <button
                      type="button"
                      className="flex-shrink-0 rounded-sm p-1.5 text-tertiary hover:bg-surface-2 hover:text-danger-primary"
                      onClick={() => setSelectDeleteField(field)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                {field.field_type === "dropdown" && (
                  <ProjectCustomFieldOptionsEditor
                    workspaceSlug={workspaceSlug!.toString()}
                    projectId={projectId!.toString()}
                    fieldId={field.id}
                    disabled={!isEditable}
                  />
                )}
              </div>
            ))
          )
        ) : (
          !showCreateForm && (
            <Loader className="space-y-2">
              <Loader.Item height="46px" />
              <Loader.Item height="46px" />
              <Loader.Item height="46px" />
            </Loader>
          )
        )}
      </div>
    </>
  );
});
