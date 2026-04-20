/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router";
// plane imports
import { getPermissionGroupsByNamespace } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { ChevronLeftIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import type { PermissionNamespace, PermissionScheme, PermissionMatrixState } from "@plane/types";
import {
  expandFoldedPermissions,
  isMatrixStateEqual,
  matrixStateToPermissions,
  permissionsToMatrixState,
} from "@plane/utils";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { SettingsHeading } from "@/components/settings/heading";
import { EditRoleDiscardChangesModal } from "@/components/settings/workspace/content/pages/roles-and-permissions/discard-changes-modal";
import { SchemeBasicInformation } from "./scheme-basic-information";
import { RoleDetailsPermissionsList } from "@/components/settings/workspace/content/pages/roles-and-permissions/form/permissions-list";
// hooks
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";

type Props = {
  workspaceSlug: string;
  namespace: PermissionNamespace;
  schemeSlug: string;
};

type EditSchemeFormData = Pick<PermissionScheme, "name" | "description">;

const SKELETON_PERMISSION_SECTIONS = [
  {
    titleWidths: ["50%", "80%", "55%"],
    itemWidths: ["44%", "36%", "48%", "42%", "38%"],
  },
  {
    titleWidths: ["42%", "80%", "70%", "40%"],
    itemWidths: ["36%", "42%", "68%", "44%"],
  },
] as const;

export const SchemeDetailRoot = observer(function SchemeDetailRoot(props: Props) {
  const { workspaceSlug, namespace, schemeSlug } = props;
  // state
  const [isEditing, setIsEditing] = useState(false);
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { can } = usePermissionAccess();
  const { loader, getSchemeDetailsBySchemeSlug, updateScheme } = usePermissionScheme();
  // derived values
  const scheme = getSchemeDetailsBySchemeSlug({ workspaceSlug, schemeSlug, namespace });
  // auth
  const canEdit = scheme
    ? can({ resource: "custom_role", action: "edit", workspaceSlug, resourceMeta: { resourceId: scheme.id } })
    : false;
  const groups = useMemo(() => getPermissionGroupsByNamespace(namespace), [namespace]);
  const isSystemScheme = scheme?.is_system ?? false;

  const permissionsDict = useMemo(
    () => Object.fromEntries((scheme?.permissions ?? []).map((p) => [p, true as const])),
    [scheme?.permissions]
  );

  const initialMatrixState = useMemo(
    () => permissionsToMatrixState(permissionsDict, groups),
    [groups, permissionsDict]
  );

  const [matrixState, setMatrixState] = useState<PermissionMatrixState>(initialMatrixState);

  const schemeFormValues = useMemo(
    () => ({
      name: scheme?.name ?? "",
      description: scheme?.description ?? "",
    }),
    [scheme?.description, scheme?.name]
  );

  // form hooks
  const {
    control,
    formState: { dirtyFields, errors, isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<EditSchemeFormData>({
    defaultValues: schemeFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!scheme) return;
    // Avoid stomping unsaved edits. When not editing, keep the UI in sync with the store.
    if (isEditing) return;
    reset(schemeFormValues);
    setMatrixState(initialMatrixState);
  }, [initialMatrixState, isEditing, reset, scheme, schemeFormValues]);

  const resolvedPermissions = expandFoldedPermissions(matrixStateToPermissions(matrixState, groups), groups);
  const hasPermissions = Object.keys(resolvedPermissions).length > 0;
  const isMatrixDirty = !isMatrixStateEqual(matrixState, initialMatrixState, groups);
  const hasUnsavedChanges = isDirty || isMatrixDirty;

  const handleDiscardEdits = () => {
    setIsEditing(false);
    reset({ name: scheme?.name ?? "", description: scheme?.description ?? "" });
    setMatrixState(initialMatrixState);
  };

  const handleCancelEditing = () => {
    if (hasUnsavedChanges) {
      setIsDiscardChangesModalOpen(true);
    } else {
      handleDiscardEdits();
    }
  };

  const handleSaveChanges = async (formData: EditSchemeFormData) => {
    if (!scheme) return;

    const payload: Partial<PermissionScheme> = {};

    if (dirtyFields.name) payload.name = formData.name;
    if (dirtyFields.description) payload.description = formData.description;
    if (isMatrixDirty) payload.permissions = Object.keys(resolvedPermissions);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateScheme({
        workspaceSlug,
        schemeId: scheme.id,
        data: payload,
      });
      setIsEditing(false);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.scheme_detail.error_toast_description"),
      });
    }
  };

  if (loader === "init-loader")
    return (
      <div className="size-full flex flex-col overflow-hidden">
        <SettingsContentWrapper>
          <div className="mt-4 space-y-2">
            <Loader.Item width="32%" height="40px" />
            <Loader.Item width="54%" height="16px" />
          </div>
          <div className="mt-12 grid grid-cols-9 gap-12 py-7">
            <div className="col-span-4 flex flex-col gap-y-3">
              <Loader.Item width="60%" height="28px" />
              <Loader.Item width="80%" height="14px" />
              <Loader.Item width="65%" height="14px" />
            </div>
            <div className="col-span-5 flex flex-col gap-y-6">
              <div className="flex flex-col gap-y-2">
                <Loader.Item width="24%" height="14px" />
                <Loader.Item width="48%" height="24px" />
              </div>
            </div>
          </div>
          {SKELETON_PERMISSION_SECTIONS.map((section, index) => (
            <div key={index} className="grid grid-cols-9 gap-12 py-7">
              <div className="col-span-4 flex flex-col gap-y-3">
                {section.titleWidths.map((width) => (
                  <Loader.Item key={width} width={width} height={width === section.titleWidths[0] ? "28px" : "14px"} />
                ))}
              </div>
              <div className="col-span-5 flex flex-col gap-y-6">
                {section.itemWidths.map((width) => (
                  <Loader.Item key={width} width={width} height="18px" />
                ))}
              </div>
            </div>
          ))}
        </SettingsContentWrapper>
      </div>
    );

  if (!scheme) return null;

  const backUrl = `/${workspaceSlug}/settings/${namespace}-roles-and-schemes/?tab=schemes`;

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <EditRoleDiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        handleClose={() => setIsDiscardChangesModalOpen(false)}
        handleDiscard={handleDiscardEdits}
      />
      <SettingsContentWrapper>
        <div className="-ml-3">
          <Link to={backUrl} className={getButtonStyling("ghost", "base")}>
            <ChevronLeftIcon className="shrink-0 size-3.5" />
            {t("common.back")}
          </Link>
        </div>
        <div className="mt-4">
          <SettingsHeading
            title={
              isEditing
                ? t("workspace_settings.settings.roles_and_schemes.scheme_detail.edit_title")
                : t("workspace_settings.settings.roles_and_schemes.scheme_detail.title")
            }
            description={
              isEditing
                ? t("workspace_settings.settings.roles_and_schemes.scheme_detail.edit_description")
                : t("workspace_settings.settings.roles_and_schemes.scheme_detail.description")
            }
            control={
              !isEditing &&
              !isSystemScheme &&
              canEdit && (
                <Button variant="secondary" size="lg" onClick={() => setIsEditing(true)}>
                  {t("workspace_settings.settings.roles_and_schemes.scheme_detail.edit_button")}
                </Button>
              )
            }
            variant="h4"
          />
        </div>
        <div className="mt-3 divide-y divide-subtle">
          <Controller
            control={control}
            name="name"
            rules={{
              required: "This field is required.",
            }}
            render={({ field: { onChange: onNameChange, value: name } }) => (
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange: onDescriptionChange, value: description } }) => (
                  <SchemeBasicInformation
                    description={description}
                    errors={errors}
                    isEditing={isEditing}
                    name={name}
                    onDescriptionChange={onDescriptionChange}
                    onNameChange={onNameChange}
                  />
                )}
              />
            )}
          />
          <RoleDetailsPermissionsList
            isEditing={isEditing}
            namespace={namespace}
            workspaceSlug={workspaceSlug}
            groups={groups}
            matrixState={matrixState}
            onChange={setMatrixState}
          />
        </div>
      </SettingsContentWrapper>
      {isEditing && (
        <div className="@container sticky bottom-0 left-0 w-full border-t border-subtle py-3">
          <div className="mx-auto flex w-full max-w-225 items-center justify-end gap-3 px-page-x @min-[58.95rem]:px-0">
            {!hasPermissions && (
              <p className="mr-auto text-caption-md-regular text-tertiary">
                {t("workspace_settings.settings.roles_and_permissions.psets.ui.empty_permissions_note")}
              </p>
            )}
            <Button variant="secondary" size="lg" onClick={handleCancelEditing} className="shrink-0">
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                void handleSubmit(handleSaveChanges)();
              }}
              loading={isSubmitting}
              disabled={!hasPermissions}
              className="shrink-0"
            >
              {isSubmitting ? t("saving") : t("save_changes")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
