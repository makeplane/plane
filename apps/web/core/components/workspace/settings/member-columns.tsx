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
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { Collapsible } from "@plane/propel/collapsible";
import { TrashIcon, SuspendedUserIcon } from "@plane/propel/icons";
import { Pill, EPillVariant, EPillSize } from "@plane/propel/pill";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IWorkspaceMember } from "@plane/types";
import { CustomSelect, PopoverMenu } from "@plane/ui";
import { getFileURL, getAssignableWorkspaceRoles } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useUser } from "@/hooks/store/user";
import { useRoleManagement } from "@/hooks/store/use-role-management";

export type RowData = IWorkspaceMember;

type NameProps = {
  rowData: RowData;
  workspaceSlug: string;
  permissions: {
    canRemoveMember: boolean;
  };
  currentUser: IUser | undefined;
  setRemoveMemberModal: (rowData: RowData) => void;
};

type AccountTypeProps = {
  rowData: RowData;
  workspaceSlug: string;
  permissions: {
    canChangeRole: (targetRoleSlug: string) => boolean;
  };
};

export function NameColumn(props: NameProps) {
  const { rowData, workspaceSlug, permissions, currentUser, setRemoveMemberModal } = props;
  // derived values
  const { avatar_url, display_name, email, first_name, id, last_name } = rowData.member;
  const isSuspended = rowData.is_active === false;

  return (
    <Collapsible>
      <div className="relative group">
        <div className="flex items-center gap-x-4 gap-y-2 w-72 justify-between">
          <div className="flex items-center gap-x-2 gap-y-2 flex-1">
            {isSuspended ? (
              <div className="bg-layer-1 rounded-full">
                <SuspendedUserIcon className="size-6 text-placeholder" />
              </div>
            ) : avatar_url && avatar_url.trim() !== "" ? (
              <Link href={`/${workspaceSlug}/profile/${id}`}>
                <span className="relative flex size-6 items-center justify-center rounded-full capitalize text-on-color">
                  <img
                    src={getFileURL(avatar_url)}
                    className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                    alt={display_name || email}
                  />
                </span>
              </Link>
            ) : (
              <Link href={`/${workspaceSlug}/profile/${id}`}>
                <span className="relative flex size-6 text-11 items-center justify-center rounded-full  capitalize text-tertiary bg-layer-3">
                  {(email ?? display_name ?? "?")[0]}
                </span>
              </Link>
            )}
            <span className={isSuspended ? "text-placeholder" : ""}>
              {first_name} {last_name}
            </span>
          </div>

          {!isSuspended && (permissions.canRemoveMember || id === currentUser?.id) && (
            <PopoverMenu
              data={[""]}
              keyExtractor={(item) => item}
              popoverClassName="justify-end"
              buttonClassName="outline-none	origin-center rotate-90 size-8 aspect-square shrink-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
              render={() => (
                <div
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-x-3 cursor-pointer"
                  onClick={() => setRemoveMemberModal(rowData)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setRemoveMemberModal(rowData);
                    }
                  }}
                >
                  <TrashIcon className="size-3.5 align-middle" /> {id === currentUser?.id ? "Leave " : "Remove "}
                </div>
              )}
            />
          )}
        </div>
      </div>
    </Collapsible>
  );
}

export const AccountTypeColumn = observer(function AccountTypeColumn(props: AccountTypeProps) {
  const { rowData, workspaceSlug, permissions } = props;
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  // store hooks
  const {
    workspace: { updateMember },
  } = useMember();
  const { data: currentUser } = useUser();
  const { getWorkspaceRolesByWorkspaceSlug, getWorkspaceRoleDetailsByRoleSlug } = useRoleManagement();
  const { getCurrentUserWorkspaceRoleSlug } = usePermissionAccess();
  // derived values
  const isCurrentUserRow = currentUser?.id === rowData.member.id;
  const isRoleEditable = !isCurrentUserRow && permissions.canChangeRole(rowData.role_slug);
  const isSuspended = rowData.is_active === false;
  const memberRoleDetails = getWorkspaceRoleDetailsByRoleSlug(workspaceSlug, rowData.role_slug);
  const assignableWorkspaceRoles = getAssignableWorkspaceRoles(
    getWorkspaceRolesByWorkspaceSlug(workspaceSlug, "active"),
    getCurrentUserWorkspaceRoleSlug(workspaceSlug)
  );

  return (
    <>
      {isSuspended ? (
        <div className="w-32 flex ">
          <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="border-none">
            Suspended
          </Pill>
        </div>
      ) : !isRoleEditable ? (
        <div className="w-32 flex ">
          <span>{memberRoleDetails?.name ?? "—"}</span>
        </div>
      ) : (
        <Controller
          name="role_slug"
          control={control}
          rules={{ required: "Role is required." }}
          render={() => (
            <CustomSelect
              value={rowData.role_slug}
              onChange={async (value: string) => {
                try {
                  await updateMember(workspaceSlug, rowData.member.id, {
                    role_slug: value,
                  });
                } catch (err: unknown) {
                  const error = err as { error?: string | string[] };
                  const errorString = Array.isArray(error?.error) ? error.error[0] : error?.error;

                  setToast({
                    type: TOAST_TYPE.ERROR,
                    title: "Error!",
                    message: errorString ?? "An error occurred while updating member role. Please try again.",
                  });
                }
              }}
              label={
                <div className="flex ">
                  <span>{memberRoleDetails?.name ?? "—"}</span>
                </div>
              }
              buttonClassName={`px-0! justify-start! hover:bg-surface-1 ${errors.role ? "border-danger-strong" : "border-none"}`}
              className="rounded-md p-0 w-32"
              input
            >
              {assignableWorkspaceRoles.map((role) => (
                <CustomSelect.Option key={role.slug} value={role.slug}>
                  {role.name}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      )}
    </>
  );
});
