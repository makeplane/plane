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

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
// plane imports
import { getPermissionGroupsByNamespace } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { ChevronLeftIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { PermissionNamespace, PermissionScheme, PermissionMatrixState } from "@plane/types";
import {
  expandFoldedPermissions,
  isMatrixStateEqual,
  matrixStateToPermissions,
  permissionsToMatrixState,
} from "@plane/utils";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { EditRoleDiscardChangesModal } from "@/components/settings/workspace/content/pages/roles-and-permissions/discard-changes-modal";
import { SchemeBasicInformation } from "./scheme-basic-information";
import { RoleDetailsPermissionsList } from "@/components/settings/workspace/content/pages/roles-and-permissions/form/permissions-list";
// hooks
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";

type Props = {
  workspaceSlug: string;
  namespace: PermissionNamespace;
};

type CreateSchemeFormData = Pick<PermissionScheme, "name" | "description">;

export const SchemeCreateRoot = observer(function SchemeCreateRoot(props: Props) {
  const { workspaceSlug, namespace } = props;
  // router
  const navigate = useNavigate();
  // state
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { createScheme } = usePermissionScheme();
  // derived values
  const groups = getPermissionGroupsByNamespace(namespace);
  const initialMatrixState = permissionsToMatrixState({}, groups);

  const [matrixState, setMatrixState] = useState<PermissionMatrixState>(initialMatrixState);

  // form hooks
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<CreateSchemeFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "all",
  });

  const resolvedPermissions = expandFoldedPermissions(matrixStateToPermissions(matrixState, groups), groups);
  const currentName = watch("name");
  const hasPermissions = Object.keys(resolvedPermissions).length > 0;
  const hasValidName = currentName.trim().length > 0;
  const isMatrixDirty = !isMatrixStateEqual(matrixState, initialMatrixState, groups);
  const hasUnsavedChanges = isDirty || isMatrixDirty;

  const backUrl = `/${workspaceSlug}/settings/${namespace}-roles-and-schemes/?tab=schemes`;

  const navigateToListRoot = () => {
    void navigate(backUrl);
  };

  const handleSaveChanges = async (formData: CreateSchemeFormData) => {
    try {
      await createScheme({
        workspaceSlug,
        data: {
          ...formData,
          namespace,
          permissions: Object.keys(resolvedPermissions),
        },
      });

      reset({ name: "", description: "" });
      setMatrixState(initialMatrixState);
      navigateToListRoot();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.create_scheme.error_toast_description"),
      });
    }
  };

  const isCreateButtonDisabled = !hasValidName || !hasPermissions;

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setIsDiscardChangesModalOpen(true);
      return;
    }
    navigateToListRoot();
  };

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <EditRoleDiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        handleClose={() => setIsDiscardChangesModalOpen(false)}
        handleDiscard={() => {
          reset({ name: "", description: "" });
          setMatrixState(initialMatrixState);
          navigateToListRoot();
        }}
      />
      <SettingsContentWrapper>
        <div className="-ml-3">
          <Link
            to={backUrl}
            className={getButtonStyling("ghost", "base")}
            onClick={(event) => {
              if (!hasUnsavedChanges) return;

              event.preventDefault();
              setIsDiscardChangesModalOpen(true);
            }}
          >
            <ChevronLeftIcon className="shrink-0 size-3.5" />
            {t("common.back")}
          </Link>
        </div>
        <div className="mt-4">
          <SettingsHeading
            title={t("workspace_settings.settings.roles_and_schemes.create_scheme.title")}
            description={t("workspace_settings.settings.roles_and_schemes.create_scheme.description")}
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
                    isEditing
                    name={name}
                    onDescriptionChange={onDescriptionChange}
                    onNameChange={onNameChange}
                  />
                )}
              />
            )}
          />

          <RoleDetailsPermissionsList
            isEditing
            namespace={namespace}
            workspaceSlug={workspaceSlug}
            groups={groups}
            matrixState={matrixState}
            onChange={setMatrixState}
          />
        </div>

        {!hasPermissions && (
          <p className="mt-2 text-caption-md-regular text-tertiary text-right">
            {t("workspace_settings.settings.roles_and_permissions.psets.ui.empty_permissions_note")}
          </p>
        )}
      </SettingsContentWrapper>

      <div className="@container sticky bottom-0 left-0 w-full border-t border-subtle py-3">
        <div className="mx-auto flex w-full max-w-225 items-center justify-end gap-3 px-page-x @min-[58.95rem]:px-0">
          <Button variant="secondary" size="lg" className="shrink-0" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              void handleSubmit(handleSaveChanges)();
            }}
            loading={isSubmitting}
            disabled={isCreateButtonDisabled}
            className="shrink-0"
          >
            {isSubmitting
              ? t("creating")
              : t("workspace_settings.settings.roles_and_schemes.create_scheme.create_button")}
          </Button>
        </div>
      </div>
    </div>
  );
});
