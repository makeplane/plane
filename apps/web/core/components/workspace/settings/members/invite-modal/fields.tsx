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

import { observer } from "mobx-react";
import type { Control, FieldArrayWithId, FormState } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import { CustomSelect, Input } from "@plane/ui";
import { cn, getAssignableWorkspaceRoles } from "@plane/utils";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";
import type { InvitationFormValues } from "@/hooks/use-workspace-invitation";

type TInvitationFieldsProps = {
  workspaceSlug: string;
  fields: FieldArrayWithId<InvitationFormValues, "emails", "id">[];
  control: Control<InvitationFormValues>;
  formState: FormState<InvitationFormValues>;
  remove: (index: number) => void;
  className?: string;
};

export const InvitationFields = observer(function InvitationFields(props: TInvitationFieldsProps) {
  const {
    workspaceSlug,
    fields,
    control,
    formState: { errors },
    remove,
    className,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getRoleDetailsByRoleSlug, getWorkspaceRolesByWorkspaceSlug } = useRoleManagement();
  const { getCurrentUserWorkspaceRoleSlug } = usePermissionAccess();
  // derived values
  const assignableWorkspaceRoles = getAssignableWorkspaceRoles(
    getWorkspaceRolesByWorkspaceSlug(workspaceSlug, "active"),
    getCurrentUserWorkspaceRoleSlug(workspaceSlug)
  );

  return (
    <div className={cn("mb-3 space-y-4", className)}>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative group mb-1 flex items-start justify-between gap-x-2 text-body-xs-regular w-full"
        >
          <div className="w-full">
            <Controller
              control={control}
              name={`emails.${index}.email`}
              rules={{
                required: t("workspace_settings.settings.members.modal.errors.required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("workspace_settings.settings.members.modal.errors.invalid"),
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <>
                  <Input
                    id={`emails.${index}.email`}
                    name={`emails.${index}.email`}
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.emails?.[index]?.email)}
                    placeholder={t("workspace_settings.settings.members.modal.placeholder")}
                    className="w-full text-caption-sm-regular sm:text-body-xs-regular"
                  />
                  {errors.emails?.[index]?.email && (
                    <span className="ml-1 text-caption-sm-regular text-danger-primary">
                      {errors.emails?.[index]?.email?.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name={`emails.${index}.role_slug`}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    label={
                      <span className="text-caption-sm-regular sm:text-body-xs-regular">
                        {getRoleDetailsByRoleSlug({ workspaceSlug, roleSlug: value, namespace: "workspace" })?.name ??
                          "Select role"}
                      </span>
                    }
                    onChange={onChange}
                    className="grow w-32"
                    input
                  >
                    {assignableWorkspaceRoles.map((role) => {
                      return (
                        <CustomSelect.Option key={role.slug} value={role.slug}>
                          {role.name}
                        </CustomSelect.Option>
                      );
                    })}
                  </CustomSelect>
                )}
              />
            </div>
            {fields.length > 1 && (
              <div className="flex-item flex w-6">
                <button
                  type="button"
                  className="place-items-center self-center rounded-sm"
                  onClick={() => remove(index)}
                >
                  <CloseIcon className="h-4 w-4 text-secondary" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
