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
import { CircleMinus } from "lucide-react";
import { Collapsible } from "@plane/propel/collapsible";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IUserLite, TProjectMembership } from "@plane/types";
import { CustomMenu, CustomSelect } from "@plane/ui";
import { getFileURL, isGuestRole, isWithinGuestCeiling, getAssignableProjectRoles } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";

export interface RowData extends Pick<TProjectMembership, "role_slug"> {
  member: IUserLite;
}

type NameProps = {
  rowData: RowData;
  workspaceSlug: string;
  currentUser: IUser | undefined;
  setRemoveMemberModal: (rowData: RowData) => void;
  canRemoveMember: boolean;
};

type AccountTypeProps = {
  rowData: RowData;
  workspaceSlug: string;
  projectId: string;
  canChangeRole: (targetRoleSlug: string) => boolean;
};

export function NameColumn(props: NameProps) {
  const { rowData, workspaceSlug, currentUser, setRemoveMemberModal, canRemoveMember } = props;
  // derived values
  const { avatar_url, display_name, email, first_name, id, last_name } = rowData.member;

  return (
    <Collapsible>
      <div className="relative group">
        <div className="flex items-center gap-2 w-72">
          <div className="flex items-center gap-x-2 gap-y-2 flex-1">
            {avatar_url && avatar_url.trim() !== "" ? (
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
                <span className="relative flex size-6 items-center justify-center rounded-full bg-layer-3 capitalize text-on-color text-11">
                  {(email ?? display_name ?? "?")[0]}
                </span>
              </Link>
            )}
            {first_name} {last_name}
          </div>
          {(canRemoveMember || id === currentUser?.id) && (
            <CustomMenu
              ellipsis
              buttonClassName="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              optionsClassName="p-1.5"
              placement="bottom-end"
            >
              <CustomMenu.MenuItem>
                <button
                  className="flex items-center gap-x-1 cursor-pointer text-danger-primary font-medium"
                  onClick={() => setRemoveMemberModal(rowData)}
                >
                  <CircleMinus className="shrink-0 size-3.5" />
                  {rowData.member?.id === currentUser?.id ? "Leave " : "Remove "}
                </button>
              </CustomMenu.MenuItem>
            </CustomMenu>
          )}
        </div>
      </div>
    </Collapsible>
  );
}

export const AccountTypeColumn = observer(function AccountTypeColumn(props: AccountTypeProps) {
  const { rowData, projectId, workspaceSlug, canChangeRole } = props;
  // store hooks
  const {
    project: { updateMemberRole },
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { getProjectRolesByWorkspaceSlug, getProjectRoleDetailsByRoleSlug } = useRoleManagement();
  const { getCurrentUserProjectRoleSlug } = usePermissionAccess();
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  // derived values
  const roleLabel = getProjectRoleDetailsByRoleSlug(workspaceSlug, rowData.role_slug)?.name ?? rowData.role_slug;
  const wsRoleSlug = getWorkspaceMemberDetails(rowData.member.id)?.role_slug;
  const isRoleEditable = canChangeRole(rowData.role_slug);
  const assignableRoles = getAssignableProjectRoles(
    getProjectRolesByWorkspaceSlug(workspaceSlug, "active"),
    getCurrentUserProjectRoleSlug(projectId)
  );
  const allowedRoles = isGuestRole(wsRoleSlug)
    ? assignableRoles.filter((r) => isWithinGuestCeiling(r.slug))
    : assignableRoles;

  return (
    <>
      {isRoleEditable ? (
        <Controller
          name="role"
          control={control}
          rules={{ required: "Role is required." }}
          render={() => (
            <CustomSelect
              value={rowData.role_slug}
              onChange={async (value: string) => {
                if (!workspaceSlug) return;
                await updateMemberRole(workspaceSlug.toString(), projectId.toString(), rowData.member.id, {
                  role_slug: value,
                }).catch((err) => {
                  console.log(err, "err");
                  const error = err.error;
                  const errorString = Array.isArray(error) ? error[0] : error;

                  setToast({
                    type: TOAST_TYPE.ERROR,
                    title: "You can't change this role yet.",
                    message: errorString ?? "An error occurred while updating member role. Please try again.",
                  });
                });
              }}
              label={
                <div className="flex ">
                  <span>{roleLabel}</span>
                </div>
              }
              buttonClassName={`px-0! justify-start! hover:bg-surface-1 ${errors.role ? "border-danger-strong" : "border-none"}`}
              className="rounded-md p-0 w-32"
              input
            >
              {allowedRoles.map((role) => (
                <CustomSelect.Option key={role.slug} value={role.slug}>
                  {role.name}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      ) : (
        <div className="w-32 flex ">
          <span>{roleLabel}</span>
        </div>
      )}
    </>
  );
});
